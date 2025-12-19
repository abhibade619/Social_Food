import { useState, useEffect } from 'react';
import PopularRestaurants from './PopularRestaurants';
import Logo from './Logo';

const LandingPage = ({ onAuthRequired, onRestaurantClick, onNewLog }) => {
    const [location, setLocation] = useState(null);

    useEffect(() => {
        loadLocation();

        const handleLocationUpdate = () => {
            loadLocation();
        };
        window.addEventListener('locationChanged', handleLocationUpdate);
        return () => window.removeEventListener('locationChanged', handleLocationUpdate);
    }, []);

    const loadLocation = () => {
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
        } else {
            setLocation(null);
        }
    };

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <div className="hero-section" style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
                marginBottom: '2rem',
                borderRadius: '0 0 20px 20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <Logo height="100px" style={{ width: 'auto', maxWidth: '80%' }} />
                </div>
                <p style={{ fontSize: '1.2rem', color: '#ccc', marginBottom: '2rem' }}>
                    Savor every moment. Discover, track, and share your culinary journey.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <button
                        className="premium-button"
                        onClick={onAuthRequired}
                        style={{ padding: '12px 32px', fontSize: '1.1rem', marginTop: '1rem' }}
                    >
                        Get Started
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="container">
                {location && location.name ? (
                    <PopularRestaurants
                        city={location.name.split(',')[0]}
                        onRestaurantClick={onRestaurantClick}
                        onNewLog={onNewLog}
                        onAuthRequired={onAuthRequired}
                    />
                ) : (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏙️</div>
                        <h3>Select a location above</h3>
                        <p>Find the best restaurants in your city.</p>
                    </div>
                )}
            </div>
        </div >
    );
};

export default LandingPage;
