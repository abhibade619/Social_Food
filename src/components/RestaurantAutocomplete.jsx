import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const RestaurantAutocomplete = ({ onPlaceSelected, defaultValue = '', location = '' }) => {
    const inputRef = useRef(null);
    const [autocomplete, setAutocomplete] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAutocomplete = async () => {
            try {
                const loader = new Loader({
                    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
                    version: 'weekly',
                    libraries: ['places']
                });

                await loader.load();

                const autocompleteInstance = new google.maps.places.Autocomplete(
                    inputRef.current,
                    {
                        types: ['restaurant', 'cafe', 'food', 'meal_takeaway', 'meal_delivery'],
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

                // Bias results to location if provided
                if (location) {
                    // You could geocode the location here to get coordinates
                    // For now, we'll just use the location as a search bias
                }

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
            } catch (error) {
                console.error('Error loading Google Maps:', error);
                setIsLoading(false);
            }
        };

        if (inputRef.current && !autocomplete) {
            initAutocomplete();
        }
    }, []);

    return (
        <div className="restaurant-autocomplete">
            <input
                ref={inputRef}
                type="text"
                placeholder={isLoading ? 'Loading...' : 'Search for a restaurant...'}
                defaultValue={defaultValue}
                disabled={isLoading}
                className="autocomplete-input"
            />
            {isLoading && <span className="loading-indicator">Loading Google Places...</span>}
        </div>
    );
};

export default RestaurantAutocomplete;
