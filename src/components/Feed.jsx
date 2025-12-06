import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import LogCard from './LogCard';
import SuggestedFriends from './SuggestedFriends';

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

    // Extract city from location object or string
    const getCityFromLocation = () => {
        if (!location) return 'New York'; // Default
        if (typeof location === 'string') return location.split(',')[0];
        if (location.name) return location.name.split(',')[0];
        return 'New York';
    };

    const currentCity = getCityFromLocation();

    return (
        <div className="home-layout container">
            <div className="main-feed">
                <div className="feed-container">

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
            </div>
            <aside className="home-sidebar">
                <SuggestedFriends onViewProfile={onViewProfile} />
            </aside>
        </div>
    );
};

export default Feed;

