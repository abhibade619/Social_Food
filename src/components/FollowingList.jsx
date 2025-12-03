import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';

const FollowingList = ({ userId, onBack, onNavigate }) => {
    const { user: currentUser } = useAuth();
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);

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

    const filteredFollowing = following.filter(user =>
        (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleUnfollow = async (targetId, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to unfollow this user?')) return;

        try {
            const { error } = await supabase
                .from('follows')
                .delete()
                .eq('follower_id', currentUser.id)
                .eq('following_id', targetId);

            if (error) throw error;

            setFollowing(following.filter(user => user.id !== targetId));
        } catch (error) {
            console.error('Error unfollowing:', error);
            alert('Failed to unfollow user');
        }
    };

    if (loading) {
        return <div className="loading">Loading following...</div>;
    }

    return (
        <div className="users-list-container-premium">
            <div className="list-header-premium">
                <div className="list-title-row">
                    <h2>Following</h2>
                    <span className="count-badge">{following.length}</span>
                </div>
                <button
                    className={`search-btn-premium ${showSearch ? 'active' : ''}`}
                    onClick={() => setShowSearch(!showSearch)}
                    title="Search following"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </button>
            </div>

            {showSearch && (
                <div className="list-search-container slide-down">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search following..."
                        className="list-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            )}

            {filteredFollowing.length === 0 ? (
                <div className="empty-state glass-panel">
                    <div className="empty-icon">👥</div>
                    <p className="empty-title">
                        {searchQuery ? 'No matches found' : 'Not following anyone yet'}
                    </p>
                    <p className="empty-description">
                        {searchQuery ? `No users matching "${searchQuery}"` : "When this user follows others, they'll appear here"}
                    </p>
                </div>
            ) : (
                <div className="users-grid-premium">
                    {filteredFollowing.map(user => (
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
                            {currentUser && currentUser.id === userId && (
                                <button
                                    className="btn-unfollow-premium"
                                    onClick={(e) => handleUnfollow(user.id, e)}
                                >
                                    Unfollow
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FollowingList;
