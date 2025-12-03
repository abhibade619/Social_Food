import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';

const FollowButton = ({ targetUserId, targetUsername }) => {
    const { user } = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);

    useEffect(() => {
        if (user && targetUserId) {
            checkFollowStatus();
            getFollowersCount();
        }
    }, [user, targetUserId]);

    if (!targetUserId) return null;

    const checkFollowStatus = async () => {
        try {
            const { data, error } = await supabase
                .from('follows')
                .select('id')
                .eq('follower_id', user.id)
                .eq('following_id', targetUserId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setIsFollowing(!!data);
        } catch (error) {
            console.error('Error checking follow status:', error);
        }
    };

    const getFollowersCount = async () => {
        try {
            const { count, error } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', targetUserId);

            if (error) throw error;
            setFollowersCount(count || 0);
        } catch (error) {
            console.error('Error getting followers count:', error);
        }
    };

    const handleFollow = async () => {
        if (!user) return;

        setLoading(true);
        try {
            if (isFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', targetUserId);

                if (error) throw error;
                setIsFollowing(false);
                setFollowersCount(prev => prev - 1);
            } else {
                // Follow
                const { error } = await supabase
                    .from('follows')
                    .insert([{
                        follower_id: user.id,
                        following_id: targetUserId
                    }]);

                if (error) throw error;
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);

                // Create notification
                await supabase
                    .from('notifications')
                    .insert([{
                        user_id: targetUserId,
                        type: 'follow',
                        from_user_id: user.id
                    }]);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        } finally {
            setLoading(false);
        }
    };

    // Don't show button for own profile
    if (user?.id === targetUserId) {
        return null;
    }

    return (
        <button
            onClick={handleFollow}
            disabled={loading}
            className={`follow-btn ${isFollowing ? 'following' : 'not-following'}`}
        >
            {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
        </button>
    );
};

export default FollowButton;
