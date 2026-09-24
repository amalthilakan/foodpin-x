import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// expo-secure-store has no web implementation, so fall back to localStorage there.
// `typeof window` guards static/server rendering, where no storage exists.
const webStorage = () => (typeof window !== 'undefined' ? window.localStorage : null);

export const getItem = async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return webStorage()?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
};

export const setItem = async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
        webStorage()?.setItem(key, value);
        return;
    }
    await SecureStore.setItemAsync(key, value);
};

export const deleteItem = async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
        webStorage()?.removeItem(key);
        return;
    }
    await SecureStore.deleteItemAsync(key);
};
