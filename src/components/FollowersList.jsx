import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';

const FollowersList = ({ userId, onBack }) => {
    const { user: currentUser } = useAuth();
    const [followers, setFollowers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFollowers();
    }, [userId]);

    const fetchFollowers = async () => {
        try {
            // Get all follower relationships
            const { data: followData, error: followError } = await supabase
                .from('follows')
                .select('follower_id')
                .eq('following_id', userId);

            if (followError) throw followError;

            if (followData && followData.length > 0) {
                const followerIds = followData.map(f => f.follower_id);

                // Get profile data for all followers
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', followerIds);

                if (profilesError) throw profilesError;
                setFollowers(profilesData || []);
            }
        } catch (error) {
            console.error('Error fetching followers:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading followers...</div>;
    }

    return (
        <div className="followers-container">
            {onBack && (
                <button className="back-button" onClick={onBack}>
                    ← Back
                </button>
            )}

            <h2>Followers</h2>

            {followers.length === 0 ? (
                <div className="empty-state">
                    <p className="empty-icon">👥</p>
                    <p className="empty-title">No followers yet</p>
                    <p className="empty-description">
                        When people follow this user, they'll appear here
                    </p>
                </div>
            ) : (
                <div className="users-list">
                    {followers.map(follower => (
                        <div key={follower.id} className="user-result-card">
                            <img
                                src={follower.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${follower.username}`}
                                alt={follower.username}
                                className="user-result-avatar"
                            />
                            <div className="user-result-info">
                                <p className="user-result-name">{follower.full_name || 'No name'}</p>
                                <p className="user-result-username">@{follower.username || 'unknown'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FollowersList;
