import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { loadPlacesLibrary } from '../utils/googleMaps';

const RestaurantAutocomplete = ({ onPlaceSelected, defaultValue = '', locationBias = null }) => {
    const [inputValue, setInputValue] = useState(defaultValue);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [placesApi, setPlacesApi] = useState(null);
    const wrapperRef = useRef(null);

    // Initialize Google Maps Services
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
            if (placesApi && placesApi.AutocompleteSuggestion) {
                try {
                    const request = {
                        input: value,
                        includedPrimaryTypes: ['restaurant', 'food'], // Updated types
                        locationBias: locationBias && locationBias.lat && locationBias.lng ?
                            new google.maps.Circle({
                                center: { lat: locationBias.lat, lng: locationBias.lng },
                                radius: 50000
                            }) : undefined
                    };

                    const { suggestions: predictions } = await placesApi.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

                    console.log('RestaurantAutocomplete predictions:', predictions);
                    setLoading(false);

                    let googleResults = [];
                    if (predictions) {
                        // Transform to match local structure roughly for rendering
                        googleResults = predictions.map(p => ({
                            isLocal: false,
                            placePrediction: p.placePrediction
                        }));
                    }

                    // Combine results: Local first, then Google
                    // Filter out Google results that might duplicate local ones (by place_id)
                    const localPlaceIds = new Set(localResults.map(r => r.place_id).filter(id => id));
                    const filteredGoogleResults = googleResults.filter(r => !localPlaceIds.has(r.placePrediction?.placeId));

                    const combined = [...localResults, ...filteredGoogleResults].slice(0, 8);
                    setSuggestions(combined);

                } catch (error) {
                    console.warn('RestaurantAutocomplete: Error fetching Google predictions', error);
                    setSuggestions(localResults);
                    setLoading(false);
                }
            } else {
                setSuggestions(localResults);
                setLoading(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    };

    const handleSelect = async (suggestion) => {
        if (suggestion.isLocal) {
            setInputValue(suggestion.structured_formatting.main_text);
            setShowSuggestions(false);
            // Use stored local data
            const item = suggestion.data;
            if (onPlaceSelected) {
                onPlaceSelected({
                    name: item.restaurant_name,
                    location: item.location,
                    place_id: item.place_id,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    address: item.full_address
                });
            }
        } else {
            // Fetch details from Google
            const prediction = suggestion.placePrediction;
            if (prediction) {
                // Use the text from the prediction as the initial name
                const predictionName = prediction.text.text;
                setInputValue(predictionName);
                setShowSuggestions(false);

                if (placesApi && placesApi.Place && prediction.placeId) {
                    try {
                        const place = new placesApi.Place({ id: prediction.placeId });
                        await place.fetchFields({
                            fields: ['displayName', 'formattedAddress', 'location', 'addressComponents', 'rating', 'userRatingCount', 'internationalPhoneNumber', 'websiteURI']
                        });

                        // Extract city/state logic
                        let city = '', state = '', country = '';
                        if (place.addressComponents) {
                            place.addressComponents.forEach(component => {
                                if (component.types.includes('locality')) city = component.longText || component.shortText;
                                if (component.types.includes('administrative_area_level_1')) state = component.shortText;
                                if (component.types.includes('country')) country = component.shortText;
                            });
                        }

                        if (onPlaceSelected) {
                            onPlaceSelected({
                                place_id: place.id,
                                // Use place.displayName if available, otherwise fall back to the prediction name
                                name: place.displayName || predictionName,
                                address: place.formattedAddress,
                                latitude: place.location.lat(),
                                longitude: place.location.lng(),
                                city, state, country,
                                location: city && state ? `${city}, ${state}` : city || state,
                                rating: place.rating,
                                user_ratings_total: place.userRatingCount,
                                phone: place.internationalPhoneNumber,
                                website: place.websiteURI
                            });
                        }
                    } catch (error) {
                        console.error("Failed to get place details", error);
                        // Fallback if details fetch fails
                        if (onPlaceSelected) {
                            onPlaceSelected({
                                place_id: prediction.placeId,
                                name: predictionName,
                                address: '',
                                latitude: null,
                                longitude: null,
                                location: ''
                            });
                        }
                    }
                }
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
                    background: 'var(--surface-highlight)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}>
                    {loading && <div style={{ padding: '12px', color: '#888' }}>Loading...</div>}

                    {!loading && suggestions.map((suggestion, index) => {
                        let mainText = '';
                        let secondaryText = '';
                        let isLocal = suggestion.isLocal;

                        if (isLocal) {
                            mainText = suggestion.structured_formatting.main_text;
                            secondaryText = suggestion.structured_formatting.secondary_text;
                        } else {
                            const prediction = suggestion.placePrediction;
                            if (prediction) {
                                mainText = prediction.text.text;
                                // Secondary text isn't directly available in the same way in new API, 
                                // but we can try to infer or just show the text.
                                // Actually, `prediction.text.text` is the main name. 
                                // We might not have a separate address field easily accessible in the prediction object 
                                // without fetching details, but `prediction.text.text` usually contains the name.
                                // Let's check if there is structured formatting.
                                // The new API returns `text` (FormattableText).
                                secondaryText = ''; // New API prediction object is simpler
                            }
                        }

                        return (
                            <div
                                key={isLocal ? (suggestion.place_id || index) : (suggestion.placePrediction?.placeId || index)}
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
                                    {isLocal ? '🕒' : '📍'}
                                </span>
                                <div>
                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                        {mainText}
                                    </div>
                                    {secondaryText && (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {secondaryText}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RestaurantAutocomplete;
