import { useState } from 'react';
import PopularRestaurants from './PopularRestaurants';

const LandingPage = ({ onAuthRequired, onRestaurantClick, onNewLog }) => {
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
                <button
                    className="premium-button"
                    onClick={onAuthRequired}
                    style={{ padding: '12px 32px', fontSize: '1.1rem' }}
                >
                    Get Started
                </button>
            </div>

            {/* Content Section */}
            <div className="container">
                <PopularRestaurants
                    city="New York" // Default city for landing page, could be dynamic later
                    onRestaurantClick={onRestaurantClick}
                    onNewLog={onNewLog}
                    onAuthRequired={onAuthRequired}
                />
            </div>
        </div>
    );
};

export default LandingPage;
