import { useState, useEffect } from 'react';

const UserMenu = ({ onNavigate, onSignOut }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && !event.target.closest('.user-menu')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleMenuClick = (action) => {
        setIsOpen(false);
        action();
    };

    const handleNavigate = (view) => {
        setIsOpen(false);
        onNavigate(view);
    };

    return (
        <div className="user-menu">
            <button
                className="menu-button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="User menu"
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <circle cx="10" cy="4" r="2" />
                    <circle cx="10" cy="10" r="2" />
                    <circle cx="10" cy="16" r="2" />
                </svg>
            </button>

            {isOpen && (
                <div className="menu-dropdown">
                    <button className="menu-item" onClick={() => handleNavigate('wishlist')}>
                        <span className="menu-icon">📝</span>
                        My Wishlist
                    </button>
                    <div className="menu-divider"></div>
                    <button className="menu-item" onClick={() => handleNavigate('account')}>
                        <span className="menu-icon">👤</span>
                        Account Info
                    </button>
                    <button className="menu-item" onClick={() => handleNavigate('settings')}>
                        <span className="menu-icon">⚙️</span>
                        Settings
                    </button>
                    <div className="menu-divider"></div>
                    <button
                        className="menu-item menu-item-danger"
                        onClick={() => handleMenuClick(onSignOut)}
                    >
                        <span className="menu-icon">🚪</span>
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
