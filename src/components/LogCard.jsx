import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { calculateOverallRating } from '../utils/calculateRating';

const LogCard = ({ log, onClick, showActions = false, isDiaryView = false, profileOwner = null, onEdit, onDelete, onViewProfile, onAddToWishlist, onRestaurantClick, ...props }) => {
    const { user } = useAuth();
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [taggedUsers, setTaggedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // Calculate rating if not present
    const displayRating = log.rating || calculateOverallRating(log);
    const hasRating = displayRating && parseFloat(displayRating) > 0;

    useEffect(() => {
        fetchUserProfile();
        fetchTaggedUsers();
    }, [log.user_id, log.id]);

    // Handle click outside menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

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

    const openLightbox = (e, index) => {
        e.stopPropagation();
        setLightboxIndex(index);
    };

    const closeLightbox = (e) => {
        e.stopPropagation();
        setLightboxIndex(null);
    };

    const nextImage = (e) => {
        e.stopPropagation();
        setLightboxIndex((prev) => (prev + 1) % photos.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    // Determine if this is a "tagged entry" view
    // It is a tagged entry if:
    // 1. We are in a diary/profile view (isDiaryView=true)
    // 2. We have a target profile owner (profileOwner) OR we fallback to current user if not provided (for backward compat)
    // 3. The log author is NOT the profile owner
    const targetProfile = profileOwner || (isDiaryView ? user : null);
    const isTaggedEntry = isDiaryView && targetProfile && targetProfile.id !== log.user_id;

    // Helper to normalize user data from either Auth Object (user_metadata) or Profile Object (top-level fields)
    const normalizeUser = (u) => {
        if (!u) return null;
        // If it has user_metadata (Auth user object), use that
        if (u.user_metadata) {
            return {
                id: u.id,
                full_name: u.user_metadata.full_name || u.email?.split('@')[0] || 'User',
                username: u.user_metadata.username || u.email?.split('@')[0] || 'user',
                avatar_url: u.user_metadata.avatar_url || u.avatar_url
            };
        }
        // Otherwise assume it's a profile object
        return {
            id: u.id,
            full_name: u.full_name || 'User',
            username: u.username || 'user',
            avatar_url: u.avatar_url
        };
    };

    // If it's a tagged entry, we show the PROFILE OWNER'S info at the top (because it's on THEIR timeline)
    // Otherwise, we show the LOG AUTHOR'S info
    const rawDisplayUser = isTaggedEntry ? targetProfile : (profileOwner && profileOwner.id === log.user_id ? profileOwner : userProfile);
    const displayUser = normalizeUser(rawDisplayUser);

    return (
        <>
            <div className="log-card glass-panel premium-card" onClick={onClick}>
                {showActions && (
                    <div className="menu-container" ref={menuRef} onClick={(e) => e.stopPropagation()}>
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
                    <div className="user-info clickable" onClick={(e) => { e.stopPropagation(); onViewProfile && onViewProfile(displayUser?.id || log.user_id); }}>
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
                            Tagged by <span className="tagged-by-name clickable-tag" onClick={(e) => {
                                e.stopPropagation();
                                onViewProfile && onViewProfile(userProfile?.id || log.user_id);
                            }}>{userProfile?.full_name || 'Unknown'}</span>
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
                                <span
                                    key={tag.user_id}
                                    className="tagged-user-name clickable-tag"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onViewProfile && onViewProfile(tag.user_id);
                                    }}
                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    {tag.profiles?.full_name || 'Unknown'}
                                </span>
                            ))}
                        </div>
                    )}

                    {photos && photos.length > 0 && (
                        <div className="log-media-grid">
                            {photos.map((photo, index) => (
                                <div key={index} className="log-media-wrapper" onClick={(e) => openLightbox(e, index)}>
                                    <img src={photo} alt={`Photo ${index + 1}`} className="log-media-image" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxIndex !== null && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <button className="lightbox-close" onClick={closeLightbox}>×</button>

                    {photos.length > 1 && (
                        <>
                            <button className="log-image-nav-btn prev" onClick={prevImage}>‹</button>
                            <button className="log-image-nav-btn next" onClick={nextImage}>›</button>
                        </>
                    )}

                    <img
                        src={photos[lightboxIndex]}
                        alt={`Photo ${lightboxIndex + 1}`}
                        className="lightbox-image"
                        onClick={(e) => e.stopPropagation()}
                    />


                </div>
            )}
        </>
    );
};

export default LogCard;
