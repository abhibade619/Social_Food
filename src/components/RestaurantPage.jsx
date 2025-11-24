import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import LogCard from './LogCard';

const RestaurantPage = ({ restaurant, onBack }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRestaurantLogs();
    }, [restaurant]);

    const fetchRestaurantLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('logs')
                .select('*')
                .eq('restaurant_name', restaurant.name)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching restaurant logs:', error);
        } finally {
            setLoading(false);
        }
    };

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
            <button className="back-button" onClick={onBack}>
                ← Back to Search
            </button>

            <div className="restaurant-header">
                <h1>{restaurant.name}</h1>
                <div className="restaurant-meta">
                    <span className="cuisine-tag">{restaurant.cuisine}</span>
                    <span className="location-tag">📍 {restaurant.location}</span>
                </div>
                {avgRating && (
                    <div className="average-rating">
                        Average Rating: <strong>{avgRating}/5</strong> ({logs.length} reviews)
                    </div>
                )}
            </div>

            <div className="restaurant-logs">
                <h2>Reviews</h2>
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
        </div>
    );
};

export default RestaurantPage;
