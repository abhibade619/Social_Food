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

            console.log('CACHE_DEBUG_STEP: cache query result', {
                cacheError,
                rows: cachedData?.length ?? 0
            });

            if (cacheError) {
                console.error('CACHE_DEBUG_CACHE_ERROR', cacheError);
            }

            if (cachedData && cachedData.length >= 20) {
                console.log('CACHE_DEBUG: using cached restaurants for', city);
                processAndSetRestaurants(cachedData);
                setLoading(false);
                return;
            }

            // 2. Fetch from Google Places
            if (!placesApi.Place || !placesApi.Place.searchByText) {
                console.error('CACHE_DEBUG_ERROR: placesApi.Place.searchByText missing');
                setLoading(false);
                return;
            }

            console.log('CACHE_DEBUG: fetching from Google Places for', city);

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

            console.log('CACHE_DEBUG: raw places from API', places);

            if (!places || places.length === 0) {
                console.warn('CACHE_DEBUG_WARNING: no places returned from API');
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
                                    console.warn('CACHE_DEBUG_PHOTO_GET_URI_ERROR', e);
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

            console.log('CACHE_DEBUG: normalized results to insert', results);

            // 4. Upsert into cache
            const { data: upserted, error: upsertError } = await supabase
                .from('cached_restaurants')
                .upsert(results, { onConflict: 'place_id' })
                .select();

            console.log('CACHE_DEBUG_UPSERT_RESULT', { upsertError, upserted });

            if (upsertError) {
                console.error('CACHE_DEBUG_ERROR: upsert failed', upsertError);
            } else {
                console.log(
                    'CACHE_DEBUG_SUCCESS: cached restaurants inserted/updated:',
                    upserted?.length ?? 0
                );
            }

            // 5. Use the normalized results for UI
            processAndSetRestaurants(results);
        } catch (error) {
            console.error('CACHE_DEBUG_FATAL_ERROR: fetchRestaurants failed', error);
        } finally {
            setLoading(false);
        }
    };

    const [visibleCount, setVisibleCount] = useState(8);

    // ... (existing useEffects)

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

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 8);
    };

    const toggleVisited = async (e, restaurant) => {
        e.stopPropagation();
        if (!user) return;

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
        if (!user) return;

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

    const renderRestaurantCard = (restaurant) => {
        const isVisited = visitedMap[restaurant.place_id];
        const isWishlisted = wishlistMap[restaurant.place_id];
        // Handle photos: could be array of strings (from cache) or Google Maps objects
        let photoUrl = null;
        if (restaurant.photos && restaurant.photos.length > 0) {
            const firstPhoto = restaurant.photos[0];
            if (typeof firstPhoto === 'string') {
                photoUrl = firstPhoto;
            } else if (firstPhoto.getUrl) {
                photoUrl = firstPhoto.getUrl({ maxWidth: 400 });
            }
        }

        return (
            <div key={restaurant.place_id} className="popular-card" onClick={() => onRestaurantClick(restaurant)}>
                <div className="popular-image" style={{ backgroundImage: photoUrl ? `url(${photoUrl})` : 'none', backgroundColor: '#2a2a2a' }}>
                    {!photoUrl && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555' }}>No Image</div>}
                    <div className="popular-rating">
                        ⭐ {restaurant.rating || 'N/A'} ({restaurant.user_ratings_total || 0})
                    </div>
                    {restaurant.internalRating && (
                        <div className="internal-rating-badge" style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255, 107, 107, 0.9)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>
                            FoodSocial: {restaurant.internalRating}
                        </div>
                    )}
                </div>
                <div className="popular-content">
                    <h3>{restaurant.name}</h3>
                    <div className="restaurant-meta" style={{ marginBottom: '1rem', color: '#888', fontSize: '0.9rem' }}>
                        <span>{restaurant.types?.[0]?.replace('_', ' ') || 'Restaurant'}</span>
                        {restaurant.price_level && <span> • {'💵'.repeat(restaurant.price_level)}</span>}
                    </div>

                    <div className="card-actions" style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                        <button
                            className={`btn-action ${isVisited ? 'active' : ''}`}
                            onClick={(e) => toggleVisited(e, restaurant)}
                            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #444', background: isVisited ? 'rgba(76, 175, 80, 0.2)' : 'transparent', color: isVisited ? '#81c784' : '#ccc', cursor: 'pointer' }}
                            title={isVisited ? "Marked as Visited" : "Mark as Visited"}
                        >
                            {isVisited ? '✅ Visited' : '📍 Visited'}
                        </button>
                        <button
                            className={`btn-action ${isWishlisted ? 'active' : ''}`}
                            onClick={(e) => toggleWishlist(e, restaurant)}
                            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #444', background: isWishlisted ? 'rgba(255, 193, 7, 0.2)' : 'transparent', color: isWishlisted ? '#ffd54f' : '#ccc', cursor: 'pointer' }}
                            title={isWishlisted ? "Saved to Wishlist" : "Save to Wishlist"}
                        >
                            {isWishlisted ? '⭐ Saved' : '☆ Save'}
                        </button>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={(e) => { e.stopPropagation(); onNewLog(restaurant); }}
                        style={{ width: '100%', marginTop: '8px', padding: '8px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        📝 Log It
                    </button>
                </div>
            </div>
        );
    };

    if (loading) return <div className="loading-spinner">Loading recommendations...</div>;
    if (popularRestaurants.length === 0 && topRatedRestaurants.length === 0) return null;

    const visiblePopular = popularRestaurants.slice(0, visibleCount);
    const visibleTopRated = topRatedRestaurants.slice(0, visibleCount);

    return (
        <div className="recommendations-container">
            {/* Popular Section */}
            <div className="popular-restaurants-section">
                <h2 className="section-title-premium">Popular in {city}</h2>
                <div className="popular-grid">
                    {visiblePopular.map(renderRestaurantCard)}
                </div>
                {visibleCount < popularRestaurants.length && (
                    <div className="load-more-container" style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <button className="btn-secondary" onClick={handleLoadMore}>
                            Load More
                        </button>
                    </div>
                )}
            </div>

            {/* Top Rated Section */}
            {visibleTopRated.length > 0 && (
                <div className="popular-restaurants-section" style={{ marginTop: '3rem' }}>
                    <h2 className="section-title-premium">Top Rated Gems</h2>
                    <div className="popular-grid">
                        {visibleTopRated.map(renderRestaurantCard)}
                    </div>
                    {visibleCount < topRatedRestaurants.length && (
                        <div className="load-more-container" style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <button className="btn-secondary" onClick={handleLoadMore}>
                                Load More
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PopularRestaurants;
