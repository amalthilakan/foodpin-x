import * as SecureStore from 'expo-secure-store';

export const getAuthHeaders = async () => {
    const token = await SecureStore.getItemAsync('token');
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    };
};
