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

    return (
        <div className="home-layout container">
            <div className="main-feed" style={{ flex: '1', minWidth: '300px' }}>
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
                                    lastUpdated={lastUpdated}
                                />
                            </div>
                        )}
                        <PopularRestaurants
                            city={location.name.split(',')[0]}
                            onRestaurantClick={onRestaurantClick}
                            onNewLog={onNewLog}
                        />
                    </>
                )}
            </div>

            {/* Sidebar for Leaderboard */}
            <div className="home-sidebar" style={{ width: '300px', flexShrink: 0 }}>
                <Leaderboard onViewProfile={onViewProfile} userLocation={location} />
            </div>
        </div>
    );
};

export default Home;
