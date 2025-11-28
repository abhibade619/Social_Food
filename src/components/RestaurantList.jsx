import { useEffect, useState } from 'react';
import { loadPlacesLibrary } from '../utils/googleMaps';

const RestaurantList = ({ location, cuisine, onRestaurantClick }) => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [placesApi, setPlacesApi] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                const lib = await loadPlacesLibrary();
                setPlacesApi(lib);
            } catch (e) {
                console.error("Error loading Google Maps API", e);
            }
        };
        init();
    }, []);

    useEffect(() => {
        const fetchRestaurants = async () => {
            if (!location || !location.name || !placesApi || !placesApi.Place) return;

            setLoading(true);
            setError(null);

            try {
                const query = cuisine === 'all'
                    ? `restaurants in ${location.name}`
                    : `${cuisine} restaurants in ${location.name}`;

                const request = {
                    textQuery: query,
                    fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount', 'photos', 'types'],
                    locationBias: location.lat && location.lng ? {
                        center: { lat: location.lat, lng: location.lng },
                        radius: 5000
                    } : undefined
                };

                const { places } = await placesApi.Place.searchByText(request);

                if (places && places.length > 0) {
                    const sortedResults = places.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    setRestaurants(sortedResults);
                } else {
                    setRestaurants([]);
                }
                setLoading(false);

            } catch (err) {
                console.error("Error fetching restaurants:", err);
                setError('Error loading restaurants');
                setLoading(false);
            }
        };

        fetchRestaurants();
    }, [location, cuisine, placesApi]);

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
                        key={place.id}
                        className="restaurant-card"
                        onClick={() => onRestaurantClick({
                            place_id: place.id,
                            name: place.displayName,
                            address: place.formattedAddress,
                            rating: place.rating,
                            user_ratings_total: place.userRatingCount,
                            photos: place.photos
                        })}
                    >
                        <div className="restaurant-image-placeholder">
                            {place.photos && place.photos.length > 0 ? (
                                <img src={place.photos[0].getURI({ maxWidth: 400 })} alt={place.displayName} />
                            ) : (
                                <span className="no-image">🍽️</span>
                            )}
                        </div>
                        <div className="restaurant-info">
                            <h4>{place.displayName}</h4>
                            <div className="restaurant-meta">
                                <span className="rating">⭐ {place.rating} ({place.userRatingCount})</span>
                            </div>
                            <p className="address">{place.formattedAddress}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RestaurantList;
