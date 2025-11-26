import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { supabase } from '../supabaseClient';
import LocationSelector from './LocationSelector';
import UserMenu from './UserMenu';

const Navbar = ({ currentView, setCurrentView }) => {
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

    const handleNavigate = (view) => {
        setCurrentView(view);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-left">
                    <div className="navbar-brand" onClick={() => setCurrentView('feed')}>
                        🍽️ <span>FoodSocial</span>
                    </div>
                    <LocationSelector
                        currentLocation={location}
                        onLocationChange={handleLocationChange}
                    />
                </div>

                <div className="navbar-links">
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
                        className={`nav-link ${currentView === 'profile' ? 'active' : ''}`}
                        onClick={() => setCurrentView('profile')}
                    >
                        Profile
                    </button>
                    <UserMenu onNavigate={handleNavigate} onSignOut={handleSignOut} />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
