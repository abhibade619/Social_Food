import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { supabase } from '../supabaseClient';
import LocationSelector from './LocationSelector';
import UserMenu from './UserMenu';

const Navbar = ({ currentView, setCurrentView, onNewLog }) => {
    const { user, signOut } = useAuth();
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
        <nav className="navbar glass-panel">
            <div className="navbar-content container">
                <div className="navbar-left">
                    <div className="logo" onClick={() => setCurrentView('feed')}>
                        <span className="logo-icon">🍽️</span>
                        <span className="logo-text">FoodSocial</span>
                    </div>
                </div>

                <div className="navbar-center">
                    <LocationSelector
                        currentLocation={location}
                        onLocationChange={handleLocationChange}
                    />
                </div>

                <div className="navbar-right">
                    <button
                        className={`nav-link ${currentView === 'feed' ? 'active' : ''}`}
                        onClick={() => setCurrentView('feed')}
                    >
                        Feed
                    </button>
                    <button
                        className={`nav-link ${currentView === 'diary' ? 'active' : ''}`}
                        onClick={() => setCurrentView('diary')}
                    >
                        Diary
                    </button>
                    <button
                        className={`nav-link ${currentView === 'search' ? 'active' : ''}`}
                        onClick={() => setCurrentView('search')}
                    >
                        Search
                    </button>

                    <button
                        className={`nav-link icon-btn ${currentView === 'notifications' ? 'active' : ''}`}
                        onClick={() => setCurrentView('notifications')}
                        title="Notifications"
                    >
                        🔔
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </button>

                    <UserMenu
                        user={user}
                        avatarUrl={avatarUrl}
                        onNavigate={setCurrentView}
                        onSignOut={handleSignOut}
                    />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
