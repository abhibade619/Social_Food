import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { calculateOverallRating } from '../utils/calculateRating';

const LogCard = ({ log, onClick, showActions = false, isDiaryView = false, profileOwner = null, onEdit, onDelete, onViewProfile, onAddToWishlist, onRestaurantClick, ...props }) => {
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

    // Determine if this is a "tagged entry" view
    // It is a tagged entry if:
    // 1. We are in a diary/profile view (isDiaryView=true)
    // 2. We have a target profile owner (profileOwner) OR we fallback to current user if not provided (for backward compat)
    // 3. The log author is NOT the profile owner
    const targetProfile = profileOwner || (isDiaryView ? user : null);
    const isTaggedEntry = isDiaryView && targetProfile && targetProfile.id !== log.user_id;

    // If it's a tagged entry, we show the PROFILE OWNER'S info at the top (because it's on THEIR timeline)
    // Otherwise, we show the LOG AUTHOR'S info
    const displayUser = isTaggedEntry ? {
        id: targetProfile.id,
        avatar_url: targetProfile.user_metadata?.avatar_url || targetProfile.avatar_url,
        full_name: targetProfile.user_metadata?.full_name || targetProfile.full_name,
        username: targetProfile.user_metadata?.username || targetProfile.username || targetProfile.email?.split('@')[0]
    } : userProfile;

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
                    <div className="user-info clickable" onClick={(e) => { e.stopPropagation(); onViewProfile && onViewProfile(displayUser.id || log.user_id); }}>
                        <div className="avatar-wrapper">
                            <img
                                src={displayUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUser?.id || log.user_id}`}
                                alt={displayUser?.username || 'User'}
                                className="user-avatar premium-avatar"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUser?.id || log.user_id}`;
                                }}
                            />
                        </div>
                        <div className="log-user-info">
                            <p className="log-user-name">{displayUser?.full_name || 'User'}</p>
                            <p className="log-username">@{displayUser?.username || 'user'}</p>
                        </div>
                    </div>
                    <span className="log-date">{formatDate(log.visit_date || log.created_at)}</span>
                </div>

                <div className="log-content">
                    {isTaggedEntry && (
                        <div className="tagged-by-attribution">
                            <span className="tag-icon">🏷️</span>
                            Tagged by <span className="tagged-by-name">{userProfile?.full_name || 'Unknown'}</span>
                        </div>
                    )}

                    {/* Visit Count Badge - Only show in Diary View if visited more than once */}
                    {isDiaryView && props.visitNumber > 0 && (
                        <div className="visit-badge-container">
                            <span className="visit-badge">
                                {props.visitNumber}{props.visitNumber === 1 ? 'st' : props.visitNumber === 2 ? 'nd' : props.visitNumber === 3 ? 'rd' : 'th'} Visit
                            </span>
                        </div>
                    )}

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
                            <div className="premium-rating-pill">
                                <span className="rating-star">★</span>
                                <span className="rating-value">{Number(displayRating).toFixed(1)}</span>
                            </div>
                        )}
                    </div>

                    {log.content && <p className="log-text">{log.content}</p>}

                    {taggedUsers.length > 0 && (
                        <div className="tagged-users-list">
                            <span className="tag-icon">🏷️ with</span>
                            {taggedUsers.map((tag, index) => (
                                <span key={tag.user_id} className="tagged-user-name">
                                    {tag.profiles?.full_name || 'Unknown'}
                                    {index < taggedUsers.length - 1 ? ', ' : ''}
                                </span>
                            ))}
                        </div>
                    )}

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
