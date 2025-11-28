import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
let initialized = false;
let placesPromise = null;
let mapsPromise = null;
let markerPromise = null;

const initialize = () => {
    if (!initialized && apiKey) {
        console.log('Initializing Google Maps with key:', apiKey.substring(0, 5) + '...');
        setOptions({
            key: apiKey, // Try 'key' as well
            apiKey: apiKey,
            version: 'weekly',
            libraries: ['places', 'maps', 'marker']
        });
        initialized = true;
        console.log('Google Maps API options set.');
    } else if (!apiKey) {
        console.error('Google Maps API key is missing from environment variables.');
    }
};

export const loadPlacesLibrary = () => {
    initialize();
    if (!placesPromise) {
        placesPromise = importLibrary('places').catch(e => {
            console.error('Error loading Places library:', e);
            placesPromise = null;
            throw e;
        });
    }
    return placesPromise;
};

export const loadMapsLibrary = () => {
    initialize();
    if (!mapsPromise) {
        mapsPromise = importLibrary('maps').catch(e => {
            console.error('Error loading Maps library:', e);
            mapsPromise = null;
            throw e;
        });
    }
    return mapsPromise;
};

export const loadMarkerLibrary = () => {
    initialize();
    if (!markerPromise) {
        markerPromise = importLibrary('marker').catch(e => {
            console.error('Error loading Marker library:', e);
            markerPromise = null;
            throw e;
        });
    }
    return markerPromise;
};

// Initialize when the module loads
initialize();

export const initGoogleMaps = () => {
    initialize();
};
