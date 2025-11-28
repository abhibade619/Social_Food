import { useState, useEffect, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

const LocationSelector = ({ currentLocation, onLocationChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const autocompleteService = useRef(null);
    const placesService = useRef(null);

    // Initialize Google Maps Service
    useEffect(() => {
        const initServices = async () => {
            try {
                const { AutocompleteService, PlacesService } = await importLibrary("places");
                autocompleteService.current = new AutocompleteService();
                placesService.current = new PlacesService(document.createElement('div'));
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
        const timeoutId = setTimeout(() => {
            if (autocompleteService.current) {
                const request = {
                    input: value,
                    types: ['(cities)']
                };

                autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
                    setLoading(false);
                    if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                        setSuggestions(predictions.slice(0, 5)); // Limit to top 5
                    } else {
                        setSuggestions([]);
                    }
                });
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

    const handleSelectLocation = (suggestion) => {
        if (placesService.current && suggestion.place_id) {
            const request = {
                placeId: suggestion.place_id,
                fields: ['name', 'geometry', 'formatted_address']
            };

            placesService.current.getDetails(request, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place.geometry && place.geometry.location) {
                    const locationData = {
                        name: place.formatted_address || suggestion.description,
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    };
                    onLocationChange(locationData);
                } else {
                    console.error("Failed to get place details");
                    onLocationChange({ name: suggestion.description, lat: null, lng: null });
                }
                setIsOpen(false);
                setSearchTerm('');
            });
        } else {
            onLocationChange({ name: suggestion.description, lat: null, lng: null });
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
                    {currentLocation || 'Select Location'}
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
                            suggestions.map((suggestion) => (
                                <div
                                    key={suggestion.place_id}
                                    className="suggestion-item"
                                    onClick={() => handleSelectLocation(suggestion)}
                                >
                                    {suggestion.description}
                                </div>
                            ))
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
                                            onLocationChange(city);
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
