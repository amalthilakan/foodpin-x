import { Ref, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { deltaToZoom, FromMapMessage, LeafletMapHandle, LeafletMapProps, ToMapMessage } from './types';

// Shared between the native (WebView) and web (iframe) maps: turns the
// imperative map API and props into messages for the Leaflet page, and
// messages from the page into prop callbacks.
export const useLeafletBridge = (
    props: LeafletMapProps,
    ref: Ref<LeafletMapHandle>,
    post: (message: ToMapMessage) => void
) => {
    const propsRef = useRef(props);
    useEffect(() => {
        propsRef.current = props;
    });
    const readyRef = useRef(false);
    // Camera moves requested before the page finished loading; only the last one matters
    const pendingCameraRef = useRef<ToMapMessage | null>(null);

    const sendCamera = useCallback((message: ToMapMessage) => {
        if (readyRef.current) {
            post(message);
        } else {
            pendingCameraRef.current = message;
        }
    }, [post]);

    useImperativeHandle(ref, () => ({
        animateToRegion: (region, duration = 300) => {
            sendCamera({
                type: 'setView',
                latitude: region.latitude,
                longitude: region.longitude,
                zoom: deltaToZoom(region.latitudeDelta),
                animate: duration > 0,
            });
        },
        fitToCoordinates: (coordinates, options) => {
            const p = options?.edgePadding ?? { top: 40, right: 40, bottom: 40, left: 40 };
            sendCamera({
                type: 'fitBounds',
                points: coordinates.map((c) => [c.latitude, c.longitude]),
                padding: [p.top, p.right, p.bottom, p.left],
            });
        },
    }), [sendCamera]);

    const { markers, userLocation } = props;

    useEffect(() => {
        if (readyRef.current) post({ type: 'setMarkers', markers: markers ?? [] });
    }, [markers, post]);

    useEffect(() => {
        if (readyRef.current) post({ type: 'setUserLocation', location: userLocation ?? null });
    }, [userLocation, post]);

    const handleMessage = useCallback((data: unknown) => {
        let message: FromMapMessage;
        try {
            message = typeof data === 'string' ? JSON.parse(data) : (data as FromMapMessage);
        } catch {
            return;
        }
        if (!message || typeof message !== 'object') return;

        switch (message.type) {
            case 'ready':
                if (readyRef.current) return;
                readyRef.current = true;
                post({ type: 'setMarkers', markers: propsRef.current.markers ?? [] });
                post({ type: 'setUserLocation', location: propsRef.current.userLocation ?? null });
                if (pendingCameraRef.current) {
                    post(pendingCameraRef.current);
                    pendingCameraRef.current = null;
                }
                propsRef.current.onMapReady?.();
                break;
            case 'moveend':
                propsRef.current.onRegionChangeComplete?.(message.region);
                break;
            case 'markerPress':
                propsRef.current.onMarkerPress?.(message.id);
                break;
        }
    }, [post]);

    // Call when the page starts (re)loading so messages wait for the next "ready"
    const resetReady = useCallback(() => {
        readyRef.current = false;
    }, []);

    return { handleMessage, resetReady };
};
