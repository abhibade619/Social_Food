import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import LogCard from './LogCard';
import FollowButton from './FollowButton';

const UserProfile = ({ userId, onBack, onNavigate }) => {
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
        const { data, error } = await supabase
            .from('logs')
            .select('*')
            .eq('user_id', userId)
            .order('visit_date', { ascending: false })
            .limit(20);
        if (error) {
            console.error('fetchLogs error:', error);
            throw error;
        }
        return data || [];
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
        return <div className="loading-state">Loading profile...</div>;
    }

    if (error) {
        return <div className="error-state">Error: {error}</div>;
    }

    return (
        <div className="user-profile-container">
            {/* Back Button */}
            {onBack && (
                <button className="back-button" onClick={onBack}>
                    ← Back
                </button>
            )}

            {/* Profile Header */}
            <div className="profile-header">
                <div className="profile-cover">
                    {profile?.cover_photo_url && (
                        <img src={profile.cover_photo_url} alt="Cover" className="cover-photo" />
                    )}
                </div>

                <div className="profile-info-section">
                    <div className="profile-avatar-container">
                        <img
                            src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`}
                            alt={profile?.username}
                            className="profile-avatar-large"
                        />
                    </div>

                    <div className="profile-details">
                        <div className="profile-name-section">
                            <h1 className="profile-full-name">{profile?.full_name || 'No name'}</h1>
                            <p className="profile-username">@{profile?.username || 'unknown'}</p>
                        </div>

                        {!isOwnProfile && (
                            <FollowButton targetUserId={userId} targetUsername={profile?.username} />
                        )}
                    </div>

                    {profile?.bio && (
                        <p className="profile-bio">{profile.bio}</p>
                    )}

                    {/* Stats */}
                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-value">{stats.totalLogs}</span>
                            <span className="stat-label">Reviews</span>
                        </div>
                        <div className="stat-item clickable" onClick={() => {
                            // For now, this might only work for own profile or need a new view
                            console.log("View followers clicked");
                        }}>
                            <span className="stat-value">{stats.followers}</span>
                            <span className="stat-label">Followers</span>
                        </div>
                        <div className="stat-item clickable" onClick={() => {
                            // TODO: Implement viewing other user's following if needed
                            console.log("View following clicked");
                        }}>
                            <span className="stat-value">{stats.following}</span>
                            <span className="stat-label">Following</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* User's Logs */}
            <div className="profile-logs-section">
                <h2 className="section-title">Reviews</h2>

                {logs.length === 0 ? (
                    <div className="empty-state">
                        <p className="empty-icon">📝</p>
                        <p className="empty-title">No reviews yet</p>
                        <p className="empty-description">
                            {isOwnProfile
                                ? 'Start sharing your dining experiences!'
                                : `${profile?.full_name} hasn't posted any reviews yet.`}
                        </p>
                    </div>
                ) : (
                    <div className="logs-grid">
                        {logs.map(log => (
                            <LogCard
                                key={log.id}
                                log={log}
                                onViewProfile={onNavigate}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
