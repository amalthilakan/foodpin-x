import axios from 'axios';
import { Request, Response } from 'express';

export const searchPlaces = async (req: Request, res: Response) => {
    try {
        const { keyword, latitude, longitude, radius = 5000 } = req.query;

        if (!keyword || !latitude || !longitude) {
            res.status(400).json({ message: 'Missing required parameters' });
            return;
        }

        // Debug logging
        console.log('🔍 Search params:', { keyword, latitude, longitude, radius });
        console.log('🔑 API Key present:', !!process.env.GOOGLE_MAPS_API_KEY);
        console.log('🔑 API Key (first 10 chars):', process.env.GOOGLE_MAPS_API_KEY?.substring(0, 10));

        const response = await axios.get(
            'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
            {
                params: {
                    location: `${latitude},${longitude}`,
                    radius,
                    type: 'restaurant',
                    keyword,
                    key: process.env.GOOGLE_MAPS_API_KEY,
                },
            }
        );

        console.log('✅ Google Maps API response status:', response.data.status);

        // Check if the request was denied
        if (response.data.status === 'REQUEST_DENIED') {
            console.error('❌ REQUEST_DENIED - Error message:', response.data.error_message);
            console.error('Full response:', JSON.stringify(response.data, null, 2));
            res.status(403).json({
                message: 'Google Maps API request denied',
                error: response.data.error_message || 'Please check API key configuration',
                status: response.data.status
            });
            return;
        }

        res.json(response.data);
    } catch (error: any) {
        console.error('❌ Places search error:', error.response?.data || error.message);
        console.error('Error status:', error.response?.status);
        console.error('Error details:', JSON.stringify(error.response?.data, null, 2));
        res.status(500).json({
            message: 'Failed to search places',
            error: error.response?.data || error.message
        });
    }
};
