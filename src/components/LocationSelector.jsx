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
                                    navigator.geolocation.getCurrentPosition(
                                        async (position) => {
                                            const { latitude, longitude } = position.coords;
                                            try {
                                                // Reverse geocode to get city name
                                                const geocoder = new window.google.maps.Geocoder();
                                                const response = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });

                                                if (response.results[0]) {
                                                    // Find city, state, country components
                                                    const addressComponents = response.results[0].address_components;
                                                    const city = addressComponents.find(c => c.types.includes('locality'))?.long_name;
                                                    const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.short_name;
                                                    const country = addressComponents.find(c => c.types.includes('country'))?.long_name;

                                                    const formattedLocation = [city, state, country].filter(Boolean).join(', ');

                                                    onLocationChange({
                                                        name: formattedLocation || response.results[0].formatted_address,
                                                        lat: latitude,
                                                        lng: longitude
                                                    });
                                                }
                                                // Fallback to coords only if geocoding fails, but try to be descriptive
                                                onLocationChange({
                                                    name: "Unknown Location",
                                                    lat: latitude,
                                                    lng: longitude
                                                });
                                            } finally {
                                                setLoading(false);
                                                setIsOpen(false);
                                            }
                                        },
                                        (error) => {
                                            console.error("Geolocation error:", error);
                                            alert("Could not get your location. Please enable location services.");
                                            setLoading(false);
                                        }
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
