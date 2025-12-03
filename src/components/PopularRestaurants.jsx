import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import { loadPlacesLibrary } from '../utils/googleMaps';

const PopularRestaurants = ({ city, onRestaurantClick }) => {
    const { user } = useAuth();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [placesApi, setPlacesApi] = useState(null);
    const [visitedMap, setVisitedMap] = useState({});
    const [wishlistMap, setWishlistMap] = useState({});

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

    useEffect(() => {
        if (city && placesApi) {
            fetchPopularRestaurants();
        }
    }, [city, placesApi]);

    useEffect(() => {
        if (user && restaurants.length > 0) {
            fetchUserInteractions();
        }
    }, [user, restaurants]);

    const fetchUserInteractions = async () => {
        try {
            // Fetch visited
            const { data: visitedData } = await supabase
                .from('visited_restaurants')
                .select('place_id')
                .eq('user_id', user.id)
                .in('place_id', restaurants.map(r => r.place_id));

            const vMap = {};
            visitedData?.forEach(v => vMap[v.place_id] = true);
            setVisitedMap(vMap);

            // Fetch wishlist
            const { data: wishlistData } = await supabase
                .from('wishlist')
                .select('place_id')
                .eq('user_id', user.id)
                .in('place_id', restaurants.map(r => r.place_id));

            const wMap = {};
            wishlistData?.forEach(w => wMap[w.place_id] = true);
            setWishlistMap(wMap);

            // Fetch internal ratings
            const placeIds = restaurants.map(r => r.place_id);
            const { data: logsData } = await supabase
                .from('logs')
                .select('place_id, rating')
                .in('place_id', placeIds);

            const ratingsMap = {};
            if (logsData) {
                logsData.forEach(log => {
                    if (!ratingsMap[log.place_id]) {
                        ratingsMap[log.place_id] = { sum: 0, count: 0 };
                    }
                    ratingsMap[log.place_id].sum += parseFloat(log.rating);
                    ratingsMap[log.place_id].count += 1;
                });
            }

            setRestaurants(prev => prev.map(r => {
                const stats = ratingsMap[r.place_id];
                return {
                    ...r,
                    internalRating: stats ? (stats.sum / stats.count).toFixed(1) : null,
                    internalReviewCount: stats ? stats.count : 0
                };
            }));

        } catch (error) {
            console.error("Error fetching interactions:", error);
        }
    };

    const fetchPopularRestaurants = async () => {
        setLoading(true);
        try {
            // 1. Check Cache
            const { data: cachedData, error: cacheError } = await supabase
                .from('cached_restaurants')
                .select('*')
                .eq('city', city)
                .gt('last_updated', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // 30 days
                .order('rating', { ascending: false })
                .limit(20);

            if (cachedData && cachedData.length > 0) {
                console.log("Using cached restaurants for", city);
                setRestaurants(cachedData);
                setLoading(false);
                return;
            }

            // 2. Fetch from Google Places if cache miss
            console.log("Fetching from Google Places for", city);
            const service = new placesApi.PlacesService(document.createElement('div'));

            // We need to use TextSearch to find "popular restaurants in [city]"
            // Note: PlacesService is the legacy JS API. The new one is placesApi.Place.searchByText 
            // But loadPlacesLibrary might return the new library. Let's assume we use the new one if available.

            let results = [];

            if (placesApi.Place && placesApi.Place.searchByText) {
                const { places } = await placesApi.Place.searchByText({
                    textQuery: `popular restaurants in ${city}`,
                    fields: ['id', 'displayName', 'formattedAddress', 'rating', 'userRatingCount', 'priceLevel', 'types', 'photos', 'location'],
                    maxResultCount: 20
                });

                results = places.map(place => ({
                    place_id: place.id,
                    name: place.displayName,
                    address: place.formattedAddress,
                    city: city,
                    rating: place.rating,
                    user_ratings_total: place.userRatingCount,
                    price_level: place.priceLevel,
                    photos: place.photos ? place.photos.map(p => p.getURI({ maxWidth: 400 })) : [],
                    types: place.types,
                    last_updated: new Date().toISOString()
                }));

            } else {
                // Fallback or error handling if API not ready
                console.error("Places API not ready or incompatible");
                setLoading(false);
                return;
            }

            // 3. Save to Cache
            if (results.length > 0) {
                // Upsert to avoid duplicates
                const { error: upsertError } = await supabase
                    .from('cached_restaurants')
                    .upsert(results, { onConflict: 'place_id' });

                if (upsertError) console.error("Error caching restaurants:", upsertError);

                setRestaurants(results);
            }

        } catch (error) {
            console.error("Error fetching popular restaurants:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleVisited = async (restaurant) => {
        if (!user) return;
        const placeId = restaurant.place_id;
        const isVisited = visitedMap[placeId];

        try {
            if (isVisited) {
                await supabase.from('visited_restaurants').delete().match({ user_id: user.id, place_id: placeId });
                setVisitedMap(prev => ({ ...prev, [placeId]: false }));
            } else {
                await supabase.from('visited_restaurants').insert({
                    user_id: user.id,
                    place_id: placeId,
                    restaurant_name: restaurant.name,
                    location: restaurant.address
                });
                setVisitedMap(prev => ({ ...prev, [placeId]: true }));
            }
        } catch (error) {
            console.error("Error toggling visited:", error);
        }
    };

    const toggleWishlist = async (restaurant) => {
        if (!user) return;
        const placeId = restaurant.place_id;
        const isWishlisted = wishlistMap[placeId];

        try {
            if (isWishlisted) {
                await supabase.from('wishlist').delete().match({ user_id: user.id, place_id: placeId });
                setWishlistMap(prev => ({ ...prev, [placeId]: false }));
            } else {
                await supabase.from('wishlist').insert({
                    user_id: user.id,
                    place_id: placeId,
                    restaurant_name: restaurant.name,
                    location: restaurant.address,
                    cuisine: restaurant.types ? restaurant.types[0] : 'Restaurant'
                });
                setWishlistMap(prev => ({ ...prev, [placeId]: true }));
            }
        } catch (error) {
            console.error("Error toggling wishlist:", error);
        }
    };

    if (loading) return <div className="loading-spinner">Loading popular places...</div>;
    if (restaurants.length === 0) return null;

    return (
        <div className="popular-restaurants-section">
            <h2 className="section-title-premium">Popular in {city}</h2>
            <div className="popular-grid">
                {restaurants.map(restaurant => (
                    <div key={restaurant.place_id} className="popular-card glass-panel">
                        <div
                            className="popular-image"
                            style={{ backgroundImage: `url(${restaurant.photos && restaurant.photos[0] ? restaurant.photos[0] : '/placeholder-food.jpg'})` }}
                            onClick={() => onRestaurantClick && onRestaurantClick(restaurant)}
                        >
                            {restaurant.internalRating && (
                                <div className="popular-rating">⭐ {restaurant.internalRating} ({restaurant.internalReviewCount})</div>
                            )}
                        </div>
                        <div className="popular-content">
                            <h3 onClick={() => onRestaurantClick && onRestaurantClick(restaurant)}>{restaurant.name}</h3>
                            <p className="popular-address">{restaurant.address}</p>
                            <div className="popular-actions">
                                <button
                                    className={`btn-action ${visitedMap[restaurant.place_id] ? 'active' : ''}`}
                                    onClick={() => toggleVisited(restaurant)}
                                >
                                    {visitedMap[restaurant.place_id] ? '✅ Visited' : 'Mark Visited'}
                                </button>
                                <button
                                    className={`btn-action ${wishlistMap[restaurant.place_id] ? 'active' : ''}`}
                                    onClick={() => toggleWishlist(restaurant)}
                                >
                                    {wishlistMap[restaurant.place_id] ? '❤️' : '🤍'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PopularRestaurants;
