import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

const LogCard = ({ log, onClick, showActions = false, onEdit, onDelete, onViewProfile, onAddToWishlist }) => {
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState(null);
    const [taggedUsers, setTaggedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [likes, setLikes] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);

    useEffect(() => {
        fetchUserProfile();
        fetchTaggedUsers();
        fetchLikes();
        checkIfLiked();
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

    const fetchLikes = async () => {
        const { count } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('log_id', log.id);
        setLikes(count || 0);
    };

    const checkIfLiked = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('likes')
            .select('id')
            .eq('log_id', log.id)
            .eq('user_id', user.id)
            .single();
        setHasLiked(!!data);
    };

    const handleLike = async (e) => {
        e.stopPropagation();
        if (!user) return;
        if (hasLiked) {
            await supabase.from('likes').delete().eq('log_id', log.id).eq('user_id', user.id);
            setLikes(likes - 1);
            setHasLiked(false);
        } else {
            await supabase.from('likes').insert({ log_id: log.id, user_id: user.id });
            setLikes(likes + 1);
            setHasLiked(true);
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
        return <div className="log-card"><div className="loading">Loading...</div></div>;
    }

    return (
        <div className="log-card" onClick={onClick}>
            <div className="log-header">
                <div className="user-info" onClick={(e) => { e.stopPropagation(); onViewProfile && onViewProfile(log.user_id); }}>
                    <img
                        src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.user_id}`}
                        alt={userProfile?.username || 'User'}
                        className="avatar-placeholder"
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div className="log-user-info" style={{ marginLeft: '10px' }}>
                        <p className="log-user-name" style={{ fontWeight: 'bold', margin: 0 }}>{userProfile?.full_name || 'User'}</p>
                        <p className="log-username" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>@{userProfile?.username || 'user'}</p>
                    </div>
                </div>
                <span className="log-date" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(log.visit_date || log.created_at)}</span>
            </div>

            <div className="log-content" style={{ marginTop: '15px' }}>
                <div className="log-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="restaurant-name" style={{ color: 'var(--primary-color)' }}>{log.restaurant_name}</h3>
                    <div className="log-rating" style={{ color: '#f1c40f' }}>
                        {'⭐'.repeat(log.rating)}
                    </div>
                </div>

                <div className="log-meta" style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '5px 0' }}>
                    {log.cuisine && <span className="cuisine-tag">{log.cuisine}</span>}
                    {log.location && <span className="location-tag">📍 {log.location}</span>}
                </div>

                {log.content && <p className="log-text" style={{ margin: '10px 0' }}>{log.content}</p>}

                {photos && photos.length > 0 && (
                    <div className="log-photos" style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px 0' }}>
                        {photos.map((photo, index) => (
                            <img key={index} src={photo} alt={`Photo ${index + 1}`} style={{ height: '200px', borderRadius: '8px' }} />
                        ))}
                    </div>
                )}

                <div className="log-actions" style={{ marginTop: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <button
                        onClick={handleLike}
                        style={{ background: 'none', color: hasLiked ? 'var(--accent-color)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        {hasLiked ? '❤️' : '🤍'} {likes}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogCard;
