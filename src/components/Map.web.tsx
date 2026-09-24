import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

// Web fallback for react-native-maps: an embedded Google Map centred on the
// current region. It supports the imperative calls the app uses; markers are
// not drawn individually.

export type Region = {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
};

type LatLng = { latitude: number; longitude: number };

type MapViewProps = {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
    onMapReady?: () => void;
    onRegionChangeComplete?: (region: Region) => void;
    [key: string]: any;
};

const deltaToZoom = (delta: number) => Math.max(3, Math.min(18, Math.round(Math.log2(360 / Math.max(delta, 0.0001)))));

const MapView = forwardRef<any, MapViewProps>(({ style, onMapReady, onRegionChangeComplete }, ref) => {
    const [region, setRegion] = useState<Region | null>(null);

    const moveTo = (newRegion: Region) => {
        setRegion(newRegion);
        onRegionChangeComplete?.(newRegion);
    };

    useImperativeHandle(ref, () => ({
        animateToRegion: (newRegion: Region) => moveTo(newRegion),
        fitToCoordinates: (coords: LatLng[]) => {
            if (coords.length === 0) return;
            const lats = coords.map((c) => c.latitude);
            const lngs = coords.map((c) => c.longitude);
            const minLat = Math.min(...lats), maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
            moveTo({
                latitude: (minLat + maxLat) / 2,
                longitude: (minLng + maxLng) / 2,
                latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.01),
                longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.01),
            });
        },
    }));

    const src = region
        ? `https://maps.google.com/maps?q=${region.latitude},${region.longitude}&z=${deltaToZoom(region.latitudeDelta)}&output=embed`
        : 'https://maps.google.com/maps?q=restaurants&z=3&output=embed';

    return (
        <View style={style}>
            <iframe
                title="map"
                src={src}
                style={{ border: 0, width: '100%', height: '100%' }}
                onLoad={onMapReady}
            />
        </View>
    );
});
MapView.displayName = 'MapView';

export const Marker = (_props: any) => null;

export default MapView;
