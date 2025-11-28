import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

const LogCard = ({ log, onClick, showActions = false, onEdit, onDelete, onViewProfile, onAddToWishlist }) => {
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState(null);
    const [taggedUsers, setTaggedUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserProfile();
        fetchTaggedUsers();
    }, [log.user_id, log.id]);

    const fetchUserProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', log.user_id)
                .single();

            if (error) throw error;
            if (data) setUserProfile(data);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setUserProfile({
                username: 'user',
                full_name: 'User',
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.user_id}`
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchTaggedUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('tagged_users')
                .select(`user_id, profiles:user_id (id, username, full_name)`)
                .eq('log_id', log.id);

            if (error) throw error;
            if (data) setTaggedUsers(data);
        } catch (error) {
            console.error('Error fetching tagged users:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // Parse photos if it's a string
    let photos = [];
    if (log.photos) {
        photos = typeof log.photos === 'string' ? JSON.parse(log.photos) : log.photos;
    }

    if (loading) {
        return <div className="log-card glass-panel"><div className="loading">Loading...</div></div>;
    }

    return (
        <div className="log-card glass-panel premium-card" onClick={onClick}>
            <div className="log-header">
                <div className="user-info clickable" onClick={(e) => { e.stopPropagation(); onViewProfile && onViewProfile(log.user_id); }}>
                    <div className="avatar-wrapper">
                        <img
                            src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.user_id}`}
                            alt={userProfile?.username || 'User'}
                            className="user-avatar"
                        />
                    </div>
                    <div className="log-user-info">
                        <p className="log-user-name">{userProfile?.full_name || 'User'}</p>
                        <p className="log-username">@{userProfile?.username || 'user'}</p>
                    </div>
                </div>
                <span className="log-date">{formatDate(log.visit_date || log.created_at)}</span>
            </div>

            <div className="log-content">
                <div className="log-title-row">
                    <h3 className="restaurant-name">{log.restaurant_name}</h3>
                    <div className="log-rating-badge">
                        <span className="star-icon">★</span>
                        <span className="rating-value">{log.rating}</span>
                    </div>
                </div>

                <div className="log-meta">
                    {log.cuisine && <span className="meta-tag cuisine-tag">{log.cuisine}</span>}
                    {log.location && <span className="meta-tag location-tag">📍 {log.location}</span>}
                </div>

                {log.content && <p className="log-text">{log.content}</p>}

                {photos && photos.length > 0 && (
                    <div className={`log-photos-grid photos-${Math.min(photos.length, 4)}`}>
                        {photos.map((photo, index) => (
                            <div key={index} className="log-photo-wrapper">
                                <img src={photo} alt={`Photo ${index + 1}`} className="log-photo" />
                            </div>
                        ))}
                    </div>
                )}

                <div className="log-actions">
                    {showActions && (
                        <div className="owner-actions">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(log); }} className="action-btn icon-btn" title="Edit">✏️</button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(log.id); }} className="action-btn icon-btn delete" title="Delete">🗑️</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogCard;
