import { useState, useEffect, useRef } from 'react';
import { loadPlacesLibrary } from '../utils/googleMaps';

const LocationSelector = ({ currentLocation, onLocationChange, displayCityOnly }) => {
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

    const [inputValue, setInputValue] = useState('');

    // Sync inputValue with currentLocation when not editing
    useEffect(() => {
        if (currentLocation) {
            const name = typeof currentLocation === 'object' ? currentLocation.name : currentLocation;
            if (name && name !== 'Select Location') {
                setInputValue(displayCityOnly ? name.split(',')[0] : name);
            }
        }
    }, [currentLocation, displayCityOnly]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        setSearchTerm(value);
        setIsOpen(true);

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

                    setLoading(false);
                    if (predictions) {
                        setSuggestions(predictions.slice(0, 5));
                    } else {
                        setSuggestions([]);
                    }
                } catch (error) {
                    console.error('LocationSelector: Error fetching suggestions', error);
                    setSuggestions([]);
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    };

    const handleSelectLocation = async (suggestion) => {
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
                setInputValue(displayCityOnly ? locationData.name.split(',')[0] : locationData.name);
                setIsOpen(false);
                setSearchTerm('');
            } catch (error) {
                console.error("Failed to get place details", error);
                const name = prediction.text.text;
                onLocationChange({ name, lat: null, lng: null });
                setInputValue(displayCityOnly ? name.split(',')[0] : name);
                setIsOpen(false);
                setSearchTerm('');
            }
        } else {
            if (prediction && prediction.text) {
                const name = prediction.text.text;
                onLocationChange({ name, lat: null, lng: null });
                setInputValue(displayCityOnly ? name.split(',')[0] : name);
            }
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    return (
        <div className="location-selector" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
            <div className="input-wrapper" style={{ position: 'relative', width: '100%' }}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Enter your city"
                    className="premium-input"
                    style={{
                        width: '100%',
                        padding: '0.8rem',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white'
                    }}
                />
            </div>

            {isOpen && (
                <div className="location-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    background: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    marginTop: '4px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    <div
                        className="suggestion-item current-location"
                        onClick={() => {
                            if (!navigator.geolocation) {
                                alert("Geolocation is not supported by this browser.");
                                return;
                            }

                            setLoading(true);
                            const handleSuccess = async (position) => {
                                const { latitude, longitude } = position.coords;
                                try {
                                    if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
                                        throw new Error("Google Maps API not loaded");
                                    }
                                    const geocoder = new window.google.maps.Geocoder();
                                    const response = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });

                                    if (response.results[0]) {
                                        const addressComponents = response.results[0].address_components;
                                        const city = addressComponents.find(c => c.types.includes('locality'))?.long_name ||
                                            addressComponents.find(c => c.types.includes('sublocality'))?.long_name;
                                        const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.short_name;
                                        const country = addressComponents.find(c => c.types.includes('country'))?.long_name;

                                        const parts = [city, state, country].filter(Boolean);
                                        const formattedLocation = parts.join(', ');

                                        const locationData = {
                                            name: formattedLocation || response.results[0].formatted_address,
                                            lat: latitude,
                                            lng: longitude
                                        };

                                        onLocationChange(locationData);
                                        setInputValue(displayCityOnly ? locationData.name.split(',')[0] : locationData.name);
                                        return;
                                    }

                                    // Fallback
                                    const fallbackName = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                                    onLocationChange({ name: fallbackName, lat: latitude, lng: longitude });
                                    setInputValue(fallbackName);
                                } catch (error) {
                                    console.error("Geocoding error:", error);
                                    const fallbackName = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                                    onLocationChange({ name: fallbackName, lat: latitude, lng: longitude });
                                    setInputValue(fallbackName);
                                } finally {
                                    setLoading(false);
                                    setIsOpen(false);
                                }
                            };

                            const handleError = (error) => {
                                console.error("Geolocation error:", error);
                                alert("Could not get your location.");
                                setLoading(false);
                            };

                            navigator.geolocation.getCurrentPosition(handleSuccess, handleError, { timeout: 10000 });
                        }}
                        style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <span>📍</span> Use Current Location
                    </div>

                    {loading ? (
                        <div className="suggestion-item loading" style={{ padding: '10px 15px', color: 'var(--text-secondary)' }}>Loading...</div>
                    ) : suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => {
                            const prediction = suggestion.placePrediction;
                            if (!prediction) return null;
                            return (
                                <div
                                    key={prediction.placeId || index}
                                    className="suggestion-item"
                                    onClick={() => handleSelectLocation(suggestion)}
                                    style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}
                                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                >
                                    {prediction.text ? prediction.text.text : 'Unknown Location'}
                                </div>
                            );
                        })
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default LocationSelector;
