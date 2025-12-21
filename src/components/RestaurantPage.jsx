import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import MapComponent from './MapComponent';
import LogCard from './LogCard';
import { HeartIcon, CheckCircleIcon, CheckIcon } from './Icons';

const RestaurantPage = ({ restaurant, onBack, onNewLog, onViewProfile, triggerUpdate }) => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [isVisited, setIsVisited] = useState(false);
    const [visitedLoading, setVisitedLoading] = useState(false);
    const [stats, setStats] = useState({ visitedCount: 0, wishlistCount: 0 });

    // Parse coordinates if they exist
    const getCoordinates = () => {
        if (restaurant.latitude && restaurant.longitude) {
            return { lat: parseFloat(restaurant.latitude), lng: parseFloat(restaurant.longitude) };
        }
        return null;
    };

    const coordinates = getCoordinates();

    useEffect(() => {
        fetchRestaurantLogs();
        fetchStats();
        if (user) {
            checkWishlistStatus();
            checkVisitedStatus();
        }
    }, [restaurant, user]);

    const fetchRestaurantLogs = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (restaurant.place_id) {
                query = query.eq('place_id', restaurant.place_id);
            } else {
                query = query.eq('restaurant_name', restaurant.name);
            }

            const { data, error } = await query;

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching restaurant logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkWishlistStatus = async () => {
        try {
            let query = supabase
                .from('wishlist')
                .select('id')
                .eq('user_id', user.id);

            if (restaurant.place_id) {
                query = query.eq('place_id', restaurant.place_id);
            } else {
                query = query.eq('restaurant_name', restaurant.name);
            }

            const { data, error } = await query;
            if (error) throw error;
            setIsInWishlist(data && data.length > 0);
        } catch (error) {
            console.error('Error checking wishlist:', error);
        }
    };

    const checkVisitedStatus = async () => {
        try {
            let query = supabase
                .from('visited_restaurants')
                .select('id')
                .eq('user_id', user.id);

            if (restaurant.place_id) {
                query = query.eq('place_id', restaurant.place_id);
            } else {
                query = query.eq('restaurant_name', restaurant.name);
            }

            const { data, error } = await query;
            if (error) throw error;
            setIsVisited(data && data.length > 0);
        } catch (error) {
            console.error('Error checking visited:', error);
        }
    };

    const fetchStats = async () => {
        try {
            // Count visited
            let visitedQuery = supabase
                .from('visited_restaurants')
                .select('id', { count: 'exact', head: true });

            if (restaurant.place_id) {
                visitedQuery = visitedQuery.eq('place_id', restaurant.place_id);
            } else {
                visitedQuery = visitedQuery.eq('restaurant_name', restaurant.name);
            }
            const { count: visitedCount } = await visitedQuery;

            // Count wishlist
            let wishlistQuery = supabase
                .from('wishlist')
                .select('id', { count: 'exact', head: true });

            if (restaurant.place_id) {
                wishlistQuery = wishlistQuery.eq('place_id', restaurant.place_id);
            } else {
                wishlistQuery = wishlistQuery.eq('restaurant_name', restaurant.name);
            }
            const { count: wishlistCount } = await wishlistQuery;

            setStats({ visitedCount: visitedCount || 0, wishlistCount: wishlistCount || 0 });

        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const toggleWishlist = async () => {
        if (!user) return;
        setWishlistLoading(true);
        try {
            if (isInWishlist) {
                // Remove
                let query = supabase
                    .from('wishlist')
                    .delete()
                    .eq('user_id', user.id);

                if (restaurant.place_id) {
                    query = query.eq('place_id', restaurant.place_id);
                } else {
                    query = query.eq('restaurant_name', restaurant.name);
                }

                const { error } = await query;
                if (error) throw error;
                setIsInWishlist(false);
                setStats(prev => ({ ...prev, wishlistCount: Math.max(0, prev.wishlistCount - 1) }));
            } else {
                // Add
                const { error } = await supabase
                    .from('wishlist')
                    .insert([{
                        user_id: user.id,
                        restaurant_name: restaurant.name,
                        location: restaurant.location || restaurant.address,
                        cuisine: restaurant.cuisine,
                        place_id: restaurant.place_id
                    }]);

                if (error) throw error;
                setIsInWishlist(true);
                setStats(prev => ({ ...prev, wishlistCount: prev.wishlistCount + 1 }));
            }
            if (onNewLog && typeof onNewLog === 'function' && !onNewLog.name) {
                // Check if triggerUpdate is passed via onNewLog or if we need to accept it as a prop
                // Actually, triggerUpdate is passed as a prop to RestaurantPage
            }
            // Wait, I need to use the triggerUpdate prop I added to the component signature?
            // I haven't added it to the signature in this file yet!
            // Let me check the component definition line.
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            alert(`Failed to update wishlist: ${error.message || JSON.stringify(error)}`);
        } finally {
            setWishlistLoading(false);
            // Call triggerUpdate if available
            // I need to make sure triggerUpdate is available in scope.
        }
    };

    const toggleVisited = async () => {
        if (!user) return;
        setVisitedLoading(true);
        try {
            if (isVisited) {
                // Remove
                let query = supabase
                    .from('visited_restaurants')
                    .delete()
                    .eq('user_id', user.id);

                if (restaurant.place_id) {
                    query = query.eq('place_id', restaurant.place_id);
                } else {
                    query = query.eq('restaurant_name', restaurant.name);
                }

                const { error } = await query;
                if (error) throw error;
                setIsVisited(false);
                setStats(prev => ({ ...prev, visitedCount: Math.max(0, prev.visitedCount - 1) }));
            } else {
                // Add
                const payload = {
                    user_id: user.id,
                    place_id: restaurant.place_id || 'unknown', // Fallback if no place_id
                    restaurant_name: restaurant.name,
                    location: restaurant.location || restaurant.address
                };

                const { error } = await supabase
                    .from('visited_restaurants')
                    .insert([payload]);

                if (error) throw error;
                setIsVisited(true);
                setStats(prev => ({ ...prev, visitedCount: prev.visitedCount + 1 }));
            }
        } catch (error) {
            console.error('Error toggling visited:', error);
            alert(`Failed to update visited status: ${error.message || JSON.stringify(error)}`);
        } finally {
            setVisitedLoading(false);
        }
    };

    // Calculate average rating
    const averageRating = logs.length > 0
        ? (logs.reduce((acc, log) => acc + (parseFloat(log.rating) || 0), 0) / logs.length).toFixed(1)
        : null;

    // Lightbox State
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [allPhotos, setAllPhotos] = useState([]);

    useEffect(() => {
        if (logs.length > 0) {
            const photos = logs.flatMap(log => {
                return typeof log.photos === 'string' ? JSON.parse(log.photos) : (log.photos || []);
            });
            setAllPhotos(photos);
        }
    }, [logs]);

    const openLightbox = (index) => {
        setLightboxIndex(index);
    };

    const closeLightbox = () => {
        setLightboxIndex(null);
    };

    const nextImage = (e) => {
        e.stopPropagation();
        setLightboxIndex((prev) => (prev + 1) % allPhotos.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setLightboxIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
    };

    return (
        <div className="restaurant-page container">
            <div className="restaurant-header-premium">
                <div className="restaurant-hero">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h1 className="restaurant-title-large" style={{ margin: 0, flex: 1 }}>{restaurant.name || 'Restaurant Details'}</h1>
                        <button
                            className={`btn-wishlist-icon ${isInWishlist ? 'active' : ''}`}
                            onClick={toggleWishlist}
                            disabled={wishlistLoading}
                            title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                            style={{ marginLeft: '1rem', padding: '8px' }}
                        >
                            <HeartIcon filled={isInWishlist} style={{ width: '32px', height: '32px' }} />
                        </button>
                    </div>
                    <div className="restaurant-badges" style={{ marginTop: '0.5rem' }}>
                        {averageRating ? (
                            <span className="badge-rating">⭐ {averageRating} ({logs.length} {logs.length === 1 ? 'log' : 'logs'})</span>
                        ) : (
                            restaurant.rating && <span className="badge-rating">⭐ {restaurant.rating}</span>
                        )}
                        {restaurant.price_level && <span className="badge-price">{'$'.repeat(restaurant.price_level)}</span>}
                        <span className="badge-cuisine">{restaurant.cuisine || 'Restaurant'}</span>
                    </div>

                    <div className="restaurant-stats-badges" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <span>👥 {stats.visitedCount} visited</span>
                        <span>❤️ {stats.wishlistCount} wishlisted</span>
                    </div>

                    <div className="restaurant-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', alignItems: 'stretch' }}>
                        <button
                            className="btn-primary"
                            onClick={() => onNewLog(restaurant)}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '56px',
                                background: 'linear-gradient(135deg, #D4AF37 0%, #F2C94C 100%)',
                                color: '#000',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                borderRadius: '16px',
                                border: 'none',
                                boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
                                whiteSpace: 'nowrap',
                                padding: '0 12px'
                            }}
                        >
                            📝 Log Visit
                        </button>
                        <button
                            className={`btn-icon-premium large ${isVisited ? 'visited' : ''}`}
                            onClick={toggleVisited}
                            disabled={visitedLoading}
                            title={isVisited ? "Unmark Visited" : "Mark as Visited"}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                height: '48px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                background: isVisited ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                color: isVisited ? '#4CAF50' : 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            {isVisited ? (
                                <>
                                    <CheckIcon className="icon-md" />
                                    <span>Visited</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircleIcon className="icon-md" />
                                    <span>Mark Visited</span>
                                </>
                            )}
                        </button>
                        <button
                            className={`btn-icon-premium large ${isInWishlist ? 'wishlisted' : ''}`}
                            onClick={toggleWishlist}
                            disabled={wishlistLoading}
                            title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                height: '48px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                background: isInWishlist ? 'rgba(255, 107, 107, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                color: isInWishlist ? '#FF6B6B' : 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            <HeartIcon filled={isInWishlist} className="icon-md" />
                            <span>{isInWishlist ? 'Added' : 'Wishlist'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="restaurant-grid-layout">
                {/* Left Column: Info & Map */}
                <div className="restaurant-info-column">
                    <div className="glass-panel info-card-premium">
                        <h3>Location & Contact</h3>
                        <div className="info-item">
                            <span className="info-icon">📍</span>
                            <p>{restaurant.location || restaurant.address || 'Address not available'}</p>
                        </div>
                        {restaurant.phone && (
                            <div className="info-item">
                                <span className="info-icon">📞</span>
                                <p>{restaurant.phone}</p>
                            </div>
                        )}
                        {restaurant.website && (
                            <div className="info-item">
                                <span className="info-icon">🌐</span>
                                <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="website-link">Visit Website</a>
                            </div>
                        )}

                        {coordinates && (
                            <div className="map-wrapper-premium">
                                <MapComponent
                                    center={coordinates}
                                    markers={[{ position: coordinates, title: restaurant.name }]}
                                />
                            </div>
                        )}
                    </div>

                    {restaurant.description && (
                        <div className="glass-panel info-card-premium">
                            <h3>About</h3>
                            <p className="description-text">{restaurant.description}</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Logs/Reviews */}
                <div className="restaurant-logs-column">
                    {/* Media Section */}
                    {allPhotos.length > 0 && (
                        <div className="restaurant-media-section glass-panel info-card-premium" style={{ marginBottom: '2rem' }}>
                            <h3 className="section-title-premium" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Photos</h3>
                            <div className="restaurant-media-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                                {allPhotos.slice(0, 12).map((photo, index) => (
                                    <div
                                        key={index}
                                        className="restaurant-media-item"
                                        style={{
                                            position: 'relative',
                                            paddingBottom: '100%',
                                            height: 0,
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => openLightbox(index)}
                                    >
                                        <img
                                            src={photo}
                                            alt={`Restaurant Photo ${index + 1}`}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <h2 className="section-title-premium">Community Logs</h2>
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading reviews...</p>
                        </div>
                    ) : logs.length > 0 ? (
                        <div className="logs-stack">
                            {logs.map((log) => (
                                <LogCard
                                    key={log.id}
                                    log={log}
                                    onViewProfile={onViewProfile}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-logs-state glass-panel">
                            <span className="empty-icon">📝</span>
                            <h3>No logs yet</h3>
                            <p>Be the first to log a visit here!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxIndex !== null && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <button className="lightbox-close" onClick={closeLightbox}>×</button>

                    {allPhotos.length > 1 && (
                        <>
                            <button className="log-image-nav-btn prev" onClick={prevImage}>‹</button>
                            <button className="log-image-nav-btn next" onClick={nextImage}>›</button>
                        </>
                    )}

                    <img
                        src={allPhotos[lightboxIndex]}
                        alt={`Photo ${lightboxIndex + 1}`}
                        className="lightbox-image"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default RestaurantPage;
