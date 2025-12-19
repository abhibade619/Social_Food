import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Leaderboard = ({ onViewProfile }) => {
    const [topUsers, setTopUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            // 1. Fetch all logs (just user_ids) to calculate counts
            // Note: In a production app with millions of rows, this should be a database view or RPC.
            const { data: logs, error: logsError } = await supabase
                .from('logs')
                .select('user_id');

            if (logsError) throw logsError;

            // 2. Aggregate counts
            const userCounts = {};
            logs.forEach(log => {
                userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
            });

            // 3. Sort and get top 5
            const sortedUserIds = Object.keys(userCounts)
                .sort((a, b) => userCounts[b] - userCounts[a])
                .slice(0, 5);

            if (sortedUserIds.length === 0) {
                setTopUsers([]);
                setLoading(false);
                return;
            }

            // 4. Fetch profile details for these users
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .in('id', sortedUserIds);

            if (profilesError) throw profilesError;

            // 5. Merge data
            const leaderboardData = sortedUserIds.map(id => {
                const profile = profiles.find(p => p.id === id);
                return {
                    ...profile,
                    count: userCounts[id]
                };
            }).filter(user => user.id); // Filter out any missing profiles

            setTopUsers(leaderboardData);

        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="glass-panel premium-card leaderboard-card">
                <h3>🏆 Top Foodies</h3>
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    if (topUsers.length === 0) return null;

    return (
        <div className="glass-panel premium-card leaderboard-card">
            <h3 style={{
                marginBottom: '1rem',
                background: 'var(--primary-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '1.2rem'
            }}>
                🏆 Top Foodies
            </h3>
            <div className="leaderboard-list">
                {topUsers.map((user, index) => (
                    <div
                        key={user.id}
                        className="leaderboard-item"
                        onClick={() => onViewProfile && onViewProfile(user.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 0',
                            borderBottom: index < topUsers.length - 1 ? '1px solid var(--border-color)' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <div className="rank" style={{
                            fontWeight: 'bold',
                            color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--text-tertiary)',
                            width: '20px'
                        }}>
                            {index + 1}
                        </div>
                        <img
                            src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                            alt={user.username}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--primary-color)' }}
                        />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user.full_name || 'User'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {user.count} {user.count === 1 ? 'log' : 'logs'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
