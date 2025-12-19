import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { supabase } from '../supabaseClient';
import LocationSelector from './LocationSelector';
import UserMenu from './UserMenu';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';

const Navbar = ({ currentView, setCurrentView, onNewLog, onAuthRequired }) => {
    const { user, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [location, setLocation] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            try {
                const parsed = JSON.parse(savedLocation);
                setLocation(parsed);
            } catch {
                // Handle legacy plain string in local storage
                setLocation({ name: savedLocation, lat: null, lng: null });
            }
        } else {
            loadUserProfile();
        }

        if (user) {
            loadUserProfile();
        }
    }, [user]);

    // Listen for profile updates (e.g., avatar change)
    useEffect(() => {
        const handleProfileUpdate = () => {
            loadUserProfile();
        };
        window.addEventListener('profileUpdated', handleProfileUpdate);
        return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
    }, [user]);

    // Fetch unread notifications count
    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            // Set up real-time subscription for notifications
            const subscription = supabase
                .channel('public:notifications')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, (payload) => {
                    setUnreadCount(prev => prev + 1);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [user]);

    const fetchUnreadCount = async () => {
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;
            setUnreadCount(count || 0);
        } catch (error) {
            console.error('Error fetching unread notifications:', error);
        }
    };

    const loadUserProfile = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('location, avatar_url')
                .eq('id', user.id)
                .single();

            if (data) {
                // Handle Location
                if (data.location) {
                    try {
                        const parsed = JSON.parse(data.location);
                        setLocation(parsed);
                        localStorage.setItem('userLocation', JSON.stringify(parsed));
                    } catch {
                        const locationObj = { name: data.location, lat: null, lng: null };
                        setLocation(locationObj);
                        localStorage.setItem('userLocation', JSON.stringify(locationObj));
                    }
                }

                // Handle Avatar
                if (data.avatar_url) {
                    setAvatarUrl(data.avatar_url);
                }
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    };

    const handleLocationChange = async (newLocation) => {
        setLocation(newLocation);
        // Ensure we store stringified JSON
        const locationString = JSON.stringify(newLocation);
        localStorage.setItem('userLocation', locationString);

        // Dispatch event for other components
        window.dispatchEvent(new Event('locationChanged'));

        if (user) {
            try {
                await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        location: locationString, // Store as JSON string in DB too
                        updated_at: new Date().toISOString(),
                    });
            } catch (error) {
                console.error('Error saving location:', error);
            }
        }
    };

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <nav className="navbar">
            <div className="navbar-content container">
                <div className="navbar-left">
                    <div className="logo" onClick={() => setCurrentView('home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <Logo height="36px" />
                    </div>
                </div>

                <div className="navbar-center">
                    <LocationSelector
                        currentLocation={location}
                        onLocationChange={handleLocationChange}
                    />
                </div>

                <div className="navbar-right">
                    {user ? (
                        <>
                            <button
                                className={`nav-icon-btn ${currentView === 'feed' ? 'active' : ''}`}
                                onClick={() => setCurrentView('feed')}
                                title="Feed"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                            </button>
                            <button
                                className={`nav-icon-btn ${currentView === 'diary' ? 'active' : ''}`}
                                onClick={() => setCurrentView('diary')}
                                title="Diary"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                </svg>
                            </button>
                            <button
                                className={`nav-icon-btn ${currentView === 'search' ? 'active' : ''}`}
                                onClick={() => setCurrentView('search')}
                                title="Search"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </button>
                            <button
                                className={`nav-icon-btn ${currentView === 'notifications' ? 'active' : ''}`}
                                onClick={() => setCurrentView('notifications')}
                                title="Notifications"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                            </button>

                            <UserMenu
                                user={user}
                                avatarUrl={avatarUrl}
                                onNavigate={setCurrentView}
                                onSignOut={handleSignOut}
                            />
                        </>
                    ) : (
                        <button
                            className="premium-button"
                            onClick={onAuthRequired}
                            style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
