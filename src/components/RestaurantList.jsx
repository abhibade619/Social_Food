import { useState, useEffect, useRef } from 'react';
import { importLibrary } from '@googlemaps/js-api-loader';

const RestaurantList = ({ location, cuisine, onRestaurantClick }) => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const placesService = useRef(null);

    useEffect(() => {
        const fetchRestaurants = async () => {
            if (!location || !location.name) return;

            setLoading(true);
            setError(null);

            try {
                const { PlacesService } = await importLibrary("places");

                if (!placesService.current) {
                    placesService.current = new PlacesService(document.createElement('div'));
                }

                const query = cuisine === 'all'
                    ? `restaurants in ${location.name}`
                    : `${cuisine} restaurants in ${location.name}`;

                const request = {
                    query: query,
                    fields: ['place_id', 'name', 'formatted_address', 'geometry', 'rating', 'user_ratings_total', 'photos', 'types']
                };

                // If we have coordinates, we can bias the search, but textSearch with "in City" is usually enough.
                // However, passing locationBias might help if the city name is ambiguous.
                if (location.lat && location.lng) {
                    request.location = { lat: location.lat, lng: location.lng };
                    request.radius = 5000; // 5km bias
                }

                placesService.current.textSearch(request, (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                        // Sort by rating (descending)
                        const sortedResults = results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                        setRestaurants(sortedResults);
                    } else {
                        setRestaurants([]);
                        if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                            setError('Failed to fetch restaurants');
                        }
                    }
                    setLoading(false);
                });

            } catch (err) {
                console.error("Error fetching restaurants:", err);
                setError('Error loading Google Maps API');
                setLoading(false);
            }
        };

        fetchRestaurants();
    }, [location, cuisine]);

    if (loading) return <div className="restaurant-list-loading">Loading top {cuisine === 'all' ? '' : cuisine} restaurants in {location.name}...</div>;
    if (error) return <div className="restaurant-list-error">{error}</div>;
    if (restaurants.length === 0 && location.name) return <div className="restaurant-list-empty">No restaurants found in {location.name}.</div>;
    if (!location.name) return null;

    return (
        <div className="restaurant-list">
            <h3>Top Rated {cuisine === 'all' ? '' : cuisine} Restaurants in {location.name}</h3>
            <div className="restaurant-grid">
                {restaurants.map((place) => (
                    <div
                        key={place.place_id}
                        className="restaurant-card"
                        onClick={() => onRestaurantClick(place)}
                    >
                        <div className="restaurant-image-placeholder">
                            {place.photos && place.photos.length > 0 ? (
                                <img src={place.photos[0].getUrl({ maxWidth: 400 })} alt={place.name} />
                            ) : (
                                <span className="no-image">🍽️</span>
                            )}
                        </div>
                        <div className="restaurant-info">
                            <h4>{place.name}</h4>
                            <div className="restaurant-meta">
                                <span className="rating">⭐ {place.rating} ({place.user_ratings_total})</span>
                            </div>
                            <p className="address">{place.formatted_address}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RestaurantList;
