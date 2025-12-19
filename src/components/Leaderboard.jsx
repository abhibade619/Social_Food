import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const Leaderboard = ({ onViewProfile, userLocation }) => {
    const [topUsers, setTopUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scope, setScope] = useState('global'); // Default to Worldwide
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Parse location for dropdown options
    const getLocationOptions = () => {
        let city = "Your City";
        let country = "Your Country";

        if (userLocation && userLocation.name) {
            const parts = userLocation.name.split(',').map(p => p.trim());
            if (parts.length > 0) city = parts[0];
            if (parts.length > 1) country = parts[parts.length - 1]; // Assume last part is country
        }

        return { city, country };
    };

    const { city, country } = getLocationOptions();

    useEffect(() => {
        fetchLeaderboard();
    }, [scope, userLocation]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            // 1. Build query
            let query = supabase.from('logs').select('user_id, location, full_address');

            // 2. Apply filters based on scope
            if (scope === 'city' && city !== "Your City") {
                // Fuzzy match for city in location or full_address
                query = query.or(`location.ilike.%${city}%,full_address.ilike.%${city}%`);
            } else if (scope === 'country' && country !== "Your Country") {
                // Fuzzy match for country in full_address (more reliable for country) or location
                query = query.or(`location.ilike.%${country}%,full_address.ilike.%${country}%`);
            }

            const { data: logs, error: logsError } = await query;

            if (logsError) throw logsError;

            // 3. Aggregate counts
            const userCounts = {};
            logs.forEach(log => {
                userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
            });

            // 4. Sort and get top 5
            const sortedUserIds = Object.keys(userCounts)
                .sort((a, b) => userCounts[b] - userCounts[a])
                .slice(0, 5);

            if (sortedUserIds.length === 0) {
                setTopUsers([]);
                setLoading(false);
                return;
            }

            // 5. Fetch profile details for these users
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .in('id', sortedUserIds);

            if (profilesError) throw profilesError;

            // 6. Merge data
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

    const getScopeLabel = () => {
        switch (scope) {
            case 'city': return city;
            case 'country': return country;
            case 'global': return 'Worldwide';
            default: return 'Worldwide';
        }
    };

    if (loading && topUsers.length === 0) {
        return (
            <div className="glass-panel premium-card leaderboard-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>🏆 Top Foodies</h3>
                </div>
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    return (
        <div className="glass-panel premium-card leaderboard-card" style={{ overflow: 'visible' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'nowrap', gap: '10px', position: 'relative', zIndex: 10 }}>
                <h3 style={{
                    background: 'var(--primary-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '1.2rem',
                    margin: 0,
                    whiteSpace: 'nowrap'
                }}>
                    🏆 Top Foodies
                </h3>

                {/* Custom Dropdown */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '20px',
                            padding: '6px 16px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                        }}
                        className="leaderboard-filter-trigger"
                    >
                        <span>{getScopeLabel()}</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>▼</span>
                    </div>

                    {isDropdownOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '8px',
                            background: '#1a1a1a', // Fallback
                            backgroundColor: 'var(--surface-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '4px',
                            minWidth: '140px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                            zIndex: 100,
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div
                                onClick={() => { setScope('global'); setIsDropdownOpen(false); }}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    color: scope === 'global' ? 'var(--primary-color)' : 'var(--text-primary)',
                                    background: scope === 'global' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                    fontSize: '0.9rem'
                                }}
                                className="dropdown-item"
                            >
                                Worldwide
                            </div>
                            {country !== "Your Country" && (
                                <div
                                    onClick={() => { setScope('country'); setIsDropdownOpen(false); }}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        color: scope === 'country' ? 'var(--primary-color)' : 'var(--text-primary)',
                                        background: scope === 'country' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                        fontSize: '0.9rem'
                                    }}
                                    className="dropdown-item"
                                >
                                    {country}
                                </div>
                            )}
                            {city !== "Your City" && (
                                <div
                                    onClick={() => { setScope('city'); setIsDropdownOpen(false); }}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        color: scope === 'city' ? 'var(--primary-color)' : 'var(--text-primary)',
                                        background: scope === 'city' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                        fontSize: '0.9rem'
                                    }}
                                    className="dropdown-item"
                                >
                                    {city}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {topUsers.length === 0 && !loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    No top foodies found in {getScopeLabel()}.
                </div>
            ) : (
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
            )}
        </div>
    );
};

export default Leaderboard;
