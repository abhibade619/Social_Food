import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import { loadPlacesLibrary } from '../utils/googleMaps';

const PopularRestaurants = ({ city, onRestaurantClick, onNewLog }) => {
    const { user } = useAuth();
    const [popularRestaurants, setPopularRestaurants] = useState([]);
    const [topRatedRestaurants, setTopRatedRestaurants] = useState([]);
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
            fetchRestaurants();
        }
    }, [city, placesApi]);

    useEffect(() => {
        const allRestaurants = [...popularRestaurants, ...topRatedRestaurants];
        if (user && allRestaurants.length > 0) {
            fetchUserInteractions(allRestaurants);
        }
    }, [user, popularRestaurants, topRatedRestaurants]);

    const fetchUserInteractions = async (restaurants) => {
        try {
            const placeIds = [...new Set(restaurants.map(r => r.place_id))]; // Unique IDs

            // Fetch visited
            const { data: visitedData } = await supabase
                .from('visited_restaurants')
                .select('place_id')
                .eq('user_id', user.id)
                .in('place_id', placeIds);

            const vMap = {};
            visitedData?.forEach(v => vMap[v.place_id] = true);
            setVisitedMap(vMap);

            // Fetch wishlist
            const { data: wishlistData } = await supabase
                .from('wishlist')
                .select('place_id')
                .eq('user_id', user.id)
                .in('place_id', placeIds);

            const wMap = {};
            wishlistData?.forEach(w => wMap[w.place_id] = true);
            setWishlistMap(wMap);

            // Fetch internal ratings
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

            // Update internal ratings in state
            const updateWithRatings = (list) => list.map(r => {
                const stats = ratingsMap[r.place_id];
                return {
                    ...r,
                    internalRating: stats ? (stats.sum / stats.count).toFixed(1) : null,
                    internalReviewCount: stats ? stats.count : 0
                };
            });

            setPopularRestaurants(prev => updateWithRatings(prev));
            setTopRatedRestaurants(prev => updateWithRatings(prev));

        } catch (error) {
            console.error("Error fetching interactions:", error);
        }
    };

    const fetchRestaurants = async () => {
        setLoading(true);
        try {
            // 1. Check Cache
            const { data: cachedData } = await supabase
                .from('cached_restaurants')
                .select('*')
                .eq('city', city)
                .gt('last_updated', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                .limit(60); // Fetch more to split

            if (cachedData && cachedData.length >= 20) {
                console.log("Using cached restaurants for", city);
                processAndSetRestaurants(cachedData);
                setLoading(false);
                return;
            }

            // 2. Fetch from Google Places if cache miss or insufficient data
            console.log("Fetching from Google Places for", city);

            let results = [];
            if (placesApi.Place && placesApi.Place.searchByText) {
                // Fetch "popular"
                const { places } = await placesApi.Place.searchByText({
                    textQuery: `best restaurants in ${city}`, // "best" usually gives high rated + popular
                    fields: ['id', 'displayName', 'formattedAddress', 'rating', 'userRatingCount', 'priceLevel', 'types', 'photos', 'location'],
                    maxResultCount: 20 // Max per call is usually 20
                });

                // We might need more, but let's start with 20 high quality ones. 
                // Google's "best" query usually ranks by a mix of rating and popularity.

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
            }

            // 3. Save to Cache
            if (results.length > 0) {
                console.log("Attempting to cache", results.length, "restaurants...");
                const { error: upsertError } = await supabase
                    .from('cached_restaurants')
                    .upsert(results, { onConflict: 'place_id' });

                if (upsertError) {
                    console.error("CACHE_DEBUG_ERROR:", upsertError);
                } else {
                    console.log("CACHE_DEBUG_SUCCESS: Successfully cached", results.length, "restaurants");
                }

                processAndSetRestaurants(results);
            }

        } catch (error) {
            console.error("Error fetching restaurants:", error);
        } finally {
            setLoading(false);
        }
    };

    const processAndSetRestaurants = (data) => {
        // 1. Popular: Sort by review count (desc), take top 10
        const popular = [...data].sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0)).slice(0, 10);

        // 2. Top Rated: Filter > 200 reviews, Sort by rating (desc), take top 10
        // If not enough with > 200 reviews, fallback to just rating
        let topRated = data.filter(r => (r.user_ratings_total || 0) >= 200);
        if (topRated.length < 5) topRated = data; // Fallback

        topRated = topRated.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);

        setPopularRestaurants(popular);
        setTopRatedRestaurants(topRated);
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

    const handleLogClick = (restaurant) => {
        if (onNewLog) {
            onNewLog({
                restaurant_name: restaurant.name,
                location: restaurant.address,
                place_id: restaurant.place_id
            });
        }
    };

    const renderRestaurantCard = (restaurant) => (
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
                        title="Mark Visited"
                    >
                        {visitedMap[restaurant.place_id] ? '✅' : 'Visited'}
                    </button>
                    <button
                        className={`btn-action ${wishlistMap[restaurant.place_id] ? 'active' : ''}`}
                        onClick={() => toggleWishlist(restaurant)}
                        title="Wishlist"
                    >
                        {wishlistMap[restaurant.place_id] ? '❤️' : '🤍'}
                    </button>
                    <button
                        className="btn-action"
                        onClick={() => handleLogClick(restaurant)}
                        title="Log Visit"
                    >
                        📝
                    </button>
                </div>
            </div>
        </div>
    );
    if (loading) return <div className="loading-spinner">Loading recommendations...</div>;
    if (popularRestaurants.length === 0 && topRatedRestaurants.length === 0) return null;

    return (
        <div className="recommendations-container">
            {/* Popular Section */}
            <div className="popular-restaurants-section">
                <h2 className="section-title-premium">Popular in {city}</h2>
                <div className="popular-grid">
                    {popularRestaurants.map(renderRestaurantCard)}
                </div>
            </div>

            {/* Top Rated Section */}
            <div className="popular-restaurants-section" style={{ marginTop: '3rem' }}>
                <h2 className="section-title-premium">Top Rated Gems</h2>
                <div className="popular-grid">
                    {topRatedRestaurants.map(renderRestaurantCard)}
                </div>
            </div>
        </div>
    );
};

export default PopularRestaurants;
