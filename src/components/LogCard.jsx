import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const LogCard = ({ log, onClick }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserProfile();
    }, [log.user_id]);

    const fetchUserProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', log.user_id)
                .single();

            if (error) throw error;

            if (data) {
                setUserProfile(data);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            // Fallback to basic info
            setUserProfile({
                username: 'user',
                full_name: 'User',
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.user_id}`
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getRatingColor = (rating) => {
        const num = parseInt(rating);
        if (num >= 4) return 'rating-good';
        if (num >= 3) return 'rating-ok';
        return 'rating-bad';
    };

    if (loading) {
        return (
            <div className="log-card">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="log-card" onClick={onClick}>
            <div className="log-header">
                <img
                    src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.user_id}`}
                    alt={userProfile?.username || 'User'}
                    className="user-avatar"
                />
                <div className="log-user-info">
                    <p className="log-user-name">{userProfile?.full_name || 'User'}</p>
                    <p className="log-username">@{userProfile?.username || 'user'}</p>
                </div>
                <span className="log-date">{formatDate(log.visit_date || log.created_at)}</span>
            </div>

            <div className="log-content">
                <h3 className="restaurant-name">{log.restaurant_name}</h3>
                <div className="log-meta">
                    {log.cuisine && <span className="cuisine-tag">{log.cuisine}</span>}
                    {log.location && <span className="location-tag">📍 {log.location}</span>}
                    {log.visit_type && <span className="visit-type-tag">{log.visit_type}</span>}
                </div>

                {log.content && <p className="log-text">{log.content}</p>}

                <div className="ratings">
                    {log.rating_food && (
                        <span className={`rating-badge ${getRatingColor(log.rating_food)}`}>
                            Food: {log.rating_food}/5
                        </span>
                    )}
                    {log.rating_service && (
                        <span className={`rating-badge ${getRatingColor(log.rating_service)}`}>
                            Service: {log.rating_service}/5
                        </span>
                    )}
                    {log.rating_ambience && (
                        <span className={`rating-badge ${getRatingColor(log.rating_ambience)}`}>
                            Ambience: {log.rating_ambience}/5
                        </span>
                    )}
                    {log.rating_value && (
                        <span className={`rating-badge ${getRatingColor(log.rating_value)}`}>
                            Value: {log.rating_value}/5
                        </span>
                    )}
                    {log.rating_packaging && (
                        <span className={`rating-badge ${getRatingColor(log.rating_packaging)}`}>
                            Packaging: {log.rating_packaging}/5
                        </span>
                    )}
                    {log.rating_store_service && (
                        <span className={`rating-badge ${getRatingColor(log.rating_store_service)}`}>
                            Store Service: {log.rating_store_service}/5
                        </span>
                    )}
                </div>

                {log.return_intent && (
                    <div className="return-intent">
                        <strong>Would return:</strong> {log.return_intent}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogCard;
