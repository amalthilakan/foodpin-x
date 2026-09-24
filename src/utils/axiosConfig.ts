import axios from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../constants/config';
import { resetWelcomeToast } from './welcomeToast';

axios.defaults.baseURL = BASE_URL;
axios.defaults.timeout = 15000;

// When the stored token is expired or invalid, every authenticated request
// fails with 401. Clear the session and send the user back to login instead
// of leaving them on screens that silently show nothing.
let isHandlingUnauthorized = false;

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const hadAuthHeader = !!error.config?.headers?.Authorization;
        if (error.response?.status === 401 && hadAuthHeader && !isHandlingUnauthorized) {
            isHandlingUnauthorized = true;
            try {
                await SecureStore.deleteItemAsync('token');
                await SecureStore.deleteItemAsync('user');
                resetWelcomeToast();
                router.replace('/');
            } finally {
                isHandlingUnauthorized = false;
            }
        }
        return Promise.reject(error);
    }
);
