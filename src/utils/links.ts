import { Linking, Platform } from 'react-native';

// Users often type links like "instagram.com/place" without a scheme,
// which Linking.openURL can't open.
export const normalizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const openDirections = async (latitude: string | number, longitude: string | number, label: string) => {
    const latLng = `${latitude},${longitude}`;
    const encodedLabel = encodeURIComponent(label || '');
    const webUrl = `https://www.openstreetmap.org/directions?route=%3B${latitude}%2C${longitude}`;
    const nativeUrl = Platform.select({
        ios: `maps:0,0?q=${encodedLabel}@${latLng}`,
        android: `geo:0,0?q=${latLng}(${encodedLabel})`,
    });

    try {
        await Linking.openURL(nativeUrl || webUrl);
    } catch {
        await Linking.openURL(webUrl);
    }
};
