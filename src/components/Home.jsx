import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import PopularRestaurants from './PopularRestaurants';

const Home = ({ onRestaurantClick, onViewProfile, onNewLog }) => {
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
            <div className="main-feed" style={{ width: '100%' }}>
                {/* Popular Section */}
                {!location.name ? (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏙️</div>
                        <h3>Select a location above</h3>
                        <p>Find the best restaurants in your city.</p>
                    </div>
                ) : (
                    <PopularRestaurants
                        city={location.name.split(',')[0]}
                        onRestaurantClick={onRestaurantClick}
                        onNewLog={onNewLog}
                    />
                )}
            </div>
        </div>
    );
};

export default Home;
