import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import LogCard from './LogCard';
import FollowButton from './FollowButton';

const UserProfile = ({ userId, onNavigate, onRestaurantClick, onViewFollowers, onViewFollowing }) => {
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ followers: 0, following: 0, totalLogs: 0 });
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
            const [profileData, logsData, statsData] = await Promise.all([
                fetchProfile(),
                fetchLogs(),
                fetchStats()
            ]);

            setProfile(profileData);
            setLogs(logsData);
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
    };

    const fetchStats = async () => {
        const [followers, following, logs] = await Promise.all([
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
            supabase.from('logs').select('*', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        return {
            followers: followers.count || 0,
            following: following.count || 0,
            totalLogs: logs.count || 0,
        };
    };

    const isOwnProfile = currentUser?.id === userId;

    if (loading) {
        return <div className="loading">Loading profile...</div>;
    }

    if (error) {
        return <div className="error-state">Error: {error}</div>;
    }

    return (
        <div className="profile-container-premium">
            <div className="profile-header-premium">
                <div className="profile-header-content">
                    <div className="profile-avatar-premium">
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

            <div className="profile-logs">
                <h3 className="profile-section-title">Logs</h3>
                {logs.length > 0 ? (
                    <div className="logs-grid">
                        {logs.map((log) => (
                            <LogCard
                                key={log.id}
                                log={log}
                                isDiaryView={true}
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
        </div>
    );
};

export default UserProfile;
