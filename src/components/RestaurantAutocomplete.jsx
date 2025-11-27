import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

const RestaurantAutocomplete = ({ onPlaceSelected, defaultValue = '', locationBias = null }) => {
    const inputRef = useRef(null);
    const [autocomplete, setAutocomplete] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Update bias when location changes
    useEffect(() => {
        if (autocomplete && locationBias && locationBias.lat && locationBias.lng) {
            const circle = new window.google.maps.Circle({
                center: { lat: locationBias.lat, lng: locationBias.lng },
                radius: 50000 // 50km radius
            });
            autocomplete.setBounds(circle.getBounds());
            autocomplete.setOptions({ strictBounds: false }); // Prefer bounds but don't restrict
            console.log("Updated autocomplete bias to:", locationBias.name);
        }
    }, [locationBias, autocomplete]);

    useEffect(() => {
        const initAutocomplete = async () => {
            try {
                const { Autocomplete } = await importLibrary("places");

                if (!inputRef.current) return;

                const options = {
                    types: ['establishment'],
                    fields: [
                        'place_id',
                        'name',
                        'formatted_address',
                        'geometry',
                        'address_components',
                        'rating',
                        'user_ratings_total',
                        'types',
                        'international_phone_number',
                        'website'
                    ]
                };

                // Apply initial bias if available
                if (locationBias && locationBias.lat && locationBias.lng) {
                    await importLibrary("maps");

                    const circle = new window.google.maps.Circle({
                        center: { lat: locationBias.lat, lng: locationBias.lng },
                        radius: 50000
                    });
                    options.bounds = circle.getBounds();
                    options.strictBounds = false;
                }

                const autocompleteInstance = new Autocomplete(inputRef.current, options);

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
                        user_ratings_total: place.user_ratings_total,
                        phone: place.international_phone_number,
                        website: place.website
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

        initAutocomplete();
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
