import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import LogCard from './LogCard';
import CuisineSelector from './CuisineSelector';
import RestaurantList from './RestaurantList';

const Feed = ({ onViewProfile }) => {
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
            // If it's a simple string, we might not have coords. 
            // Ideally we should store the full object.
            // For now, let's assume simple string and let RestaurantList handle it (it does textSearch).
            setLocation({ name: savedLocation });
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('logs')
                .select('*')
                .neq('user_id', user.id) // Exclude own logs from feed
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

    return (
        <div className="feed-container">
            {/* Discover Section */}
            <div className="discover-section">
                <div className="section-header">
                    <h2>Discover Top Restaurants</h2>
                    {location.name && <span className="location-badge">📍 {location.name}</span>}
                </div>

                <CuisineSelector
                    selectedCuisine={selectedCuisine}
                    onSelectCuisine={setSelectedCuisine}
                />

                {location.name && (
                    <RestaurantList
                        location={location}
                        cuisine={selectedCuisine}
                        onRestaurantClick={(place) => {
                            // Handle click - maybe open restaurant page?
                            // For now, just log or do nothing as per requirement "pop up"
                            console.log("Selected restaurant:", place);
                        }}
                    />
                )}
            </div>

            <div className="feed-header">
                <h2>Recent Activity</h2>
            </div>

            {loading && <p className="loading">Loading logs...</p>}

            <div className="logs-grid">
                {logs.map((log) => (
                    <LogCard
                        key={log.id}
                        log={log}
                        onViewProfile={onViewProfile}
                    />
                ))}
            </div>

            {logs.length === 0 && !loading && (
                <p className="no-logs">No logs yet. Follow people to see their food journey!</p>
            )}
        </div>
    );
};

export default Feed;
