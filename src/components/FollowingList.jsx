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
        <div className="users-list-container-premium">
            <div className="list-header-premium">
                <h2>Following</h2>
                <span className="count-badge">{following.length}</span>
            </div>

            {following.length === 0 ? (
                <div className="empty-state glass-panel">
                    <div className="empty-icon">👥</div>
                    <p className="empty-title">Not following anyone yet</p>
                    <p className="empty-description">
                        When this user follows others, they'll appear here
                    </p>
                </div>
            ) : (
                <div className="users-grid-premium">
                    {following.map(user => (
                        <div
                            key={user.id}
                            className="user-card-premium clickable"
                            onClick={() => onNavigate && onNavigate(user.id)}
                        >
                            <img
                                src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                alt={user.username}
                                className="user-card-avatar"
                            />
                            <div className="user-card-info">
                                <p className="user-card-name">{user.full_name || 'No name'}</p>
                                <p className="user-card-username">@{user.username || 'unknown'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FollowingList;
