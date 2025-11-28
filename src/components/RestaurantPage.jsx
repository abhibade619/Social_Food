import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import MapComponent from './MapComponent';
import LogCard from './LogCard';

const RestaurantPage = ({ restaurant, onBack }) => {
    const [logs, setLogs] = useState([]); // Keep this for future review tab implementation
    const [loading, setLoading] = useState(true); // Keep this for future review tab implementation
    const [activeTab, setActiveTab] = useState('overview');

    // Parse coordinates if they exist
    const getCoordinates = () => {
        if (restaurant.latitude && restaurant.longitude) {
            return { lat: parseFloat(restaurant.latitude), lng: parseFloat(restaurant.longitude) };
        }
        // Default to a central location if no coords (e.g. New York) or handle gracefully
        // For now, let's return null and handle it in the UI
        return null;
    };

    const coordinates = getCoordinates();

    // Keep fetchRestaurantLogs and useEffect for future review tab implementation
    useEffect(() => {
        fetchRestaurantLogs();
    }, [restaurant]);

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

    // calculateAverageRating and avgRating are no longer used in the current JSX structure
    // but can be kept if the reviews tab will display average rating.
    const calculateAverageRating = () => {
        if (logs.length === 0) return null;

        const ratings = logs
            .map((log) => parseInt(log.rating_food))
            .filter((rating) => !isNaN(rating));

        if (ratings.length === 0) return null;

        const avg = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        return avg.toFixed(1);
    };

    const avgRating = calculateAverageRating();

    return (
        <div className="restaurant-page">
            <div className="restaurant-header">
                <button onClick={onBack} className="back-button">← Back</button>
                <div className="restaurant-title-section">
                    <h1>{restaurant.name}</h1>
                    <div className="restaurant-meta">
                        <span className="rating">⭐ {restaurant.rating || 'N/A'}</span>
                        <span className="price">{restaurant.price_level ? '$'.repeat(restaurant.price_level) : '$$'}</span>
                        <span className="cuisine">{restaurant.cuisine || 'Restaurant'}</span>
                    </div>
                </div>
            </div>

            <div className="restaurant-content">
                <div className="restaurant-tabs">
                    <button
                        className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reviews')}
                    >
                        Reviews
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'photos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('photos')}
                    >
                        Photos
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <div className="overview-section">
                            <div className="info-card">
                                <h3>Location & Contact</h3>
                                <p>📍 {restaurant.location || restaurant.address || 'Address not available'}</p>
                                {restaurant.phone && <p>📞 {restaurant.phone}</p>}
                                {restaurant.website && (
                                    <p>🌐 <a href={restaurant.website} target="_blank" rel="noopener noreferrer">Website</a></p>
                                )}

                                {coordinates && (
                                    <div className="map-container" style={{ marginTop: '20px', height: '300px' }}>
                                        <MapComponent
                                            center={coordinates}
                                            markers={[{ position: coordinates, title: restaurant.name }]}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="info-card">
                                <h3>About</h3>
                                <p>{restaurant.description || 'No description available.'}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="reviews-section">
                            {loading && <p className="loading">Loading reviews...</p>}
                            {!loading && logs.length > 0 && (
                                <div className="logs-grid">
                                    {logs.map((log) => (
                                        <LogCard key={log.id} log={log} />
                                    ))}
                                </div>
                            )}
                            {!loading && logs.length === 0 && (
                                <p className="no-logs">No reviews yet. Be the first to review!</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'photos' && (
                        <div className="photos-section">
                            <p>Photos coming soon...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RestaurantPage;
