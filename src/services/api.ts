import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use localhost for iOS simulator, 10.0.2.2 for Android emulator
const BASE_URL = Platform.OS === 'android'
    ? 'http://10.0.2.2:5000'
    : 'http://localhost:5000';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const addBookmark = (data: any) => api.post('/bookmarks', data);
export const getBookmarks = () => api.get('/bookmarks');
export const removeBookmark = (id: string) => api.delete(`/bookmarks/${id}`);
export const updateBookmark = (id: string, data: any) => api.put(`/bookmarks/${id}`, data);
export const updateProfile = (data: any) => api.put('/users/profile', data);
export const getProfile = () => api.get('/users/profile');
export const searchPlaces = (keyword: string, latitude: number, longitude: number, radius?: number) =>
    api.get('/places/search', { params: { keyword, latitude, longitude, radius } });

export default api;
