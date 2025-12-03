import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import { Link } from 'react-router-dom';

const SuggestedFriends = ({ onViewProfile }) => {
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
            // 1. Get list of people current user is already following
            const { data: followingData, error: followingError } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', user.id);

            if (followingError) throw followingError;

            const following = new Set(followingData.map(f => f.following_id));
            setFollowingIds(following);

            // 2. Fetch all profiles (limit to 20 for now to pick from)
            // In a real app, you'd use a more sophisticated query or RPC
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .neq('id', user.id) // Exclude self
                .limit(20);

            if (profilesError) throw profilesError;

            // 3. Filter out already followed users
            const notFollowed = profiles.filter(p => !following.has(p.id));

            // 4. Randomly pick 5
            const shuffled = notFollowed.sort(() => 0.5 - Math.random());
            setSuggestions(shuffled.slice(0, 5));

        } catch (error) {
            console.error('Error fetching suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (targetId) => {
        try {
            const { error } = await supabase
                .from('follows')
                .insert({
                    follower_id: user.id,
                    following_id: targetId
                });

            if (error) throw error;

            // Update local state to remove the user from suggestions
            setSuggestions(prev => prev.filter(p => p.id !== targetId));
            setFollowingIds(prev => new Set(prev).add(targetId));

            // Dispatch event to update other components if needed
            window.dispatchEvent(new Event('newFollow'));

        } catch (error) {
            console.error('Error following user:', error);
            alert('Failed to follow user');
        }
    };

    if (loading) return <div className="suggested-friends-loading">Loading suggestions...</div>;
    if (suggestions.length === 0) return null;

    return (
        <div className="suggested-friends-container glass-panel">
            <h3 className="suggested-title">People You May Know</h3>
            <div className="suggested-list">
                {suggestions.map(profile => (
                    <div key={profile.id} className="suggested-user-card">
                        <div
                            className="suggested-user-info clickable"
                            onClick={() => onViewProfile && onViewProfile(profile.id)}
                        >
                            <img
                                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`}
                                alt={profile.username}
                                className="suggested-avatar"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`;
                                }}
                            />
                            <div className="suggested-text">
                                <span className="suggested-name">{profile.full_name || profile.username}</span>
                                <span className="suggested-username">@{profile.username}</span>
                            </div>
                        </div>
                        <button
                            className="btn-follow-small"
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
