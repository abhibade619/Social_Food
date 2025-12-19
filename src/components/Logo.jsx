import React from 'react';
import './Logo.css';
import khrunchLogo from './khrunchlogo.png';

const Logo = ({ className, style, height = '40px' }) => {
    // Height controls the overall size.
    // We'll scale the image based on it.

    return (
        <div
            className={`logo-container ${className || ''}`}
            style={{ height: height, ...style }}
            aria-label="Khrunch"
        >
            <img
                src={khrunchLogo}
                alt="Khrunch"
                className="logo-image"
                style={{ height: '100%', width: 'auto', display: 'block' }}
            />
        </div>
    );
};

export default Logo;
