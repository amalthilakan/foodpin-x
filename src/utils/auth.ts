import * as Storage from './storage';

export const getAuthHeaders = async () => {
    const token = await Storage.getItem('token');
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    };
};
