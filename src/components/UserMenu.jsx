import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const UserMenu = ({ user, avatarUrl, onNavigate, onSignOut }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    // ... (rest of the component)

    // ... inside return ...


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
            <div className="user-menu-trigger">
                <img
                    src={avatarUrl || user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                    alt="Profile"
                    className="nav-avatar"
                    onClick={() => onNavigate('profile')}
                    style={{ cursor: 'pointer' }}
                />
                <button
                    className="menu-button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="User menu"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                    </svg>
                </button>
            </div>

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
                    <button className="menu-item" onClick={() => handleMenuClick(toggleTheme)}>
                        <span className="menu-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
                        Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
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
