import { useState, useEffect, useRef } from 'react';
import { loadPlacesLibrary } from '../utils/googleMaps';

const LocationSelector = ({ currentLocation, onLocationChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const [placesApi, setPlacesApi] = useState(null);

    // Initialize Google Maps Service
    useEffect(() => {
        const initServices = async () => {
            try {
                const lib = await loadPlacesLibrary();
                setPlacesApi(lib);
            } catch (e) {
                console.error("Error loading Google Maps API", e);
            }
        };

        initServices();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (value.length < 3) {
            setSuggestions([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        // Debounce logic
        const timeoutId = setTimeout(async () => {
            if (placesApi && placesApi.AutocompleteSuggestion) {
                try {
                    const request = {
                        input: value,
                        includedPrimaryTypes: ['(cities)']
                    };

                    const { suggestions: predictions } = await placesApi.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

                    console.log('LocationSelector predictions:', predictions);
                    setLoading(false);
                    if (predictions) {
                        setSuggestions(predictions.slice(0, 5)); // Limit to top 5
                    } else {
                        setSuggestions([]);
                    }
                } catch (error) {
                    console.error('LocationSelector: Error fetching suggestions', error);
                    setSuggestions([{ placePrediction: { text: { text: `Error: ${error.message}` }, placeId: 'error' } }]);
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    };

    // Cleanup debounce on unmount or change
    useEffect(() => {
        const timer = setTimeout(() => { }, 0);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSelectLocation = async (suggestion) => {
        // suggestion is an AutocompleteSuggestion object
        // It has a placePrediction property
        const prediction = suggestion.placePrediction;

        if (placesApi && placesApi.Place && prediction && prediction.placeId && prediction.placeId !== 'error') {
            try {
                const place = new placesApi.Place({ id: prediction.placeId });
                await place.fetchFields({ fields: ['displayName', 'location', 'formattedAddress'] });

                const locationData = {
                    name: place.formattedAddress || prediction.text.text,
                    lat: place.location.lat(),
                    lng: place.location.lng()
                };
                onLocationChange(locationData);
                setIsOpen(false);
                setSearchTerm('');
            } catch (error) {
                console.error("Failed to get place details", error);
                onLocationChange({ name: prediction.text.text, lat: null, lng: null });
                setIsOpen(false);
                setSearchTerm('');
            }
        } else {
            if (prediction && prediction.text) {
                onLocationChange({ name: prediction.text.text, lat: null, lng: null });
            }
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    return (
        <div className="location-selector" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
            <div
                className="location-container"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.05)',
                    width: 'fit-content',
                    minWidth: '200px'
                }}
            >
                <div className="location-icon-wrapper" style={{ display: 'flex', alignItems: 'center', color: '#D4AF37' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                </div>
                <button
                    className="location-button"
                    style={{
                        border: 'none !important',
                        outline: 'none !important',
                        background: 'transparent !important',
                        padding: 0,
                        margin: 0,
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        flex: 1,
                        textAlign: 'left',
                        boxShadow: 'none !important',
                        appearance: 'none',
                        WebkitAppearance: 'none'
                    }}
                >
                    {(currentLocation && typeof currentLocation === 'object' ? currentLocation.name : currentLocation) || 'Select Location'}
                </button>
                <span className="dropdown-arrow" style={{ fontSize: '0.8rem', opacity: 0.7 }}>▼</span>
            </div>

            {isOpen && (
                <div className="location-dropdown">
                    <div className="location-search">
                        <input
                            type="text"
                            placeholder="Search city..."
                            value={searchTerm}
                            onChange={handleSearch}
                            autoFocus
                        />
                    </div>

                    <div className="location-options">
                        <div
                            className="suggestion-item current-location"
                            onClick={() => {
                                if (navigator.geolocation) {
                                    setLoading(true);
                                    console.log("Requesting geolocation...");
                                    navigator.geolocation.getCurrentPosition(
                                        async (position) => {
                                            console.log("Geolocation success:", position);
                                            const { latitude, longitude } = position.coords;
                                            try {
                                                // Reverse geocode to get city name
                                                if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
                                                    throw new Error("Google Maps API not loaded");
                                                }
                                                const geocoder = new window.google.maps.Geocoder();
                                                console.log("Geocoding coordinates:", latitude, longitude);
                                                const response = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
                                                console.log("Geocoding response:", response);

                                                if (response.results[0]) {
                                                    // Find city, state, country components
                                                    const addressComponents = response.results[0].address_components;

                                                    // Try to find locality (city), fallback to sublocality or administrative_area_level_2 (county)
                                                    const city = addressComponents.find(c => c.types.includes('locality'))?.long_name ||
                                                        addressComponents.find(c => c.types.includes('sublocality'))?.long_name ||
                                                        addressComponents.find(c => c.types.includes('administrative_area_level_2'))?.long_name;

                                                    const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.short_name;
                                                    const country = addressComponents.find(c => c.types.includes('country'))?.long_name;

                                                    // Construct "City, State, Country"
                                                    const parts = [];
                                                    if (city) parts.push(city);
                                                    if (state) parts.push(state);
                                                    if (country) parts.push(country);

                                                    const formattedLocation = parts.join(', ');
                                                    console.log("Formatted location:", formattedLocation);

                                                    onLocationChange({
                                                        name: formattedLocation || response.results[0].formatted_address,
                                                        lat: latitude,
                                                        lng: longitude
                                                    });
                                                    return; // Exit after successful update
                                                }

                                                console.warn("No results found for location");
                                                // Fallback if no results found
                                                onLocationChange({
                                                    name: "Unknown Location",
                                                    lat: latitude,
                                                    lng: longitude
                                                });
                                            } catch (error) {
                                                console.error("Geocoding error:", error);
                                                // If API key is restricted or quota exceeded, fallback to coordinates
                                                const fallbackName = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

                                                onLocationChange({
                                                    name: fallbackName,
                                                    lat: latitude,
                                                    lng: longitude
                                                });

                                                // Optional: Alert user if it's a dev/config issue, or just fail silently to coords
                                                if (error.message.includes("REQUEST_DENIED") || error.message.includes("API project is not authorized")) {
                                                    console.warn("Google Maps Geocoding API not authorized. Using coordinates as fallback.");
                                                } else {
                                                    alert(`Could not determine city name: ${error.message}. Using coordinates.`);
                                                }
                                            } finally {
                                                setLoading(false);
                                                setIsOpen(false);
                                            }
                                        },
                                        (error) => {
                                            console.error("Geolocation error:", error);
                                            let msg = "Could not get your location.";
                                            if (error.code === 1) msg = "Location permission denied. Please enable it in your browser settings.";
                                            else if (error.code === 2) msg = "Location unavailable.";
                                            else if (error.code === 3) msg = "Location request timed out.";
                                            alert(msg);
                                            setLoading(false);
                                        },
                                        { timeout: 10000, enableHighAccuracy: true }
                                    );
                                } else {
                                    alert("Geolocation is not supported by this browser.");
                                }
                            }}
                        >
                            <span className="icon">📍</span> Use Current Location
                        </div>
                    </div>

                    <div className="location-suggestions">
                        {loading ? (
                            <div className="suggestion-item loading">Loading...</div>
                        ) : suggestions.length > 0 ? (
                            suggestions.map((suggestion, index) => {
                                const prediction = suggestion.placePrediction;
                                if (!prediction) return null;
                                return (
                                    <div
                                        key={prediction.placeId || index}
                                        className="suggestion-item"
                                        onClick={() => handleSelectLocation(suggestion)}
                                    >
                                        {prediction.text ? prediction.text.text : 'Unknown Location'}
                                    </div>
                                );
                            })
                        ) : searchTerm ? (
                            <div className="suggestion-item no-results">No cities found</div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationSelector;
