import { setOptions } from '@googlemaps/js-api-loader';

let initialized = false;

export const initGoogleMaps = () => {
    if (!initialized) {
        setOptions({
            apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
            version: 'weekly',
            libraries: ['places', 'marker']
        });
        initialized = true;
    }
};
