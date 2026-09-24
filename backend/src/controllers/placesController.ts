import axios from 'axios';
import { Request, Response } from 'express';

// Restaurant search backed by OpenStreetMap's free Overpass API (no API key).
// Results are returned in the same shape the app already consumes
// ({ status, results: [{ place_id, name, vicinity, geometry, rating }] }).

const OVERPASS_URL = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const FOOD_AMENITIES = 'restaurant|fast_food|cafe|food_court|bar|pub|ice_cream';
const MAX_RESULTS = 30;
const MAX_RADIUS = 20000;

interface OverpassElement {
    type: 'node' | 'way' | 'relation';
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
}

// Escape user input for use inside an Overpass regex within a double-quoted string
export const escapeOverpassRegex = (value: string) =>
    value
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');

export const buildOverpassQuery = (keyword: string, latitude: number, longitude: number, radius: number) => {
    const pattern = escapeOverpassRegex(keyword.trim());
    const around = `(around:${radius},${latitude},${longitude})`;
    const amenity = `["amenity"~"^(${FOOD_AMENITIES})$"]`;
    return `[out:json][timeout:20];
(
  nwr${amenity}["name"~"${pattern}",i]${around};
  nwr${amenity}["cuisine"~"${pattern}",i]${around};
);
out center ${MAX_RESULTS * 2};`;
};

const formatAddress = (tags: Record<string, string>) => {
    if (tags['addr:full']) return tags['addr:full'];
    const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
    const address = [street, tags['addr:suburb'], tags['addr:city']].filter(Boolean).join(', ');
    if (address) return address;
    // Bookmarks require an address, so fall back to something descriptive
    const cuisine = tags.cuisine ? tags.cuisine.replace(/_/g, ' ').replace(/;/g, ', ') : '';
    return cuisine ? `${cuisine} (address not listed)` : 'Address not listed';
};

const distanceSq = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLat = lat1 - lat2;
    const dLng = (lng1 - lng2) * Math.cos((lat1 * Math.PI) / 180);
    return dLat * dLat + dLng * dLng;
};

export const toPlaceResults = (elements: OverpassElement[], latitude: number, longitude: number) => {
    const seen = new Set<string>();
    return elements
        .map((el) => {
            const lat = el.lat ?? el.center?.lat;
            const lng = el.lon ?? el.center?.lon;
            const tags = el.tags || {};
            if (lat == null || lng == null || !tags.name) return null;
            const placeId = `osm-${el.type}-${el.id}`;
            if (seen.has(placeId)) return null;
            seen.add(placeId);
            return {
                place_id: placeId,
                name: tags.name,
                vicinity: formatAddress(tags),
                geometry: { location: { lat, lng } },
                cuisine: tags.cuisine,
            };
        })
        .filter((place): place is NonNullable<typeof place> => place !== null)
        .sort((a, b) =>
            distanceSq(a.geometry.location.lat, a.geometry.location.lng, latitude, longitude) -
            distanceSq(b.geometry.location.lat, b.geometry.location.lng, latitude, longitude)
        )
        .slice(0, MAX_RESULTS);
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

        const query = buildOverpassQuery(String(keyword), lat, lng, searchRadius);
        const response = await axios.post(OVERPASS_URL, new URLSearchParams({ data: query }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                // Overpass asks clients to identify themselves
                'User-Agent': 'FoodPin/1.0 (restaurant bookmarking app)',
            },
            timeout: 25000,
        });

        const results = toPlaceResults(response.data.elements || [], lat, lng);
        res.json({ status: results.length ? 'OK' : 'ZERO_RESULTS', results });
    } catch (error: any) {
        const status = error.response?.status;
        console.error('❌ Places search error:', status, error.response?.data || error.message);
        const busy = status === 429 || status === 504;
        res.status(busy ? 503 : 500).json({
            message: busy ? 'Map search is busy right now. Please try again in a moment.' : 'Failed to search places',
        });
    }
};
