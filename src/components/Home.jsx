import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import CityBadgeCard from './CityBadgeCard';
import PopularRestaurants from './PopularRestaurants';
import Leaderboard from './Leaderboard';

const Home = ({ onRestaurantClick, onViewProfile, onNewLog, lastUpdated }) => {
    const { user } = useAuth();
    const [location, setLocation] = useState({ name: '', lat: null, lng: null });

    useEffect(() => {
        loadUserLocation();
    }, []);

    const loadUserLocation = () => {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            try {
                const parsed = JSON.parse(savedLocation);
                if (typeof parsed === 'object' && parsed !== null) {
                    setLocation(parsed);
                } else {
                    setLocation({ name: savedLocation });
                }
            } catch (e) {
                setLocation({ name: savedLocation });
            }
        }
    };

    // Listen for location changes from Navbar
    useEffect(() => {
        const handleLocationUpdate = () => {
            loadUserLocation();
        };
        window.addEventListener('locationChanged', handleLocationUpdate);
        return () => window.removeEventListener('locationChanged', handleLocationUpdate);
    }, []);

    const [badgeUpdateTrigger, setBadgeUpdateTrigger] = useState(0);

    const handleInteraction = () => {
        setBadgeUpdateTrigger(prev => prev + 1);
    };

    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkIsDesktop = () => {
            const width = window.innerWidth;
            // Check if it's a mobile device using User Agent
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            // Only consider it desktop if width is sufficient AND it's not a mobile device
            // This forces "Desktop Mode" on mobile to still use the mobile layout (single column)
            setIsDesktop(width >= 992 && !isMobileDevice);
        };

        checkIsDesktop();
        window.addEventListener('resize', checkIsDesktop);
        return () => window.removeEventListener('resize', checkIsDesktop);
    }, []);

    return (
        <div className="home-layout container" style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'flex-start',
            width: '100%',
            flexDirection: isDesktop ? 'row' : 'column' // Explicitly control direction
        }}>
            <div className="main-feed" style={{ flex: '1', minWidth: '0', width: isDesktop ? 'auto' : '100%' }}>
                {/* Popular Section */}
                {!location.name ? (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏙️</div>
                        <h3>Select a location above</h3>
                        <p>Find the best restaurants in your city.</p>
                    </div>
                ) : (
                    <>
                        {user && (
                            <div style={{ marginBottom: '2rem' }}>
                                <CityBadgeCard
                                    userId={user.id}
                                    city={location.name}
                                    onBadgeClick={() => onViewProfile(user.id, { initialTab: 'badges' })}
                                    lastUpdated={lastUpdated || badgeUpdateTrigger}
                                />
                            </div>
                        )}

                        {/* Mobile Leaderboard (Visible only on mobile) */}
                        {!isDesktop && (
                            <div className="mobile-leaderboard" style={{ marginBottom: '2rem' }}>
                                <Leaderboard onViewProfile={onViewProfile} userLocation={location} />
                            </div>
                        )}

                        <PopularRestaurants
                            city={location.name.split(',')[0]}
                            userLocation={location}
                            onRestaurantClick={onRestaurantClick}
                            onNewLog={onNewLog}
                            onInteraction={handleInteraction}
                        />
                    </>
                )}
            </div>

            {/* Sidebar for Leaderboard (Visible only on desktop) */}
            {isDesktop && (
                <div className="home-sidebar" style={{ width: '300px', flexShrink: 0, position: 'sticky', top: '90px' }}>
                    <Leaderboard onViewProfile={onViewProfile} userLocation={location} />
                </div>
            )}
        </div>
    );
};

export default Home;
