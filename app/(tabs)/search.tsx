import { FontAwesome, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LeafletMap, { LatLng, LeafletMapHandle, MapMarker, Region } from '../../src/components/LeafletMap';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SHADOWS, SPACING } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { getAuthHeaders } from '../../src/utils/auth';

interface PlaceDetails {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
    rating?: number;
    vicinity?: string;
    formatted_phone_number?: string;
}

interface PlaceSuggestion {
    place_id: string;
    description: string;
    vicinity?: string;
    geometry?: any;
    rating?: number;
}

export default function Search() {
    const { colors } = useTheme();
    const mapRef = useRef<LeafletMapHandle>(null);
    // The map is uncontrolled; this tracks where it currently is so searches
    // use the visible area and re-renders don't snap the map back.
    const regionRef = useRef<Region | null>(null);
    const isLocatingRef = useRef(false);
    const searchRequestId = useRef(0);
    const [places, setPlaces] = useState<PlaceDetails[]>([]);
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
    const [searchError, setSearchError] = useState('');
    const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
    const [exploreMode, setExploreMode] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [userLocation, setUserLocation] = useState<LatLng | null>(null);
    const [successVisible, setSuccessVisible] = useState(false);
    const insets = useSafeAreaInsets();

    const moveTo = (newRegion: Region, duration: number) => {
        regionRef.current = newRegion;
        mapRef.current?.animateToRegion(newRegion, duration);
    };

    const getCurrentLocation = useCallback(async () => {
        if (isLocatingRef.current) return;
        try {
            isLocatingRef.current = true;
            setIsLocating(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to search nearby restaurants');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
            moveTo({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 300);
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'Failed to get current location');
        } finally {
            isLocatingRef.current = false;
            setIsLocating(false);
        }
    }, []);

    useEffect(() => {
        getCurrentLocation();
    }, [getCurrentLocation]);

    useEffect(() => {
        if (successVisible) {
            const timer = setTimeout(() => {
                setSuccessVisible(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successVisible]);

    const fetchBookmarks = useCallback(async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.get('/bookmarks', headers);
            const formatted = response.data.map((b: any) => ({
                place_id: b.placeId, // Use placeId from backend
                name: b.name,
                formatted_address: b.address,
                geometry: {
                    location: {
                        lat: b.location.latitude,
                        lng: b.location.longitude,
                    },
                },
                rating: b.rating,
                vicinity: b.address,
            }));
            setPlaces(formatted);
            if (formatted.length > 0) {
                mapRef.current?.fitToCoordinates(
                    formatted.map((p: PlaceDetails) => ({ latitude: p.geometry.location.lat, longitude: p.geometry.location.lng })),
                    { edgePadding: { top: 120, right: 60, bottom: 160, left: 60 } }
                );
            }
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
        }
    }, []);

    // Refresh bookmark markers whenever explore mode is on and the tab gains focus
    useFocusEffect(
        useCallback(() => {
            if (exploreMode) {
                fetchBookmarks();
            }
        }, [exploreMode, fetchBookmarks])
    );

    const toggleExploreMode = () => {
        setPlaces([]);
        setSelectedPlace(null);
        setSearch('');
        setSuggestions([]);
        setSearchError('');
        setExploreMode((prev) => !prev);
    };

    const debouncedFetchSuggestions = useMemo(
        () => debounce(async (input: string) => {
            const region = regionRef.current;
            if (!input) return;
            if (!region) {
                setSearchError('Waiting for your location. Tap the location button and try again.');
                return;
            }
            const requestId = ++searchRequestId.current;
            try {
                const headers = await getAuthHeaders();
                const response = await axios.get('/places/search', {
                    params: {
                        keyword: input,
                        latitude: region.latitude,
                        longitude: region.longitude,
                        radius: 5000
                    },
                    ...headers
                });
                // Ignore responses for queries the user has already typed past
                if (requestId !== searchRequestId.current) return;

                const results = (response.data.results || []).map((item: any) => ({
                    place_id: item.place_id,
                    description: item.name, // Use name for display
                    vicinity: item.vicinity, // Store address
                    geometry: item.geometry, // Store geometry directly
                    rating: item.rating,
                }));

                setSuggestions(results);
                setSearchError(results.length === 0 ? 'No restaurants found nearby' : '');
            } catch (error: any) {
                if (requestId !== searchRequestId.current) return;
                console.error('Nearby search error:', error);
                setSuggestions([]);
                setSearchError(error.response?.data?.message || 'Search failed. Please try again.');
            }
        }, 500),
        []
    );

    useEffect(() => () => debouncedFetchSuggestions.cancel(), [debouncedFetchSuggestions]);

    useEffect(() => {
        if (search.trim().length > 1 && !exploreMode) {
            debouncedFetchSuggestions(search.trim());
        } else {
            debouncedFetchSuggestions.cancel();
            searchRequestId.current++;
            setSuggestions([]);
            setSearchError('');
        }
    }, [search, exploreMode, debouncedFetchSuggestions]);

    const fetchPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
        // For nearbysearch results, we already have the geometry in suggestions
        // So we can construct the place details from the suggestion
        const suggestion = suggestions.find(s => s.place_id === placeId);
        if (suggestion && suggestion.geometry) {
            return {
                place_id: suggestion.place_id,
                name: suggestion.description,
                formatted_address: suggestion.vicinity || '',
                vicinity: suggestion.vicinity,
                rating: suggestion.rating,
                geometry: suggestion.geometry,
            };
        }
        return null;
    };

    const saveRestaurant = async (place: PlaceDetails) => {
        try {
            const headers = await getAuthHeaders();
            await axios.post('/bookmarks', {
                placeId: place.place_id,
                name: place.name,
                address: place.formatted_address,
                location: {
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng,
                },
                rating: place.rating,
            }, headers);
            setSuccessVisible(true);
            setSelectedPlace(null);
            // Optionally navigate to Home or just stay here
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to bookmark');
        }
    };

    const handleSuggestionPress = async (placeId: string) => {
        const details = await fetchPlaceDetails(placeId);
        if (details) {
            setSelectedPlace(details);
            setSuggestions([]);
            setSearch(''); // Clear search input

            moveTo({
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 500);
        }
    };

    const markers = useMemo<MapMarker[]>(() => {
        const toMarker = (place: PlaceDetails, color: string): MapMarker => ({
            id: place.place_id,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            title: place.name,
            description: place.vicinity,
            color,
        });
        const result = places.map((place) => toMarker(place, exploreMode ? colors.primary : colors.error));
        if (!exploreMode && selectedPlace) {
            result.push(toMarker(selectedPlace, colors.error));
        }
        return result;
    }, [places, selectedPlace, exploreMode, colors.primary, colors.error]);

    return (
        <View style={styles.container}>
            <LeafletMap
                ref={mapRef}
                style={styles.map}
                markers={markers}
                userLocation={userLocation}
                onRegionChangeComplete={(newRegion) => {
                    regionRef.current = newRegion;
                }}
                onMarkerPress={(id) => {
                    const place = places.find((p) => p.place_id === id);
                    if (place) setSelectedPlace(place);
                }}
            />

            <TouchableOpacity
                style={[styles.exploreButton, { backgroundColor: colors.surface }]}
                onPress={toggleExploreMode}
            >
                <Text style={[styles.exploreButtonText, { color: colors.primary }]}>{exploreMode ? 'Exit Explore' : 'Explore Bookmarks'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.locationButton, isLocating && styles.locationButtonLoading, { backgroundColor: colors.surface }]}
                onPress={getCurrentLocation}
                disabled={isLocating}
            >
                <Ionicons
                    name={isLocating ? "refresh" : "location"}
                    size={24}
                    color={colors.primary}
                />
            </TouchableOpacity>

            {!exploreMode && (
                <>
                    <View style={[styles.searchContainer, { top: insets.top + 60 }]}>
                        <TextInput
                            style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.textPrimary }]}
                            placeholder="🔍 Search restaurants"
                            value={search}
                            onChangeText={setSearch}
                            placeholderTextColor={colors.placeholder}
                        />
                    </View>
                    {suggestions.length === 0 && !!searchError && (
                        <View style={[styles.suggestionsContainer, { top: insets.top + 120, backgroundColor: colors.surface }]}>
                            <Text style={[styles.suggestionItem, { color: colors.textSecondary }]}>{searchError}</Text>
                        </View>
                    )}
                    {suggestions.length > 0 && (
                        <View style={[styles.suggestionsContainer, { top: insets.top + 120, backgroundColor: colors.surface }]}>
                            <FlatList
                                data={suggestions}
                                keyExtractor={(item) => item.place_id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                                        onPress={() => handleSuggestionPress(item.place_id)}
                                    >
                                        <Text style={{ fontWeight: 'bold', color: colors.textPrimary }} numberOfLines={1}>{item.description}</Text>
                                        <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1}>{item.vicinity}</Text>
                                    </TouchableOpacity>
                                )}
                                keyboardShouldPersistTaps="handled"
                            />
                        </View>
                    )}
                </>
            )}

            {selectedPlace && (
                <View style={styles.saveBoxContainer}>
                    <View style={[styles.saveBox, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.saveBoxTitle, { color: colors.textPrimary }]}>{selectedPlace.name}</Text>
                        <Text style={[styles.saveBoxText, { color: colors.textSecondary }]}>{selectedPlace.formatted_address}</Text>
                        {selectedPlace.rating != null && (
                            <Text style={[styles.saveBoxText, { color: colors.textSecondary }]}>Rating: {selectedPlace.rating} ⭐</Text>
                        )}

                        {!exploreMode ? (
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={() => saveRestaurant(selectedPlace)}>
                                <Text style={[styles.saveButtonText, { color: colors.surface }]}>Save to Bookmarks</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={() => setSelectedPlace(null)}>
                                <Text style={[styles.saveButtonText, { color: colors.surface }]}>Close</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            <Modal
                animationType="fade"
                transparent={true}
                visible={successVisible}
                onRequestClose={() => setSuccessVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.successContent}>
                            <FontAwesome name="check-circle" size={60} color={colors.primary} />
                            <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Success!</Text>
                            <Text style={[styles.successMessage, { color: colors.textSecondary }]}>Restaurant bookmarked successfully</Text>
                            <TouchableOpacity
                                style={[styles.successButton, { backgroundColor: colors.primary }]}
                                onPress={() => setSuccessVisible(false)}
                            >
                                <Text style={[styles.successButtonText, { color: colors.surface }]}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    exploreButton: {
        position: 'absolute',
        bottom: 30,
        left: SPACING.l,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        ...SHADOWS.medium,
        zIndex: 10,
    },
    exploreButtonText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    locationButton: {
        position: 'absolute',
        bottom: 30,
        right: SPACING.l,
        padding: 14,
        borderRadius: 30,
        ...SHADOWS.medium,
        zIndex: 10,
    },
    locationButtonLoading: {
        opacity: 0.7,
    },
    searchContainer: {
        position: 'absolute',
        left: SPACING.l,
        right: SPACING.l,
        zIndex: 10,
    },
    searchInput: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 30,
        fontSize: 16,
        ...SHADOWS.medium,
    },
    suggestionsContainer: {
        position: 'absolute',
        left: SPACING.l,
        right: SPACING.l,
        borderRadius: 15,
        ...SHADOWS.medium,
        maxHeight: 250,
        zIndex: 9,
        overflow: 'hidden',
    },
    suggestionItem: {
        padding: 16,
        borderBottomWidth: 1,
    },
    saveBoxContainer: {
        position: 'absolute',
        bottom: 30,
        left: SPACING.l,
        right: SPACING.l,
        zIndex: 10,
    },
    saveBox: {
        padding: 24,
        borderRadius: 20,
        ...SHADOWS.large,
    },
    saveBoxTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    saveBoxText: {
        fontSize: 15,
        marginBottom: 6,
    },
    saveButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
        ...SHADOWS.small,
    },
    saveButtonText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.l,
    },
    modalContent: {
        borderRadius: 20,
        padding: SPACING.l,
        width: '100%',
        maxWidth: 340,
        ...SHADOWS.large,
    },
    successContent: {
        alignItems: 'center',
        padding: SPACING.m,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: SPACING.m,
        marginBottom: SPACING.s,
    },
    successMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: SPACING.l,
    },
    successButton: {
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.xl,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    successButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
