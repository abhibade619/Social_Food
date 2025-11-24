import { useState, useEffect, useRef } from 'react';

const LocationSelector = ({ currentLocation, onLocationChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

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

    // Fetch location suggestions from Google Places API
    const fetchSuggestions = async (input) => {
        if (!input || input.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            // Using Google Places Autocomplete API
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${apiKey}`
            );

            // Note: This will fail due to CORS. In production, you'd need a backend proxy
            // For now, we'll use mock suggestions
            const mockSuggestions = [
                { id: 1, description: `${input}, NY, USA` },
                { id: 2, description: `${input}, CA, USA` },
                { id: 3, description: `${input}, TX, USA` },
            ];

            setSuggestions(mockSuggestions);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            // Fallback to mock data
            setSuggestions([
                { id: 1, description: `${searchTerm}, NY, USA` },
                { id: 2, description: `${searchTerm}, CA, USA` },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm) {
                fetchSuggestions(searchTerm);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSelectLocation = (location) => {
        onLocationChange(location);
        setIsOpen(false);
        setSearchTerm('');
        setSuggestions([]);
    };

    return (
        <div className="location-selector" ref={dropdownRef}>
            <button
                className="location-button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Change location"
            >
                <span className="location-icon">📍</span>
                <span className="location-text">{currentLocation || 'Set Location'}</span>
                <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div className="location-dropdown">
                    <div className="location-search">
                        <input
                            type="text"
                            placeholder="Search for a city..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            className="location-search-input"
                        />
                    </div>

                    <div className="location-suggestions">
                        {loading && <div className="loading-suggestions">Loading...</div>}

                        {!loading && suggestions.length > 0 && (
                            <ul className="suggestions-list">
                                {suggestions.map((suggestion) => (
                                    <li
                                        key={suggestion.id}
                                        onClick={() => handleSelectLocation(suggestion.description)}
                                        className="suggestion-item"
                                    >
                                        <span className="suggestion-icon">📍</span>
                                        {suggestion.description}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {!loading && searchTerm && suggestions.length === 0 && (
                            <div className="no-suggestions">No locations found</div>
                        )}

                        {!searchTerm && (
                            <div className="recent-locations">
                                <p className="section-title">Popular Cities</p>
                                <ul className="suggestions-list">
                                    <li onClick={() => handleSelectLocation('New York, NY')} className="suggestion-item">
                                        <span className="suggestion-icon">📍</span>
                                        New York, NY
                                    </li>
                                    <li onClick={() => handleSelectLocation('Los Angeles, CA')} className="suggestion-item">
                                        <span className="suggestion-icon">📍</span>
                                        Los Angeles, CA
                                    </li>
                                    <li onClick={() => handleSelectLocation('Chicago, IL')} className="suggestion-item">
                                        <span className="suggestion-icon">📍</span>
                                        Chicago, IL
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationSelector;
