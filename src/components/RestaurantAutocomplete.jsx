import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { importLibrary } from '@googlemaps/js-api-loader';

const RestaurantAutocomplete = ({ onPlaceSelected, defaultValue = '', locationBias = null }) => {
    const [inputValue, setInputValue] = useState(defaultValue);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const autocompleteService = useRef(null);
    const placesService = useRef(null);
    const wrapperRef = useRef(null);

    // Initialize Google Maps Services
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

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSupabaseSuggestions = async (searchTerm) => {
        try {
            // Search in logs for unique restaurant names that match
            const { data, error } = await supabase
                .from('logs')
                .select('restaurant_name, location, place_id, full_address, latitude, longitude')
                .ilike('restaurant_name', `%${searchTerm}%`)
                .limit(5);

            if (error) throw error;

            // Remove duplicates based on place_id or name+location
            const uniqueRestaurants = [];
            const seen = new Set();

            data.forEach(item => {
                const key = item.place_id || `${item.restaurant_name}-${item.location}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueRestaurants.push({
                        description: `${item.restaurant_name}, ${item.location}`,
                        place_id: item.place_id,
                        structured_formatting: {
                            main_text: item.restaurant_name,
                            secondary_text: item.location
                        },
                        isLocal: true,
                        data: item
                    });
                }
            });

            return uniqueRestaurants;
        } catch (err) {
            console.error('Error fetching local suggestions:', err);
            return [];
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);

        if (value.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setLoading(true);
        setShowSuggestions(true);

        // Debounce logic
        const timeoutId = setTimeout(async () => {
            // 1. Fetch local suggestions first
            const localResults = await fetchSupabaseSuggestions(value);

            // 2. If we have enough local results, stop here
            if (localResults.length >= 5) {
                setSuggestions(localResults.slice(0, 5));
                setLoading(false);
                return;
            }

            // 3. If not enough, fetch from Google
            if (autocompleteService.current) {
                const request = {
                    input: value,
                    types: ['establishment'],
                    locationBias: locationBias && locationBias.lat && locationBias.lng ?
                        new google.maps.Circle({
                            center: { lat: locationBias.lat, lng: locationBias.lng },
                            radius: 50000
                        }) : undefined
                };

                autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
                    console.log('RestaurantAutocomplete predictions:', predictions, 'Status:', status);
                    setLoading(false);
                    let googleResults = [];
                    if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                        googleResults = predictions;
                    } else {
                        console.warn('RestaurantAutocomplete: No Google predictions found or status not OK', status);
                    }

                    // Combine results: Local first, then Google
                    // Filter out Google results that might duplicate local ones (by place_id)
                    const localPlaceIds = new Set(localResults.map(r => r.place_id).filter(id => id));
                    const filteredGoogleResults = googleResults.filter(r => !localPlaceIds.has(r.place_id));

                    const combined = [...localResults, ...filteredGoogleResults].slice(0, 8);
                    setSuggestions(combined);
                });
            } else {
                setSuggestions(localResults);
                setLoading(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    };

    const handleSelect = (suggestion) => {
        setInputValue(suggestion.structured_formatting.main_text);
        setShowSuggestions(false);

        if (suggestion.isLocal) {
            // Use stored local data
            const item = suggestion.data;
            onPlaceSelected({
                name: item.restaurant_name,
                location: item.location,
                place_id: item.place_id,
                latitude: item.latitude,
                longitude: item.longitude,
                address: item.full_address
            });
        } else {
            // Fetch details from Google
            if (placesService.current && suggestion.place_id) {
                const request = {
                    placeId: suggestion.place_id,
                    fields: ['name', 'formatted_address', 'geometry', 'address_components', 'rating', 'user_ratings_total', 'international_phone_number', 'website']
                };

                placesService.current.getDetails(request, (place, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        // Extract city/state logic similar to before
                        let city = '', state = '', country = '';
                        if (place.address_components) {
                            place.address_components.forEach(component => {
                                if (component.types.includes('locality')) city = component.long_name;
                                if (component.types.includes('administrative_area_level_1')) state = component.short_name;
                                if (component.types.includes('country')) country = component.short_name;
                            });
                        }

                        onPlaceSelected({
                            place_id: place.place_id,
                            name: place.name,
                            address: place.formatted_address,
                            latitude: place.geometry.location.lat(),
                            longitude: place.geometry.location.lng(),
                            city, state, country,
                            location: city && state ? `${city}, ${state}` : city || state,
                            rating: place.rating,
                            user_ratings_total: place.user_ratings_total,
                            phone: place.international_phone_number,
                            website: place.website
                        });
                    }
                });
            }
        }
    };

    return (
        <div className="restaurant-autocomplete-wrapper" ref={wrapperRef} style={{ position: 'relative' }}>
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Search for a restaurant..."
                className="autocomplete-input"
                style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--surface-color)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem'
                }}
            />

            {showSuggestions && (suggestions.length > 0 || loading) && (
                <div className="autocomplete-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}>
                    {loading && <div style={{ padding: '12px', color: '#888' }}>Loading...</div>}

                    {!loading && suggestions.map((suggestion, index) => (
                        <div
                            key={suggestion.place_id || index}
                            onClick={() => handleSelect(suggestion)}
                            style={{
                                padding: '12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                            className="suggestion-item"
                        >
                            <span style={{ fontSize: '1.2rem' }}>
                                {suggestion.isLocal ? '🕒' : '📍'}
                            </span>
                            <div>
                                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                    {suggestion.structured_formatting.main_text}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {suggestion.structured_formatting.secondary_text}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RestaurantAutocomplete;
