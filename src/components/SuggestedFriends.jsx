import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import { Link } from 'react-router-dom';

const SuggestedFriends = () => {
    const { user } = useAuth();
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followingIds, setFollowingIds] = useState(new Set());

    useEffect(() => {
        if (user) {
            fetchSuggestions();
        }
    }, [user]);

    const fetchSuggestions = async () => {
        try {
            setLoading(true);

            // 1. Get IDs of users already followed
            const { data: followingData, error: followingError } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', user.id);

            if (followingError) throw followingError;

            const following = new Set(followingData.map(f => f.following_id));
            setFollowingIds(following);

            // 2. Fetch profiles (excluding current user)
            // In a real app, we'd use a more sophisticated query (e.g., location-based, mutuals)
            // For now, we'll fetch a batch and filter client-side or use a random limit
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .neq('id', user.id)
                .limit(20); // Fetch a pool of potential suggestions

            if (profilesError) throw profilesError;

            // 3. Filter out already followed users and pick random 3-5
            const available = profiles.filter(p => !following.has(p.id));
            const shuffled = available.sort(() => 0.5 - Math.random());
            setSuggestions(shuffled.slice(0, 5));

        } catch (error) {
            console.error('Error fetching suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (targetUserId) => {
        try {
            const { error } = await supabase
                .from('follows')
                .insert([{ follower_id: user.id, following_id: targetUserId }]);

            if (error) throw error;

            // Update local state
            setFollowingIds(prev => new Set(prev).add(targetUserId));
            setSuggestions(prev => prev.filter(p => p.id !== targetUserId));

            // Optional: Create notification for the followed user
            await supabase
                .from('notifications')
                .insert([{
                    user_id: targetUserId,
                    type: 'follow',
                    content: 'started following you',
                    from_user_id: user.id,
                    is_read: false
                }]);

        } catch (error) {
            console.error('Error following user:', error);
        }
    };

    if (loading || suggestions.length === 0) return null;

    return (
        <div className="suggested-friends-container glass-panel">
            <h3 className="suggested-title">People You May Know</h3>
            <div className="suggested-list">
                {suggestions.map(profile => (
                    <div key={profile.id} className="suggested-item">
                        <Link to={`/profile/${profile.id}`} className="suggested-avatar-link">
                            <img
                                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`}
                                alt={profile.username}
                                className="suggested-avatar"
                            />
                        </Link>
                        <div className="suggested-info">
                            <Link to={`/profile/${profile.id}`} className="suggested-name">
                                {profile.full_name || profile.username}
                            </Link>
                            <span className="suggested-username">@{profile.username}</span>
                        </div>
                        <button
                            className="follow-btn-small"
                            onClick={() => handleFollow(profile.id)}
                        >
                            Follow
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SuggestedFriends;
