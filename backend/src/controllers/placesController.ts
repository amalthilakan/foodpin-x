import axios from 'axios';
import { Request, Response } from 'express';

// Restaurant search backed by OpenStreetMap's free Overpass API (no API key).
// Results are returned in the same shape the app already consumes
// ({ status, results: [{ place_id, name, vicinity, geometry, rating }] }).
//
// The public Overpass servers are shared and often busy, so instead of one
// name-regex query per keystroke we fetch every food place in an area once,
// cache it, and filter by keyword locally. Typing never hits Overpass again
// until the user moves to a different area or the cache expires.

const OVERPASS_URLS = (process.env.OVERPASS_URL
    ? [process.env.OVERPASS_URL]
    : [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.private.coffee/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
    ]);
const FOOD_AMENITIES = 'restaurant|fast_food|cafe|food_court|bar|pub|ice_cream';
const MAX_RESULTS = 30;
const MAX_RADIUS = 10000;
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;
// Per mirror; with three mirrors a search gives up after ~36s at worst
const REQUEST_TIMEOUT_MS = 12000;

interface OverpassElement {
    type: 'node' | 'way' | 'relation';
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
}

export interface Place {
    place_id: string;
    name: string;
    vicinity: string;
    geometry: { location: { lat: number; lng: number } };
    cuisine?: string;
}

export const buildAreaQuery = (latitude: number, longitude: number, radius: number) =>
    `[out:json][timeout:12];
nwr["amenity"~"^(${FOOD_AMENITIES})$"]["name"](around:${radius},${latitude},${longitude});
out center;`;

const formatAddress = (tags: Record<string, string>) => {
    if (tags['addr:full']) return tags['addr:full'];
    const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
    const address = [street, tags['addr:suburb'], tags['addr:city']].filter(Boolean).join(', ');
    if (address) return address;
    // Bookmarks require an address, so fall back to something descriptive
    const cuisine = tags.cuisine ? tags.cuisine.replace(/_/g, ' ').replace(/;/g, ', ') : '';
    return cuisine ? `${cuisine} (address not listed)` : 'Address not listed';
};

export const toPlaces = (elements: OverpassElement[]): Place[] => {
    const seen = new Set<string>();
    const places: Place[] = [];
    for (const el of elements) {
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon ?? el.center?.lon;
        const tags = el.tags || {};
        const placeId = `osm-${el.type}-${el.id}`;
        if (lat == null || lng == null || !tags.name || seen.has(placeId)) continue;
        seen.add(placeId);
        places.push({
            place_id: placeId,
            name: tags.name,
            vicinity: formatAddress(tags),
            geometry: { location: { lat, lng } },
            cuisine: tags.cuisine,
        });
    }
    return places;
};

// Lowercase and strip accents so "cafe" matches "Café"
const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const distanceSq = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLat = lat1 - lat2;
    const dLng = (lng1 - lng2) * Math.cos((lat1 * Math.PI) / 180);
    return dLat * dLat + dLng * dLng;
};

export const filterPlaces = (places: Place[], keyword: string, latitude: number, longitude: number) => {
    const query = normalize(keyword.trim());
    return places
        .map((place) => {
            const name = normalize(place.name);
            const cuisine = normalize(place.cuisine || '').replace(/_/g, ' ');
            // Rank: name starts with query > a word in the name starts with it > name/cuisine contains it
            let rank = -1;
            if (name.startsWith(query)) rank = 0;
            else if (name.split(/[\s\-'&]+/).some((word) => word.startsWith(query))) rank = 1;
            else if (name.includes(query) || cuisine.includes(query)) rank = 2;
            return { place, rank };
        })
        .filter(({ rank }) => rank >= 0)
        .sort((a, b) =>
            a.rank - b.rank ||
            distanceSq(a.place.geometry.location.lat, a.place.geometry.location.lng, latitude, longitude) -
            distanceSq(b.place.geometry.location.lat, b.place.geometry.location.lng, latitude, longitude)
        )
        .slice(0, MAX_RESULTS)
        .map(({ place }) => place);
};

// ---- Area cache ----

type CacheEntry = { places: Place[]; fetchedAt: number };
const areaCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<Place[]>>();

// ~1.1 km grid so small map pans reuse the same area
export const areaKey = (latitude: number, longitude: number, radius: number) =>
    `${latitude.toFixed(2)},${longitude.toFixed(2)},${radius}`;

const fetchAreaFromOverpass = async (latitude: number, longitude: number, radius: number): Promise<Place[]> => {
    const body = new URLSearchParams({ data: buildAreaQuery(latitude, longitude, radius) }).toString();
    let lastError: any;
    for (const url of OVERPASS_URLS) {
        try {
            const response = await axios.post(url, body, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    // Overpass asks clients to identify themselves
                    'User-Agent': 'FoodPin/1.0 (restaurant bookmarking app)',
                },
                timeout: REQUEST_TIMEOUT_MS,
            });
            // Overpass can answer 200 with no data and a "remark" when the query timed out
            if (response.data?.remark && /error|timed out|timeout/i.test(response.data.remark)) {
                throw new Error(`Overpass: ${response.data.remark}`);
            }
            if (!Array.isArray(response.data?.elements)) {
                throw new Error('Overpass: unexpected response');
            }
            return toPlaces(response.data.elements);
        } catch (error: any) {
            lastError = error;
            console.warn(`Overpass request to ${new URL(url).host} failed:`, error.response?.status || error.message);
        }
    }
    throw lastError;
};

export const getAreaPlaces = async (latitude: number, longitude: number, radius: number): Promise<Place[]> => {
    // Snap to the grid so nearby requests share one Overpass query and cache entry
    const snappedLat = Number(latitude.toFixed(2));
    const snappedLng = Number(longitude.toFixed(2));
    const key = areaKey(snappedLat, snappedLng, radius);
    const cached = areaCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.places;

    // Concurrent searches for the same area wait on a single Overpass request
    let pending = inFlight.get(key);
    if (!pending) {
        pending = fetchAreaFromOverpass(snappedLat, snappedLng, radius)
            .then((places) => {
                areaCache.delete(key);
                areaCache.set(key, { places, fetchedAt: Date.now() });
                if (areaCache.size > MAX_CACHE_ENTRIES) {
                    areaCache.delete(areaCache.keys().next().value as string);
                }
                return places;
            })
            .finally(() => inFlight.delete(key));
        inFlight.set(key, pending);
    }

    try {
        return await pending;
    } catch (error) {
        // Better to show slightly old results than none while Overpass is busy
        if (cached) return cached.places;
        throw error;
    }
};

export const searchPlaces = async (req: Request, res: Response) => {
    try {
        const { keyword, latitude, longitude, radius = 5000 } = req.query;

        if (!keyword || !latitude || !longitude) {
            res.status(400).json({ message: 'Missing required parameters' });
            return;
        }

        const lat = Number(latitude);
        const lng = Number(longitude);
        const searchRadius = Math.min(Number(radius) || 5000, MAX_RADIUS);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            res.status(400).json({ message: 'Invalid coordinates' });
            return;
        }

        const places = await getAreaPlaces(lat, lng, searchRadius);
        const results = filterPlaces(places, String(keyword), lat, lng);
        res.json({ status: results.length ? 'OK' : 'ZERO_RESULTS', results });
    } catch (error: any) {
        const status = error.response?.status;
        console.error('❌ Places search error:', status || error.message);
        res.status(503).json({
            message: 'Map search is busy right now. Please try again in a moment.',
        });
    }
};
