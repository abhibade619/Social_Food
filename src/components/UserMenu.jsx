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

    const handleMenuClick = (e, action) => {
        console.log("UserMenu: handleMenuClick", action);
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        if (action) {
            console.log("UserMenu: executing action");
            action();
        } else {
            console.error("UserMenu: no action provided");
        }
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
                        <span className="menu-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </span>
                        My Wishlist
                    </button>
                    <div className="menu-divider"></div>
                    <button className="menu-item" onClick={() => handleNavigate('account')}>
                        <span className="menu-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </span>
                        Account Info
                    </button>
                    <button className="menu-item" onClick={() => handleNavigate('settings')}>
                        <span className="menu-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        </span>
                        Settings
                    </button>

                    <div className="menu-divider"></div>
                    <button
                        className="menu-item menu-item-danger"
                        onClick={(e) => {
                            console.log("UserMenu: Sign Out clicked");
                            e.preventDefault();
                            e.stopPropagation();
                            if (onSignOut) {
                                onSignOut();
                            } else {
                                console.error("UserMenu: onSignOut prop is missing");
                            }
                            setIsOpen(false);
                        }}
                    >
                        <span className="menu-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </span>
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
