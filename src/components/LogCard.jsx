import { useState, useEffect, useRef } from 'react';
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

    const [lightboxIndex, setLightboxIndex] = useState(null);

    // ... (existing code)

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

    // ... (existing code)

    {
        photos && photos.length > 0 && (
            <div className="log-media-grid">
                {photos.map((photo, index) => (
                    <div key={index} className="log-media-wrapper" onClick={(e) => openLightbox(e, index)}>
                        <img src={photo} alt={`Photo ${index + 1}`} className="log-media-image" />
                    </div>
                ))}
            </div>
        )
    }
                </div >
            </div >

    {/* Lightbox Modal */ }
{
    lightboxIndex !== null && (
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

            {photos.length > 1 && (
                <div className="lightbox-counter">
                    {lightboxIndex + 1} / {photos.length}
                </div>
            )}
        </div>
    )
}
        </>
    );
};

export default LogCard;
