import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CityBadgeCard = ({ userId, city, onBadgeClick, count: externalCount }) => {
    const [stats, setStats] = useState({ count: 0, level: 'New Explorer', nextLevel: 4, color: '#bdc3c7' });
    const [loading, setLoading] = useState(!externalCount && externalCount !== 0);

    useEffect(() => {
        if (externalCount !== undefined && externalCount !== null) {
            calculateLevel(externalCount);
            setLoading(false);
        } else if (userId && city) {
            fetchCityStats();
        }
    }, [userId, city, externalCount]);

    const fetchCityStats = async () => {
        try {
            // 1. Fetch Visited
            const { data: visited } = await supabase
                .from('visited_restaurants')
                .select('place_id, restaurant_data')
                .eq('user_id', userId);

            // 2. Fetch Logs
            const { data: logs } = await supabase
                .from('logs')
                .select('place_id, location')
                .eq('user_id', userId);

            // 3. Filter by City and Count Unique Places
            const uniquePlaces = new Set();
            const normalizeCity = (c) => c ? c.split(',')[0].trim().toLowerCase() : '';
            const targetCity = normalizeCity(city);

            visited?.forEach(v => {
                let vCity = v.restaurant_data?.city || v.restaurant_data?.address || '';
                if (normalizeCity(vCity) === targetCity) {
                    uniquePlaces.add(v.place_id);
                }
            });

            logs?.forEach(l => {
                if (l.location && normalizeCity(l.location) === targetCity) {
                    uniquePlaces.add(l.place_id);
                }
            });

            const count = uniquePlaces.size;
            calculateLevel(count);

        } catch (error) {
            console.error("Error fetching city stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateLevel = (count) => {
        let level = 'New Explorer';
        // Using gradients for background
        let color = 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)';
        let nextLevel = 4;
        let icon = '🧭';
        let accentColor = '#bdc3c7';

        if (count >= 25) {
            level = 'Local Insider';
            color = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
            nextLevel = null;
            icon = '👑';
            accentColor = '#fff';
        } else if (count >= 10) {
            level = 'City Regular';
            color = 'linear-gradient(135deg, #2980b9 0%, #6dd5fa 100%)';
            nextLevel = 25;
            icon = '🏙️';
            accentColor = '#fff';
        } else if (count >= 4) {
            level = 'Local Taster';
            color = 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)';
            nextLevel = 10;
            icon = '🌮';
            accentColor = '#fff';
        }

        setStats({ count, level, nextLevel, color, icon, accentColor });
    };

    if (loading) return <div className="city-badge-card skeleton-loader" style={{ height: '200px' }}></div>;

    const progress = stats.nextLevel ? (stats.count / stats.nextLevel) * 100 : 100;
    const remaining = stats.nextLevel ? stats.nextLevel - stats.count : 0;

    return (
        <div
            className="city-badge-card"
            style={{
                background: stats.color,
                cursor: onBadgeClick ? 'pointer' : 'default',
                border: '1px solid rgba(255,255,255,0.1)'
            }}
            onClick={onBadgeClick}
        >

            <div className="badge-icon-large">{stats.icon}</div>

            <div className="badge-header" style={{ flexDirection: 'column', alignItems: 'flex-start', width: '100%', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginBottom: '0.5rem' }}>
                    <h3 className="city-name" style={{
                        fontSize: '2.5rem',
                        fontFamily: '"Playfair Display", serif',
                        margin: 0,
                        background: 'linear-gradient(to right, #fff, #e0e0e0)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1
                    }}>
                        {city.split(',')[0]}
                    </h3>

                    <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '6px',
                        color: 'rgba(255,255,255,0.9)'
                    }}>
                        <span style={{ fontSize: '1.8rem', fontWeight: 'bold', lineHeight: 1 }}>{stats.count}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: '500', opacity: 0.8 }}>
                            {stats.count === 1 ? 'Place' : 'Places'}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge-level-pill" style={{
                        borderColor: stats.accentColor,
                        color: stats.accentColor,
                        background: 'rgba(0,0,0,0.4)'
                    }}>
                        {stats.icon} {stats.level}
                    </span>
                </div>
            </div>

            <div className="progress-section" style={{ background: 'rgba(0,0,0,0.3)', border: 'none' }}>
                {stats.nextLevel ? (
                    <>
                        <div className="progress-info" style={{ marginBottom: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                <strong>{remaining}</strong> more visits to reach <strong style={{ color: stats.accentColor }}>{
                                    stats.nextLevel === 4 ? 'Local Taster' :
                                        stats.nextLevel === 10 ? 'City Regular' :
                                            'Local Insider'
                                }</strong>
                            </span>
                            <span style={{ fontWeight: 'bold', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{Math.round(progress)}%</span>
                        </div>
                        <div className="progress-bar-bg" style={{ height: '8px', background: 'rgba(255,255,255,0.1)' }}>
                            <div
                                className="progress-bar-fill"
                                style={{
                                    width: `${progress}%`,
                                    background: stats.accentColor,
                                    boxShadow: `0 0 10px ${stats.accentColor}80`
                                }}
                            ></div>
                        </div>
                    </>
                ) : (
                    <div className="max-level-banner" style={{
                        color: stats.accentColor,
                        borderColor: stats.accentColor,
                        background: 'rgba(255,255,255,0.1)'
                    }}>
                        🏆 You've conquered {city.split(',')[0]}!
                    </div>
                )}
            </div>
        </div>
    );
};

export default CityBadgeCard;
