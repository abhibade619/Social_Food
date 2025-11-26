import { useEffect, useRef, useState } from 'react';

const RestaurantAutocomplete = ({ onPlaceSelected, defaultValue = '', location = '' }) => {
    const inputRef = useRef(null);
    const [autocomplete, setAutocomplete] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAutocomplete = async () => {
            try {
                // Load Google Maps script dynamically
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
                script.async = true;
                script.defer = true;

                // Define callback function
                window.initMap = () => {
                    if (!inputRef.current) return;

                    const autocompleteInstance = new window.google.maps.places.Autocomplete(
                        inputRef.current,
                        {
                            types: ['establishment'],
                            fields: [
                                'place_id',
                                'name',
                                'formatted_address',
                                'geometry',
                                'address_components',
                                'rating',
                                'user_ratings_total',
                                'types'
                            ]
                        }
                    );

                    autocompleteInstance.addListener('place_changed', () => {
                        const place = autocompleteInstance.getPlace();

                        if (!place.geometry || !place.geometry.location) {
                            console.error('No details available for input');
                            return;
                        }

                        // Extract city and state from address components
                        let city = '';
                        let state = '';
                        let country = '';

                        if (place.address_components) {
                            place.address_components.forEach(component => {
                                if (component.types.includes('locality')) {
                                    city = component.long_name;
                                }
                                if (component.types.includes('administrative_area_level_1')) {
                                    state = component.short_name;
                                }
                                if (component.types.includes('country')) {
                                    country = component.short_name;
                                }
                            });
                        }

                        const placeData = {
                            place_id: place.place_id,
                            name: place.name,
                            address: place.formatted_address,
                            latitude: place.geometry.location.lat(),
                            longitude: place.geometry.location.lng(),
                            city: city,
                            state: state,
                            country: country,
                            location: city && state ? `${city}, ${state}` : city || state,
                            rating: place.rating,
                            user_ratings_total: place.user_ratings_total
                        };

                        onPlaceSelected(placeData);
                    });

                    setAutocomplete(autocompleteInstance);
                    setIsLoading(false);
                };

                // Check if script already loaded
                if (window.google && window.google.maps && window.google.maps.places) {
                    window.initMap();
                } else {
                    document.head.appendChild(script);
                }
            } catch (error) {
                console.error('Error loading Google Maps:', error);
                setIsLoading(false);
            }
        };

        if (inputRef.current && !autocomplete) {
            initAutocomplete();
        }

        // Cleanup
        return () => {
            if (window.initMap) {
                delete window.initMap;
            }
        };
    }, []);

    return (
        <div className="restaurant-autocomplete">
            <input
                ref={inputRef}
                type="text"
                placeholder={isLoading ? 'Loading Google Places...' : 'Search for a restaurant...'}
                defaultValue={defaultValue}
                disabled={isLoading}
                className="autocomplete-input"
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                }}
            />
            {isLoading && (
                <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                    Loading Google Places...
                </small>
            )}
        </div>
    );
};

export default RestaurantAutocomplete;
