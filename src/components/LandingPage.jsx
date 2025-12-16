import { useState } from 'react';
import PopularRestaurants from './PopularRestaurants';
import LocationSelector from './LocationSelector';

const LandingPage = ({ onAuthRequired, onRestaurantClick, onNewLog }) => {
    const [selectedCity, setSelectedCity] = useState(null);

    const handleLocationChange = (location) => {
        setSelectedCity(location);
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
                <h1 className="premium-gradient-text" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
                    FoodSocial
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#ccc', marginBottom: '2rem' }}>
                    Savor every moment. Discover, track, and share your culinary journey.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        <LocationSelector
                            currentLocation={selectedCity}
                            onLocationChange={handleLocationChange}
                        />
                    </div>

                    {!selectedCity && (
                        <p style={{ color: 'var(--primary-color)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            Please select a location to explore restaurants
                        </p>
                    )}

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
                {selectedCity ? (
                    <PopularRestaurants
                        city={selectedCity.name ? selectedCity.name.split(',')[0] : ''}
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
        </div>
    );
};

export default LandingPage;
