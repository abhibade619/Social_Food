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

    return (
        <div className="restaurant-page container">
            <div className="restaurant-header-premium">
                <button onClick={onBack} className="back-button-premium">← Back</button>
                <div className="restaurant-hero">
                    <h1 className="restaurant-title-large">{restaurant.name || 'Restaurant Details'}</h1>
                    <div className="restaurant-badges">
                        {averageRating ? (
                            <span className="badge-rating">⭐ {averageRating} ({logs.length} logs)</span>
                        ) : (
                            restaurant.rating && <span className="badge-rating">⭐ {restaurant.rating}</span>
                        )}
                        {restaurant.price_level && <span className="badge-price">{'$'.repeat(restaurant.price_level)}</span>}
                        <span className="badge-cuisine">{restaurant.cuisine || 'Restaurant'}</span>
                    </div>

                    <div className="restaurant-actions">
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
        </div>
    );
};

export default RestaurantPage;
