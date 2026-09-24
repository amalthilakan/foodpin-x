export type Region = {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
};

export type LatLng = { latitude: number; longitude: number };

export type MapMarker = {
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
    color?: string;
};

export type LeafletMapProps = {
    style?: any;
    markers?: MapMarker[];
    // Shown as a blue dot, like the native "my location" indicator
    userLocation?: LatLng | null;
    onMapReady?: () => void;
    onRegionChangeComplete?: (region: Region) => void;
    onMarkerPress?: (id: string) => void;
};

export type LeafletMapHandle = {
    animateToRegion: (region: Region, duration?: number) => void;
    fitToCoordinates: (coordinates: LatLng[], options?: { edgePadding?: { top: number; right: number; bottom: number; left: number } }) => void;
};

// Messages sent from React Native into the map page
export type ToMapMessage =
    // Asks the page to (re)send "ready", in case it loaded before we were listening
    | { type: 'ping' }
    | { type: 'setView'; latitude: number; longitude: number; zoom: number; animate: boolean }
    | { type: 'fitBounds'; points: [number, number][]; padding: [number, number, number, number] }
    | { type: 'setMarkers'; markers: MapMarker[] }
    | { type: 'setUserLocation'; location: LatLng | null };

// Messages sent from the map page back to React Native
export type FromMapMessage =
    | { type: 'ready' }
    | { type: 'moveend'; region: Region }
    | { type: 'markerPress'; id: string };

export const deltaToZoom = (delta: number) =>
    Math.max(2, Math.min(19, Math.round(Math.log2(360 / Math.max(delta, 0.00001)))));
