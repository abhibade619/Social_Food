import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import FollowButton from './FollowButton';

const FollowersList = ({ userId, onBack, onNavigate }) => {
    const { user: currentUser } = useAuth();
    const [followers, setFollowers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);

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

    const filteredFollowers = followers.filter(follower =>
        (follower.full_name && follower.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (follower.username && follower.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return <div className="loading">Loading followers...</div>;
    }

    return (
        <div className="users-list-container-premium">
            <div className="list-header-premium">
                <div className="list-title-row">
                    <h2>Followers</h2>
                    <span className="count-badge">{followers.length}</span>
                </div>
                <button
                    className={`search-btn-premium ${showSearch ? 'active' : ''}`}
                    onClick={() => setShowSearch(!showSearch)}
                    title="Search followers"
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
                        placeholder="Search followers..."
                        className="list-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            )}

            {filteredFollowers.length === 0 ? (
                <div className="empty-state glass-panel">
                    <div className="empty-icon">👥</div>
                    <p className="empty-title">
                        {searchQuery ? 'No matches found' : 'No followers yet'}
                    </p>
                    <p className="empty-description">
                        {searchQuery ? `No followers matching "${searchQuery}"` : "When people follow this user, they'll appear here"}
                    </p>
                </div>
            ) : (
                <div className="users-grid-premium">
                    {filteredFollowers.map(follower => (
                        <div
                            key={follower.id}
                            className="user-card-premium clickable"
                            onClick={() => onNavigate && onNavigate(follower.id)}
                        >
                            <img
                                src={follower.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${follower.username}`}
                                alt={follower.username}
                                className="user-card-avatar"
                            />
                            <div className="user-card-info">
                                <p className="user-card-name">{follower.full_name || 'No name'}</p>
                                <p className="user-card-username">@{follower.username || 'unknown'}</p>
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                                <FollowButton targetUserId={follower.id} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FollowersList;
