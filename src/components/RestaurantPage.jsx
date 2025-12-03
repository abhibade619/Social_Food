import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import MapComponent from './MapComponent';
import LogCard from './LogCard';

const RestaurantPage = ({ restaurant, onBack, onNewLog, onViewProfile }) => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

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
        if (user) {
            checkWishlistStatus();
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
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            alert(`Failed to update wishlist: ${error.message || JSON.stringify(error)}`);
        } finally {
            setWishlistLoading(false);
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
                <button onClick={onBack} className="back-button-premium">← Back</button>
                <div className="restaurant-hero">
                    <h1 className="restaurant-title-large">{restaurant.name || 'Restaurant Details'}</h1>
                    <div className="restaurant-badges">
                        {averageRating ? (
                            <span className="badge-rating">⭐ {averageRating} ({logs.length} {logs.length === 1 ? 'log' : 'logs'})</span>
                        ) : (
                            restaurant.rating && <span className="badge-rating">⭐ {restaurant.rating}</span>
                        )}
                        {restaurant.price_level && <span className="badge-price">{'$'.repeat(restaurant.price_level)}</span>}
                        <span className="badge-cuisine">{restaurant.cuisine || 'Restaurant'}</span>
                    </div>

                    <div className="restaurant-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            className="btn-primary"
                            onClick={() => onNewLog(restaurant)}
                        >
                            📝 Log your visit
                        </button>
                        <button
                            className={`btn-secondary ${isInWishlist ? 'active' : ''}`}
                            onClick={toggleWishlist}
                            disabled={wishlistLoading}
                        >
                            {isInWishlist ? '❤️ In Wishlist' : '🤍 Add to Wishlist'}
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
