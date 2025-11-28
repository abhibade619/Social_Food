import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { supabase } from '../supabaseClient';
import LocationSelector from './LocationSelector';
import UserMenu from './UserMenu';

const Navbar = ({ currentView, setCurrentView, onNewLog }) => {
    const { user, signOut } = useAuth();
    const [location, setLocation] = useState('');

    useEffect(() => {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            setLocation(savedLocation);
        } else {
            loadLocationFromProfile();
        }
    }, [user]);

    const loadLocationFromProfile = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('location')
                .eq('id', user.id)
                .single();

            if (data?.location) {
                setLocation(data.location);
                localStorage.setItem('userLocation', data.location);
            }
        } catch (error) {
            console.error('Error loading location:', error);
        }
    };

    const handleLocationChange = async (newLocation) => {
        setLocation(newLocation);
        localStorage.setItem('userLocation', newLocation);

        if (user) {
            try {
                await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        location: newLocation,
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

                    <UserMenu
                        user={user}
                        onNavigate={setCurrentView}
                        onSignOut={signOut}
                    />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
