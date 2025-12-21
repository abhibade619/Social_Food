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
                    <Logo height="100px" style={{ width: 'auto', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
                <p style={{ fontSize: '1.2rem', color: '#ccc', marginBottom: '3rem' }}>
                    Discover, track, and share the best food in your city.
                </p>

                {/* Features Section - Moved inside Hero */}
                <div className="features-section" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1.5rem',
                    padding: '0 1rem',
                    textAlign: 'center',
                    marginBottom: '2rem',
                    maxWidth: '900px',
                    margin: '0 auto 2rem auto'
                }}>
                    <div className="feature-card">
                        <div style={{ marginBottom: '0.5rem', color: '#D4AF37' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <h3 style={{ marginBottom: '0.25rem', fontSize: '1.1rem' }}>Find Best Places</h3>
                        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Discover top-rated restaurants.</p>
                    </div>
                    <div className="feature-card">
                        <div style={{ marginBottom: '0.5rem', color: '#D4AF37' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </div>
                        <h3 style={{ marginBottom: '0.25rem', fontSize: '1.1rem' }}>Track Visits</h3>
                        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Keep a list of where you've eaten.</p>
                    </div>
                    <div className="feature-card">
                        <div style={{ marginBottom: '0.5rem', color: '#D4AF37' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <h3 style={{ marginBottom: '0.25rem', fontSize: '1.1rem' }}>Share with Friends</h3>
                        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>See where friends are eating.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <button
                        className="premium-button"
                        onClick={onAuthRequired}
                        style={{ padding: '12px 32px', fontSize: '1.1rem' }}
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
