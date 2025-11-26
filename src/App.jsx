import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthProvider';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import ProfileSetup from './components/ProfileSetup';
import Navbar from './components/Navbar';
import Feed from './components/Feed';
import Search from './components/Search';
import Profile from './components/Profile';
import UserProfile from './components/UserProfile';
import RestaurantPage from './components/RestaurantPage';
import AccountInfo from './components/AccountInfo';
import Settings from './components/Settings';
import Diary from './components/Diary';
import './App.css';

function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('feed');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (user) {
      checkProfileCompletion();
    } else {
      // If no user, we're not checking profile
      setCheckingProfile(false);
    }
  }, [user]);

  const checkProfileCompletion = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single();

      if (error || !data?.username || !data?.full_name) {
        setProfileComplete(false);
      } else {
        setProfileComplete(true);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      setProfileComplete(false);
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleProfileSetupComplete = () => {
    setProfileComplete(true);
  };

  if (loading || checkingProfile) {
    return (
      <div className="loading-screen">
        <h1>🍽️ FoodSocial</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!profileComplete) {
    return <ProfileSetup onComplete={handleProfileSetupComplete} />;
  }

  const renderView = () => {
    if (currentView === 'restaurant' && selectedRestaurant) {
      return (
        <RestaurantPage
          restaurant={selectedRestaurant}
          onBack={() => setCurrentView('search')}
        />
      );
    }

    if (currentView === 'userProfile' && selectedUser) {
      return (
        <UserProfile
          userId={selectedUser.id}
          onBack={() => setCurrentView('search')}
        />
      );
    }

    switch (currentView) {
      case 'feed':
        return <Feed />;
      case 'search':
        return (
          <Search
            setCurrentView={setCurrentView}
            setSelectedRestaurant={setSelectedRestaurant}
            setSelectedUser={setSelectedUser}
          />
        );
      case 'profile':
        return <Profile />;
      case 'diary':
        return <Diary />;
      case 'account':
        return <AccountInfo />;
      case 'settings':
        return <Settings />;
      default:
        return <Feed />;
    }
  };

  return (
    <div className="app">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="main-content">{renderView()}</main>
    </div>
  );
}

export default App;
