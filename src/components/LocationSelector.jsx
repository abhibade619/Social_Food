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
        <div className="location-selector" ref={dropdownRef}>
            <button
                className="location-button"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="location-icon">📍</span>
                <span className="location-text">
                    {(currentLocation && typeof currentLocation === 'object' ? currentLocation.name : currentLocation) || 'Select Location'}
                </span>
                <span className="dropdown-arrow">▼</span>
            </button>

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
                        ) : (
                            <div className="popular-cities">
                                <div className="suggestion-header">Popular Cities</div>
                                {['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'].map(city => (
                                    <div
                                        key={city}
                                        className="suggestion-item"
                                        onClick={() => {
                                            onLocationChange({ name: city, lat: null, lng: null });
                                            setIsOpen(false);
                                        }}
                                    >
                                        {city}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationSelector;
