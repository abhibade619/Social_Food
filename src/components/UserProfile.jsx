import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import LogCard from './LogCard';
import FollowButton from './FollowButton';

const UserProfile = ({ userId, onNavigate, onRestaurantClick, onViewFollowers, onViewFollowing }) => {
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [logs, setLogs] = useState([]);
    const [visitedRestaurants, setVisitedRestaurants] = useState([]);
    const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'visited'
    const [stats, setStats] = useState({ followers: 0, following: 0, totalLogs: 0, totalVisited: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (userId) {
            fetchAllData();
        }
    }, [userId]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [profileData, logsData, visitedData, statsData] = await Promise.all([
                fetchProfile(),
                fetchLogs(),
                fetchVisited(),
                fetchStats()
            ]);

            setProfile(profileData);
            setLogs(logsData);
            setVisitedRestaurants(visitedData);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) {
            console.error('fetchProfile error:', error);
            throw error;
        }
        return data;
    };

    const fetchLogs = async () => {
        // Fetch user's own logs
        const { data: ownLogs, error: ownError } = await supabase
            .from('logs')
            .select('*')
            .eq('user_id', userId)
            .order('visit_date', { ascending: false })
            .limit(20);

        if (ownError) {
            console.error('fetchLogs error:', ownError);
            throw ownError;
        }

        // Fetch logs where user is tagged AND accepted
        const { data: taggedData, error: taggedError } = await supabase
            .from('tagged_users')
            .select('log_id')
            .eq('user_id', userId)
            .eq('show_in_diary', true);

        if (taggedError) {
            console.error('fetchTaggedLogs error:', taggedError);
            // Don't throw, just log
        }

        let taggedLogs = [];
        if (taggedData && taggedData.length > 0) {
            const taggedLogIds = taggedData.map(t => t.log_id);
            const { data: taggedLogsData } = await supabase
                .from('logs')
                .select('*')
                .in('id', taggedLogIds)
                .order('visit_date', { ascending: false });

            if (taggedLogsData) taggedLogs = taggedLogsData;
        }

        const allLogs = [...(ownLogs || []), ...taggedLogs];
        const uniqueLogs = Array.from(new Map(allLogs.map(log => [log.id, log])).values());
        uniqueLogs.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

        return uniqueLogs;
        return uniqueLogs;
    };

    const fetchVisited = async () => {
        const { data, error } = await supabase
            .from('visited_restaurants')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('fetchVisited error:', error);
            return [];
        }
        return data;
    };

    const fetchStats = async () => {
        const [followers, following, logs] = await Promise.all([
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
            supabase.from('logs').select('*', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('visited_restaurants').select('*', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        return {
            followers: followers.count || 0,
            following: following.count || 0,
            totalLogs: logs.count || 0,
            totalVisited: visited.count || 0
        };
    };

    const isOwnProfile = currentUser?.id === userId;

    const [showAvatarView, setShowAvatarView] = useState(false);

    if (loading) {
        return <div className="loading">Loading profile...</div>;
    }

    if (error) {
        return <div className="error-state">Error: {error}</div>;
    }

    return (
        <div className="profile-container-premium">
            {/* Avatar View Modal */}
            {showAvatarView && profile?.avatar_url && (
                <div className="avatar-view-modal" onClick={() => setShowAvatarView(false)}>
                    <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="avatar-view-image"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <div className="profile-header-premium">
                <div className="profile-header-content">
                    <div
                        className="profile-avatar-premium"
                        onClick={() => profile?.avatar_url && setShowAvatarView(true)}
                        style={{ cursor: profile?.avatar_url ? 'pointer' : 'default' }}
                    >
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" />
                        ) : (
                            <div className="avatar-placeholder-premium">
                                {(profile?.username || 'U')?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>

                    <h2 className="profile-name-premium">{profile?.full_name || 'No name set'}</h2>
                    <p className="profile-username-premium">@{profile?.username || 'unknown'}</p>

                    {profile?.bio && (
                        <p className="profile-bio-premium">{profile.bio}</p>
                    )}

                    <div className="profile-stats-premium">
                        <div className="stat-item-premium">
                            <span className="stat-value-premium">{stats.totalLogs}</span>
                            <span className="stat-label-premium">Logs</span>
                        </div>
                        <div className="stat-item-premium">
                            <span className="stat-value-premium">{stats.totalVisited}</span>
                            <span className="stat-label-premium">Visited</span>
                        </div>
                        <div
                            className="stat-item-premium"
                            onClick={() => onViewFollowers && onViewFollowers(userId)}
                        >
                            <span className="stat-value-premium">{stats.followers}</span>
                            <span className="stat-label-premium">Followers</span>
                        </div>
                        <div
                            className="stat-item-premium"
                            onClick={() => onViewFollowing && onViewFollowing(userId)}
                        >
                            <span className="stat-value-premium">{stats.following}</span>
                            <span className="stat-label-premium">Following</span>
                        </div>
                    </div>

                    {!isOwnProfile && (
                        <div style={{ marginTop: '1rem' }}>
                            <FollowButton targetUserId={userId} targetUsername={profile?.username} />
                        </div>
                    )}
                </div>
            </div>

            <div className="profile-tabs" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                    className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('logs')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'logs' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        padding: '1rem',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'logs' ? '2px solid var(--primary-color)' : 'none'
                    }}
                >
                    Logs
                </button>
                <button
                    className={`tab-button ${activeTab === 'visited' ? 'active' : ''}`}
                    onClick={() => setActiveTab('visited')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'visited' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        padding: '1rem',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'visited' ? '2px solid var(--primary-color)' : 'none'
                    }}
                >
                    Visited
                </button>
            </div>

            <div className="profile-content">
                {activeTab === 'logs' ? (
                    <div className="profile-logs-section">
                        {logs.length > 0 ? (
                            <div className="logs-grid">
                                {logs.map((log) => (
                                    <LogCard
                                        key={log.id}
                                        log={log}
                                        isDiaryView={true}
                                        profileOwner={profile}
                                        onViewProfile={onNavigate}
                                        onRestaurantClick={onRestaurantClick}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="no-logs">
                                {isOwnProfile
                                    ? 'No logs yet. Start sharing your dining experiences!'
                                    : `${profile?.full_name} hasn't posted any logs yet.`}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="visited-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {visitedRestaurants.length > 0 ? (
                            visitedRestaurants.map((place) => (
                                <div key={place.id} className="visited-card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{place.restaurant_name}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{place.location}</p>
                                    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                        <button
                                            className="btn-secondary btn-sm"
                                            onClick={() => onRestaurantClick && onRestaurantClick({
                                                place_id: place.place_id,
                                                name: place.restaurant_name,
                                                address: place.location
                                            })}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-logs" style={{ gridColumn: '1/-1', textAlign: 'center' }}>
                                No visited restaurants marked yet.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
