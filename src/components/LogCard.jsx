import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { calculateOverallRating } from '../utils/calculateRating';

const LogCard = ({ log, onClick, showActions = false, onEdit, onDelete, onViewProfile, onAddToWishlist, onRestaurantClick }) => {
    const { user } = useAuth();
    const [lightboxImage, setLightboxImage] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [taggedUsers, setTaggedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);

    // Calculate rating if not present
    const displayRating = log.rating || calculateOverallRating(log);
    const hasRating = displayRating && parseFloat(displayRating) > 0;

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
        if (!dateString) return '';
        // Append time to force local date interpretation or split string
        // Assuming dateString is YYYY-MM-DD
        const [year, month, day] = dateString.split('T')[0].split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', {
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

    const openLightbox = (e, photo) => {
        e.stopPropagation();
        setLightboxImage(photo);
    };

    const closeLightbox = (e) => {
        e.stopPropagation();
        setLightboxImage(null);
    };

    return (
        <>
            <div className="log-card glass-panel premium-card" onClick={onClick}>
                {showActions && (
                    <div className="menu-container" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="menu-trigger"
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            ⋮
                        </button>
                        {showMenu && (
                            <div className="action-menu">
                                <button onClick={() => { setShowMenu(false); onEdit(log); }} className="menu-item">
                                    ✏️ Edit
                                </button>
                                <button onClick={() => { setShowMenu(false); onDelete(log.id); }} className="menu-item menu-item-danger">
                                    🗑️ Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}

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
                        <h3
                            className="restaurant-name clickable-restaurant"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onRestaurantClick) {
                                    onRestaurantClick({
                                        name: log.restaurant_name,
                                        place_id: log.place_id,
                                        location: log.location,
                                        latitude: log.latitude,
                                        longitude: log.longitude
                                    });
                                }
                            }}
                        >
                            {log.restaurant_name}
                        </h3>
                        {hasRating && (
                            <div className="log-rating-badge">
                                <span className="rating-star">★</span>
                                <span className="rating-value">{Number(displayRating).toFixed(1)}</span>
                            </div>
                        )}
                    </div>

                    {log.content && <p className="log-text">{log.content}</p>}

                    {photos && photos.length > 0 && (
                        <div className={`log-photos-grid photos-${Math.min(photos.length, 4)}`}>
                            {photos.map((photo, index) => (
                                <div key={index} className="log-photo-wrapper" onClick={(e) => openLightbox(e, photo)}>
                                    <img src={photo} alt={`Photo ${index + 1}`} className="log-photo" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxImage && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <button className="lightbox-close" onClick={closeLightbox}>×</button>
                    <img src={lightboxImage} alt="Full size" className="lightbox-image" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </>
    );
};

export default LogCard;
