import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import LogCard from './LogCard';
import FollowButton from './FollowButton';
import CityBadgeCard from './CityBadgeCard';

const UserProfile = ({ userId, onNavigate, onRestaurantClick, onViewFollowers, onViewFollowing, initialTab, triggerUpdate, lastUpdated }) => {
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [logs, setLogs] = useState([]);
    const [visitedRestaurants, setVisitedRestaurants] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [activeTab, setActiveTab] = useState(initialTab || 'logs'); // 'logs', 'visited', 'wishlist', 'badges'
    const [cityStats, setCityStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ followers: 0, following: 0, totalLogs: 0, totalVisited: 0 });

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    useEffect(() => {
        if (userId) {
            fetchAllData();
        }
    }, [userId, lastUpdated]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const profileData = await fetchProfile();
            const [logsData, visitedData, wishlistData, statsData, badgesData] = await Promise.all([
                fetchLogs(),
                fetchVisited(),
                fetchWishlist(profileData),
                fetchStats(),
                fetchCityBadges()
            ]);

            setProfile(profileData);
            setLogs(logsData);
            setVisitedRestaurants(visitedData);
            setWishlist(wishlistData);
            setStats(statsData);
            setCityStats(badgesData);
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCityBadges = async () => {
        // Fetch all visited places (lightweight)
        const { data: visited } = await supabase
            .from('visited_restaurants')
            .select('place_id, restaurant_data')
            .eq('user_id', userId);

        // Fetch all logs locations (lightweight)
        const { data: logs } = await supabase
            .from('logs')
            .select('place_id, location')
            .eq('user_id', userId);

        const cityCounts = {};
        const normalizeCity = (c) => c ? c.split(',')[0].trim().toLowerCase() : '';
        const capitalizeCity = (c) => c.charAt(0).toUpperCase() + c.slice(1);

        const processPlace = (placeId, cityRaw) => {
            if (!cityRaw) return;
            const cityKey = normalizeCity(cityRaw);
            if (!cityKey) return;

            if (!cityCounts[cityKey]) {
                cityCounts[cityKey] = {
                    name: cityRaw.split(',')[0].trim(), // Keep original casing of first part
                    places: new Set()
                };
            }
            cityCounts[cityKey].places.add(placeId);
        };

        visited?.forEach(v => {
            const city = v.restaurant_data?.city || v.restaurant_data?.address; // Fallback logic same as Card
            processPlace(v.place_id, city);
        });

        logs?.forEach(l => {
            processPlace(l.place_id, l.location);
        });

        // Convert to array and sort by count
        return Object.values(cityCounts)
            .map(c => ({ name: c.name, count: c.places.size }))
            .sort((a, b) => b.count - a.count);
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

    const fetchWishlist = async (profileData) => {
        if (profileData?.is_wishlist_private && !isOwnProfile) return [];

        const { data, error } = await supabase
            .from('wishlist')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('fetchWishlist error:', error);
            return [];
        }
        return data;
    };

    const fetchStats = async () => {
        const [followers, following, logs, visited] = await Promise.all([
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
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

                    <div className="profile-stats-premium" style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', justifyContent: 'flex-start', gap: '0.5rem', paddingBottom: '0.5rem' }}>
                        <div className="stat-item-premium" style={{ flex: '0 0 auto', minWidth: '70px' }}>
                            <span className="stat-value-premium" style={{ fontSize: '1.1rem' }}>{stats.totalLogs}</span>
                            <span className="stat-label-premium" style={{ fontSize: '0.75rem' }}>Logs</span>
                        </div>
                        <div className="stat-item-premium" style={{ flex: '0 0 auto', minWidth: '70px' }}>
                            <span className="stat-value-premium" style={{ fontSize: '1.1rem' }}>{stats.totalVisited}</span>
                            <span className="stat-label-premium" style={{ fontSize: '0.75rem' }}>Visited</span>
                        </div>
                        <div
                            className="stat-item-premium"
                            onClick={() => onViewFollowers && onViewFollowers(userId)}
                            style={{ flex: '0 0 auto', minWidth: '70px' }}
                        >
                            <span className="stat-value-premium" style={{ fontSize: '1.1rem' }}>{stats.followers}</span>
                            <span className="stat-label-premium" style={{ fontSize: '0.75rem' }}>Followers</span>
                        </div>
                        <div
                            className="stat-item-premium"
                            onClick={() => onViewFollowing && onViewFollowing(userId)}
                            style={{ flex: '0 0 auto', minWidth: '70px' }}
                        >
                            <span className="stat-value-premium" style={{ fontSize: '1.1rem' }}>{stats.following}</span>
                            <span className="stat-label-premium" style={{ fontSize: '0.75rem' }}>Following</span>
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
                <button
                    className={`tab-button ${activeTab === 'wishlist' ? 'active' : ''}`}
                    onClick={() => setActiveTab('wishlist')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'wishlist' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        padding: '1rem',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'wishlist' ? '2px solid var(--primary-color)' : 'none'
                    }}
                >
                    Wishlist
                </button>
                <button
                    className={`tab-button ${activeTab === 'badges' ? 'active' : ''}`}
                    onClick={() => setActiveTab('badges')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'badges' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        padding: '1rem',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'badges' ? '2px solid var(--primary-color)' : 'none'
                    }}
                >
                    Badges
                </button>
            </div>

            <div className="profile-content">
                {activeTab === 'logs' && (
                    <div className="profile-logs-section">
                        {logs.length > 0 ? (
                            <div className="logs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                {logs.map((log) => (
                                    <LogCard
                                        key={log.id}
                                        log={log}
                                        isDiaryView={true}
                                        profileOwner={isOwnProfile ? (profile || currentUser) : profile}
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
                )}

                {activeTab === 'visited' && (
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

                {activeTab === 'wishlist' && (
                    <div className="wishlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {profile?.is_wishlist_private && !isOwnProfile ? (
                            <p className="no-logs" style={{ gridColumn: '1/-1', textAlign: 'center' }}>
                                🔒 This user's wishlist is private.
                            </p>
                        ) : wishlist.length > 0 ? (
                            wishlist.map((place) => (
                                <div key={place.id} className="wishlist-card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{place.restaurant_name}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{place.location}</p>
                                    <p style={{ color: 'var(--primary-color)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{place.cuisine}</p>
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
                                Wishlist is empty.
                            </p>
                        )}
                    </div>
                )}

                {activeTab === 'badges' && (
                    <div className="badges-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {cityStats.length > 0 ? (
                            cityStats.map((city) => (
                                <div key={city.name}>
                                    <CityBadgeCard
                                        userId={userId}
                                        city={city.name}
                                        count={city.count}
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="no-logs" style={{ gridColumn: '1/-1', textAlign: 'center' }}>
                                No badges earned yet. Start exploring!
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
