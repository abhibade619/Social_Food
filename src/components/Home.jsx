import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import LocationSelector from './LocationSelector';
import PopularRestaurants from './PopularRestaurants';

const Home = ({ onRestaurantClick, onViewProfile, onNewLog }) => {
    const { user } = useAuth();
    const [location, setLocation] = useState({ name: '', lat: null, lng: null });
    const [selectedCuisine, setSelectedCuisine] = useState('all');

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

    const handleLocationChange = (newLocation) => {
        // This will trigger the event listener above via Navbar's logic if used there,
        // but here we just update local state and let Navbar sync it if needed.
        // Actually, better to use the same logic as Navbar to save it.
        // But since Navbar is always present, we can just update localStorage and dispatch event.
        const locationString = JSON.stringify(newLocation);
        localStorage.setItem('userLocation', locationString);
        window.dispatchEvent(new Event('locationChanged'));
    };

    return (
        <div className="home-layout container">
            <div className="main-feed" style={{ width: '100%' }}>
                {/* Popular Section */}
                {!location.name ? (
                    <div className="location-prompt-card glass-panel" style={{ textAlign: 'center', padding: '3rem', marginTop: '2rem' }}>
                        <h2 className="premium-gradient-text" style={{ marginBottom: '1rem' }}>Welcome to FoodSocial!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
                            To find the best restaurants near you, please select your location.
                        </p>
                        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                            <LocationSelector
                                currentLocation={location}
                                onLocationChange={handleLocationChange}
                            />
                        </div>
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
