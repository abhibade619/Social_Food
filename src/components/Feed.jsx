import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import LogCard from './LogCard';
import CuisineSelector from './CuisineSelector';
import RestaurantList from './RestaurantList';

const Feed = ({ onViewProfile, onRestaurantClick }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // For Discover Section
    const [location, setLocation] = useState({ name: '', lat: null, lng: null });
    const [selectedCuisine, setSelectedCuisine] = useState('all');

    useEffect(() => {
        fetchLogs();
        loadUserLocation();
    }, []);

    const loadUserLocation = () => {
        // Try to get location from local storage or profile
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            try {
                const parsed = JSON.parse(savedLocation);
                if (typeof parsed === 'object' && parsed !== null) {
                    setLocation(parsed);
                } else {
                    setLocation({ name: savedLocation });
                }
            } catch (e) {
                // Fallback for legacy string values or malformed JSON
                setLocation({ name: savedLocation });
            }
        }
    };

    // Listen for location changes from Navbar
    useEffect(() => {
        const handleLocationUpdate = () => {
            loadUserLocation();
        };
        window.addEventListener('locationChanged', handleLocationUpdate);
        return () => window.removeEventListener('locationChanged', handleLocationUpdate);
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // 1. Get list of users the current user follows
            const { data: followingData, error: followingError } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', user.id);

            if (followingError) throw followingError;

            // Create array of IDs: followed users only (exclude current user)
            const followingIds = followingData.map(f => f.following_id);

            // 2. Fetch logs only from these users
            const { data, error } = await supabase
                .from('logs')
                .select('*')
                .in('user_id', followingIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    // Mock Data for "Popular" and "Top Rated"
    const popularRestaurants = [
        { id: 1, name: "Le Bernardin", cuisine: "French", rating: 4.9, image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80" },
        { id: 2, name: "Sushi Nakazawa", cuisine: "Japanese", rating: 4.8, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80" },
        { id: 3, name: "Carbone", cuisine: "Italian", rating: 4.7, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80" },
        { id: 4, name: "Cote", cuisine: "Korean", rating: 4.8, image: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=800&q=80" },
    ];

    const topRatedRestaurants = [
        { id: 5, name: "Per Se", cuisine: "French", rating: 4.9, image: "https://images.unsplash.com/photo-1514362545857-3bc16549766b?w=800&q=80" },
        { id: 6, name: "Masa", cuisine: "Japanese", rating: 4.9, image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&q=80" },
        { id: 7, name: "Eleven Madison Park", cuisine: "American", rating: 4.8, image: "https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?w=800&q=80" },
    ];

    return (
        <div className="feed-container container">
            {/* Popular Section */}
            <section className="feed-section">
                <div className="section-header-premium">
                    <h2>Popular in {location.name || 'Your City'}</h2>
                    <div className="cuisine-filter-pill">
                        <select
                            value={selectedCuisine}
                            onChange={(e) => setSelectedCuisine(e.target.value)}
                            className="glass-select"
                        >
                            <option value="all">All Cuisines</option>
                            <option value="Italian">Italian</option>
                            <option value="Japanese">Japanese</option>
                            <option value="French">French</option>
                            <option value="Indian">Indian</option>
                        </select>
                    </div>
                </div>
                <div className="horizontal-scroll-container">
                    {popularRestaurants.map(rest => (
                        <div
                            key={rest.id}
                            className="restaurant-card-premium clickable-restaurant"
                            onClick={() => onRestaurantClick(rest)}
                        >
                            <div className="card-image" style={{ backgroundImage: `url(${rest.image})` }}>
                                <span className="rating-badge">⭐ {rest.rating}</span>
                            </div>
                            <div className="card-info">
                                <h3>{rest.name}</h3>
                                <p>{rest.cuisine}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Top Rated Section */}
            <section className="feed-section">
                <div className="section-header-premium">
                    <h2>Top Rated Gems</h2>
                </div>
                <div className="horizontal-scroll-container">
                    {topRatedRestaurants.map(rest => (
                        <div
                            key={rest.id}
                            className="restaurant-card-premium clickable-restaurant"
                            onClick={() => onRestaurantClick(rest)}
                        >
                            <div className="card-image" style={{ backgroundImage: `url(${rest.image})` }}>
                                <span className="rating-badge">⭐ {rest.rating}</span>
                            </div>
                            <div className="card-info">
                                <h3>{rest.name}</h3>
                                <p>{rest.cuisine}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="feed-divider"></div>

            <div className="feed-header">
                <h2>Recent Activity</h2>
            </div>

            {loading && <div className="loading-spinner"></div>}

            <div className="logs-grid">
                {logs.map((log) => (
                    <LogCard
                        key={log.id}
                        log={log}
                        onViewProfile={onViewProfile}
                        onRestaurantClick={onRestaurantClick}
                    />
                ))}
            </div>

            {logs.length === 0 && !loading && (
                <div className="empty-state glass-panel">
                    <p>No recent activity. Be the first to post!</p>
                </div>
            )}
        </div>
    );
};

export default Feed;

