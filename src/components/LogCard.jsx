import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

const LogCard = ({ log, onClick, showActions = false, onEdit, onDelete, onViewProfile, onAddToWishlist }) => {
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState(null);
    const [taggedUsers, setTaggedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);

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

    const fetchTaggedUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('tagged_users')
                .select(`
          user_id,
          profiles:user_id (
            id,
            username,
            full_name
          )
        `)
                .eq('log_id', log.id);

            if (error) throw error;
            if (data) {
                setTaggedUsers(data);
            }
        } catch (error) {
            console.error('Error fetching tagged users:', error);
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

    // Calculate overall rating out of 10
    const calculateOverallRating = () => {
        const ratings = [];

        // Food rating (most important - weight 3x)
        if (log.rating_food) ratings.push(parseInt(log.rating_food), parseInt(log.rating_food), parseInt(log.rating_food));

        // Service/Ambience/Value for dine-in OR Packaging/Store Service for takeout
        if (log.rating_service) ratings.push(parseInt(log.rating_service));
        if (log.rating_ambience) ratings.push(parseInt(log.rating_ambience));
        if (log.rating_value) ratings.push(parseInt(log.rating_value));
        if (log.rating_packaging) ratings.push(parseInt(log.rating_packaging));
        if (log.rating_store_service) ratings.push(parseInt(log.rating_store_service));

        // Return intent (convert to rating)
        if (log.return_intent) {
            if (log.return_intent === 'Definitely') ratings.push(5, 5);
            else if (log.return_intent === 'Probably') ratings.push(4);
            else if (log.return_intent === 'Maybe') ratings.push(3);
            else if (log.return_intent === 'Probably Not') ratings.push(2);
            else if (log.return_intent === 'Definitely Not') ratings.push(1);
        }

        if (ratings.length === 0) return null;

        const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        return ((average / 5) * 10).toFixed(1);
    };

    const overallRating = calculateOverallRating();

    if (loading) {
        return (
            <div className="log-card">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    // Parse photos if it's a string
    {
        showActions && user?.id === log.user_id && (
            <div className="log-actions">
                <button
                    className="action-btn edit-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit && onEdit(log);
                    }}
                    title="Edit log"
                >
                    ✏️
                </button>
                <button
                    className="action-btn delete-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete && onDelete(log.id);
                    }}
                    title="Delete log"
                >
                    🗑️
                </button>
            </div>
        )
    }
                </div >
            </div >

    <div className="log-content">
        <div className="log-title-row">
            <h3 className="restaurant-name">{log.restaurant_name}</h3>
            {overallRating && (
                <div className="overall-rating">
                    <span className="rating-number">{overallRating}</span>
                    <span className="rating-max">/10</span>
                </div>
            )}
        </div>
        <div className="log-meta">
            {log.cuisine && <span className="cuisine-tag">{log.cuisine}</span>}
            {log.location && <span className="location-tag">📍 {log.location}</span>}
            {log.visit_type && <span className="visit-type-tag">{log.visit_type}</span>}
        </div>

        {log.content && <p className="log-text">{log.content}</p>}

        {/* Display Photos */}
        {photos && photos.length > 0 && (
            <div className="log-photos">
                {photos.map((photo, index) => (
                    <div key={index} className="log-photo">
                        <img src={photo} alt={`Photo ${index + 1}`} />
                    </div>
                ))}
            </div>
        )}

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

        {/* Display Tagged Users */}
        {taggedUsers && taggedUsers.length > 0 && (
            <div className="tagged-users">
                <span className="tagged-users-label">With:</span>
                {taggedUsers.map((tag, index) => (
                    <span key={tag.user_id}>
                        <Link
                            to={`/profile/${tag.user_id}`}
                            className="tagged-user-link"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {tag.profiles?.full_name || tag.profiles?.username || 'User'}
                        </Link>
                        {index < taggedUsers.length - 1 && ', '}
                    </span>
                ))}
            </div>
        )}
    </div>
        </div >
    );
};

export default LogCard;
