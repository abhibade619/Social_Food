import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import { loadPlacesLibrary } from '../utils/googleMaps';
import { HeartIcon, CheckCircleIcon, CheckIcon } from './Icons';

const PopularRestaurants = ({ city, onRestaurantClick, onNewLog, onAuthRequired }) => {
    const { user } = useAuth();
    const [popularRestaurants, setPopularRestaurants] = useState([]);
    const [topRatedRestaurants, setTopRatedRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [placesApi, setPlacesApi] = useState(null);
    const [selectedCuisine, setSelectedCuisine] = useState('All');

    // Helper to get icon for cuisine
    const getIconForCuisine = (cuisine) => {
        const map = {
            'All': '🍽️',
            'Italian': '🍝',
            'Chinese': '🥡',
            'Japanese': '🍣',
            'Mexican': '🌮',
            'Indian': '🍛',
            'American': '🍔',
            'Thai': '🍜',
            'French': '🥐',
            'Mediterranean': '🥙',
            'Greek': '🥗',
            'Spanish': '🥘',
            'Korean': '🥢',
            'Vietnamese': '🍲',
            'Vegetarian': '🥦',
            'Vegan': '🌱',
            'Seafood': '🦞',
            'Steak': '🥩',
            'Pizza': '🍕',
            'Burger': '🍔',
            'Sushi': '🍣',
            'Cafe': '☕',
            'Bakery': '🥖',
            'Dessert': '🍰',
            'Bar': '🍺'
        };
        return map[cuisine] || '🍴';
    };

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
        if (!city || !placesApi) return;

        setLoading(true);

        try {
            // 1. Check cache first
            const freshnessThreshold = new Date();
            freshnessThreshold.setDate(freshnessThreshold.getDate() - 30);

            const { data: cachedData, error: cacheError } = await supabase
                .from('cached_restaurants')
                .select('*')
                .eq('city', city)
                .gt('last_updated', freshnessThreshold.toISOString());

            if (cachedData && cachedData.length >= 20) {
                processAndSetRestaurants(cachedData);
                setLoading(false);
                return;
            }

            // 2. Fetch from Google Places
            if (!placesApi.Place || !placesApi.Place.searchByText) {
                setLoading(false);
                return;
            }

            const { places } = await placesApi.Place.searchByText({
                textQuery: `best restaurants in ${city}`,
                fields: [
                    'id',
                    'displayName',
                    'formattedAddress',
                    'rating',
                    'userRatingCount',
                    'priceLevel',
                    'types',
                    'photos',
                    'location'
                ],
                maxResultCount: 20
            });

            if (!places || places.length === 0) {
                setLoading(false);
                return;
            }

            // 3. Normalize data so it matches cached_restaurants columns
            const results = places.map((place) => {
                const name =
                    typeof place.displayName === 'string'
                        ? place.displayName
                        : place.displayName?.text ?? 'Unknown';

                const photos =
                    Array.isArray(place.photos)
                        ? place.photos
                            .map((p) => {
                                try {
                                    return p.getURI({ maxWidth: 400 });
                                } catch (e) {
                                    return null;
                                }
                            })
                            .filter(Boolean)
                        : [];

                const types = Array.isArray(place.types) ? place.types : [];

                const payloadRow = {
                    place_id: place.id,
                    name,
                    address: place.formattedAddress ?? null,
                    city,
                    rating:
                        typeof place.rating === 'number'
                            ? place.rating
                            : place.rating
                                ? Number(place.rating)
                                : null,
                    user_ratings_total:
                        typeof place.userRatingCount === 'number'
                            ? place.userRatingCount
                            : place.userRatingCount
                                ? Number(place.userRatingCount)
                                : null,
                    price_level:
                        typeof place.priceLevel === 'number'
                            ? place.priceLevel
                            : place.priceLevel
                                ? Number(place.priceLevel)
                                : null,
                    photos, // JSONB
                    types,  // JSONB
                    last_updated: new Date().toISOString()
                };

                return payloadRow;
            });

            // 4. Upsert into cache
            await supabase
                .from('cached_restaurants')
                .upsert(results, { onConflict: 'place_id' });

            // 5. Use the normalized results for UI
            processAndSetRestaurants(results);
        } catch (error) {
            console.error('fetchRestaurants failed', error);
        } finally {
            setLoading(false);
        }
    };

    const processAndSetRestaurants = (data) => {
        // 1. Popular: Sort by review count (desc)
        const popular = [...data].sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0));

        // 2. Top Rated: Filter > 200 reviews, Sort by rating (desc)
        let topRated = data.filter(r => (r.user_ratings_total || 0) >= 200);
        if (topRated.length < 5) topRated = data; // Fallback

        topRated = topRated.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        setPopularRestaurants(popular);
        setTopRatedRestaurants(topRated);
    };

    const toggleVisited = async (e, restaurant) => {
        e.stopPropagation();
        if (!user) {
            if (onAuthRequired) onAuthRequired();
            return;
        }

        const placeId = restaurant.place_id;
        const isVisited = visitedMap[placeId];

        // Optimistic update
        setVisitedMap(prev => ({ ...prev, [placeId]: !isVisited }));

        try {
            if (isVisited) {
                const { error } = await supabase
                    .from('visited_restaurants')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('place_id', placeId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('visited_restaurants')
                    .insert({
                        user_id: user.id,
                        place_id: placeId,
                        restaurant_name: restaurant.name,
                        restaurant_data: restaurant
                    });
                if (error) throw error;
            }
        } catch (error) {
            console.error("Error toggling visited:", error);
            // Revert on error
            setVisitedMap(prev => ({ ...prev, [placeId]: isVisited }));
        }
    };

    const toggleWishlist = async (e, restaurant) => {
        e.stopPropagation();
        if (!user) {
            if (onAuthRequired) onAuthRequired();
            return;
        }

        const placeId = restaurant.place_id;
        const isWishlisted = wishlistMap[placeId];

        // Optimistic update
        setWishlistMap(prev => ({ ...prev, [placeId]: !isWishlisted }));

        try {
            if (isWishlisted) {
                const { error } = await supabase
                    .from('wishlist')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('place_id', placeId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('wishlist')
                    .insert({
                        user_id: user.id,
                        place_id: placeId,
                        restaurant_name: restaurant.name,
                        restaurant_data: restaurant
                    });
                if (error) throw error;
            }
        } catch (error) {
            console.error("Error toggling wishlist:", error);
            // Revert on error
            setWishlistMap(prev => ({ ...prev, [placeId]: isWishlisted }));
        }
    };

    // Curated cuisines list
    const cuisines = ['All', 'American', 'Indian', 'Chinese', 'Pizza', 'Burger', 'Sushi', 'Mexican', 'Italian', 'Thai'];

    const [visibleCount, setVisibleCount] = useState(8);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 8);
    };

    const filterRestaurants = (list) => {
        if (selectedCuisine === 'All') return list;
        return list.filter(r => {
            if (!r.types) return false;
            // Simple keyword match for the curated list
            const typeString = r.types.join(' ').toLowerCase();
            const cuisineLower = selectedCuisine.toLowerCase();
            return typeString.includes(cuisineLower);
        });
    };

    const filteredPopular = filterRestaurants(popularRestaurants);
    const filteredTopRated = filterRestaurants(topRatedRestaurants);

    const visiblePopular = filteredPopular.slice(0, visibleCount);
    const visibleTopRated = filteredTopRated.slice(0, visibleCount);

    const renderRestaurantCard = (restaurant) => {
        // ... (existing logic for photoUrl, isVisited, isWishlisted)
        const isVisited = visitedMap[restaurant.place_id];
        const isWishlisted = wishlistMap[restaurant.place_id];
        let photoUrl = null;
        if (restaurant.photos && restaurant.photos.length > 0) {
            const firstPhoto = restaurant.photos[0];
            if (typeof firstPhoto === 'string') {
                photoUrl = firstPhoto;
            } else if (firstPhoto.getUrl) {
                photoUrl = firstPhoto.getUrl({ maxWidth: 400 });
            }
        }

        const cuisine = restaurant.types?.[0]?.split('_')[0] || 'Restaurant';
        const formattedCuisine = cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
        const address = restaurant.address || restaurant.formattedAddress || '';
        const shortAddress = address.split(',')[0];

        return (
            <div key={restaurant.place_id} className="popular-card" onClick={() => onRestaurantClick(restaurant)}>
                <div className="popular-image" style={{ backgroundImage: photoUrl ? `url(${photoUrl})` : 'none', backgroundColor: '#2a2a2a' }}>
                    {!photoUrl && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555' }}>No Image</div>}
                    {restaurant.internalRating && (
                        <div className="popular-rating">
                            ⭐ {restaurant.internalRating} ({restaurant.internalReviewCount})
                        </div>
                    )}
                </div>
                <div className="popular-content">

                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', width: '100%' }}>
                        <h3 style={{ margin: 0, flex: 1, paddingRight: '10px', lineHeight: '1.2' }}>{restaurant.name}</h3>
                        <button
                            className={`btn-wishlist-icon ${isWishlisted ? 'active' : ''}`}
                            onClick={(e) => toggleWishlist(e, restaurant)}
                            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                            style={{ flexShrink: 0 }}
                        >
                            <HeartIcon filled={isWishlisted} className="icon-md" />
                        </button>
                    </div>
                    <div className="restaurant-meta">
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '700', fontSize: '0.95rem' }}>{formattedCuisine}</span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', fontWeight: '600' }}>{shortAddress}</span>
                    </div>

                    <div className="card-actions" style={{ display: 'flex', gap: '8px', marginTop: 'auto', width: '100%' }}>
                        <button
                            className={`btn-icon-premium ${isVisited ? 'visited' : ''}`}
                            onClick={(e) => toggleVisited(e, restaurant)}
                            title={isVisited ? "Marked as Visited" : "Mark as Visited"}
                            style={{ flex: 1, justifyContent: 'center' }}
                        >
                            {isVisited ? (
                                <>
                                    <CheckIcon className="icon-sm" />
                                    <span>Visited</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircleIcon className="icon-sm" />
                                    <span>Visited?</span>
                                </>
                            )}
                        </button>
                        <button
                            className="btn-primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                onNewLog({
                                    ...restaurant,
                                    location: restaurant.city || city // Ensure city is passed as location
                                });
                            }}
                            style={{
                                flex: 1,
                                padding: '0 10px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'var(--primary-gradient)',
                                color: 'white',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '36px',
                                fontSize: '0.9rem'
                            }}
                        >
                            📝 Log It
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="loading-spinner">Loading recommendations...</div>;
    if (popularRestaurants.length === 0 && topRatedRestaurants.length === 0) return null;

    return (
        <div className="recommendations-container">
            {/* Popular Section */}
            <div className="popular-restaurants-section">
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 className="section-title-premium" style={{ marginBottom: 0 }}>Popular in {city}</h2>
                    <div className="filters-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                        {/* Single Row Icon Filters */}
                        <div className="filter-scroll-container" style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '5px', scrollbarWidth: 'none', msOverflowStyle: 'none', minHeight: '50px', display: 'flex', alignItems: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                                {cuisines.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setSelectedCuisine(c)}
                                        className={`filter-pill ${selectedCuisine === c ? 'active' : ''}`}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <span>{c}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {visiblePopular.length > 0 ? (
                    <div className="popular-grid">
                        {visiblePopular.map(renderRestaurantCard)}
                    </div>
                ) : (
                    <div className="no-results">No restaurants match your filters.</div>
                )}

                {visibleCount < filteredPopular.length && (
                    <div className="load-more-container" style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <button className="btn-secondary" onClick={handleLoadMore}>
                            Load More
                        </button>
                    </div>
                )}

                {/* Top Rated Section */}
                {visibleTopRated.length > 0 && (
                    <div className="popular-restaurants-section" style={{ marginTop: '3rem' }}>
                        <h2 className="section-title-premium">Top Rated Gems</h2>
                        <div className="popular-grid">
                            {visibleTopRated.map(renderRestaurantCard)}
                        </div>
                        {visibleCount < filteredTopRated.length && (
                            <div className="load-more-container" style={{ textAlign: 'center', marginTop: '2rem' }}>
                                <button className="btn-secondary" onClick={handleLoadMore}>
                                    Load More
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PopularRestaurants;
