import React from 'react';
import './Logo.css';

const Logo = ({ className, style, height = '40px' }) => {
    // Height controls the overall size.
    // We'll scale the font size and SVG size based on it.
    // Assuming height is like "40px", we can use it directly.

    return (
        <div
            className={`logo-container ${className || ''}`}
            style={{ height: height, fontSize: height, ...style }}
            aria-label="Khrunch"
        >
            {/* The K is a Fork and Knife with Silver Gradient */}
            <svg
                className="logo-k-svg"
                viewBox="0 0 35 40"
                height="1em"
                width="0.875em"
                style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))' }}
            >
                <defs>
                    <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E8E8E8" />
                        <stop offset="40%" stopColor="#A0A0A0" />
                        <stop offset="60%" stopColor="#C0C0C0" />
                        <stop offset="100%" stopColor="#808080" />
                    </linearGradient>
                </defs>

                {/* Fork (Vertical) */}
                <path className="k-fork" d="M10 25 V40 H14 V25 C14 25 14 20 14 20 V10 H16 V5 H14 V2 H12 V5 H10 V2 H8 V5 H6 V2 H4 V5 H6 V10 C6 10 6 20 6 20 V25 H10 Z" fill="url(#silverGradient)" />
                {/* Knife (Angled Top) */}
                <path className="k-knife-top" d="M14 20 L30 4 C32 2 34 4 32 6 L18 24 Z" fill="url(#silverGradient)" />
                {/* Bottom Leg */}
                <path className="k-leg-bottom" d="M18 22 L32 38 C34 40 30 42 28 40 L14 24 Z" fill="url(#silverGradient)" />
            </svg>

            <span className="brand-text">
                <span className="brand-rest">HR</span>
                <span className="letter-u-wrapper">
                    <span className="letter-u">U</span>
                    <span className="u-smile"></span>
                    <span className="u-bite"></span>
                </span>
                <span className="brand-rest">NCH</span>
            </span>
        </div>
    );
};

export default Logo;
