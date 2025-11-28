import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';

const FollowingList = ({ userId, onBack, onNavigate }) => {
    const { user: currentUser } = useAuth();
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFollowing();
    }, [userId]);

    const fetchFollowing = async () => {
        try {
            // Get all following relationships
            const { data: followData, error: followError } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', userId);

            if (followError) throw followError;

            if (followData && followData.length > 0) {
                const followingIds = followData.map(f => f.following_id);

                // Get profile data for all following
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', followingIds);

                if (profilesError) throw profilesError;
                setFollowing(profilesData || []);
            }
        } catch (error) {
            console.error('Error fetching following:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading following...</div>;
    }

    return (
        <div className="following-container">
            {onBack && (
                <button className="back-button" onClick={onBack}>
                    ← Back
                </button>
            )}

            <h2>Following</h2>

            {following.length === 0 ? (
                <div className="empty-state">
                    <p className="empty-icon">👥</p>
                    <p className="empty-title">Not following anyone yet</p>
                    <p className="empty-description">
                        When this user follows others, they'll appear here
                    </p>
                </div>
            ) : (
                <div className="users-list">
                    {following.map(user => (
                        <div
                            key={user.id}
                            className="user-result-card clickable"
                            onClick={() => onNavigate && onNavigate(user.id)}
                        >
                            <img
                                src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                alt={user.username}
                                className="user-result-avatar"
                            />
                            <div className="user-result-info">
                                <p className="user-result-name">{user.full_name || 'No name'}</p>
                                <p className="user-result-username">@{user.username || 'unknown'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FollowingList;
