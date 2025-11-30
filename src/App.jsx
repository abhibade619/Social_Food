import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthProvider';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import UpdatePassword from './components/UpdatePassword';
import ProfileSetup from './components/ProfileSetup';
import Navbar from './components/Navbar';
import Feed from './components/Feed';
import Search from './components/Search';
import Profile from './components/Profile';
import UserProfile from './components/UserProfile';
import FollowersList from './components/FollowersList';
import FollowingList from './components/FollowingList';
import Wishlist from './components/Wishlist';
import RestaurantPage from './components/RestaurantPage';
import AccountInfo from './components/AccountInfo';
import Settings from './components/Settings';
import Diary from './components/Diary';
import LogModal from './components/LogModal';
import './App.css';

function App() {
  const { user, loading, passwordRecoveryMode } = useAuth();
  const [currentView, setCurrentView] = useState('feed');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [listTargetUser, setListTargetUser] = useState(null); // New state for followers/following lists
  const [profileComplete, setProfileComplete] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [initialLogData, setInitialLogData] = useState(null);
  const [feedVersion, setFeedVersion] = useState(0);

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

  const handleLogCreated = () => {
    setFeedVersion(v => v + 1);
    setShowLogModal(false);
    setInitialLogData(null);
    setCurrentView('feed'); // Optional: switch to feed to see new log
  };

  const handleNewLog = (data = null) => {
    setInitialLogData(data);
    setShowLogModal(true);
  };

  if (loading || checkingProfile) {
    return (
      <div className="loading-screen">
        <h1>🍽️ FoodSocial</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (passwordRecoveryMode) {
    return <UpdatePassword onComplete={() => window.location.href = '/'} />;
  }

  if (!user) {
    return <Auth />;
  }

  if (!profileComplete) {
    return <ProfileSetup onComplete={handleProfileSetupComplete} />;
  }

  const handleNavigateToRestaurant = (restaurantData) => {
    setSelectedRestaurant(restaurantData);
    setCurrentView('restaurant');
  };

  const handleNavigateToProfile = (userId) => {
    setSelectedUser({ id: userId });
    setCurrentView('userProfile');
  };

  const handleViewFollowers = (userId) => {
    setListTargetUser(userId);
    setCurrentView('followers');
  };

  const handleViewFollowing = (userId) => {
    setListTargetUser(userId);
    setCurrentView('following');
  };

  const renderView = () => {
    if (currentView === 'restaurant' && selectedRestaurant) {
      return (
        <RestaurantPage
          restaurant={selectedRestaurant}
          onBack={() => setCurrentView('search')}
          onNewLog={handleNewLog}
        />
      );
    }

    if (currentView === 'userProfile' && selectedUser) {
      return (
        <UserProfile
          userId={selectedUser.id}
          onBack={() => setCurrentView('search')}
          onNavigate={handleNavigateToProfile}
          onViewFollowers={handleViewFollowers}
          onViewFollowing={handleViewFollowing}
          onRestaurantClick={handleNavigateToRestaurant}
        />
      );
    }

    if (currentView === 'followers') {
      return (
        <FollowersList
          userId={listTargetUser || user.id}
          onBack={() => setCurrentView('profile')} // Ideally back to previous view, but profile is safe fallback
          onNavigate={handleNavigateToProfile}
        />
      );
    }

    if (currentView === 'following') {
      return (
        <FollowingList
          userId={listTargetUser || user.id}
          onBack={() => setCurrentView('profile')}
          onNavigate={handleNavigateToProfile}
        />
      );
    }

    switch (currentView) {
      case 'feed':
        return <Feed
          key={feedVersion} // Force re-render/refetch when version changes
          onViewProfile={(userId) => {
            setSelectedUser({ id: userId });
            setCurrentView('userProfile');
          }}
          onRestaurantClick={handleNavigateToRestaurant}
        />;
      case 'search':
        return (
          <Search
            setCurrentView={setCurrentView}
            setSelectedRestaurant={setSelectedRestaurant}
            setSelectedUser={setSelectedUser}
            onRestaurantClick={handleNavigateToRestaurant}
          />
        );
      case 'profile':
        return <Profile
          onNavigate={setCurrentView}
          onViewFollowers={handleViewFollowers}
          onViewFollowing={handleViewFollowing}
        />;
      case 'wishlist':
        return <Wishlist />;
      case 'diary':
        return <Diary onRestaurantClick={handleNavigateToRestaurant} />;
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
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onNewLog={() => handleNewLog(null)}
      />
      <main className="main-content">{renderView()}</main>

      {showLogModal && (
        <LogModal
          onClose={() => {
            setShowLogModal(false);
            setInitialLogData(null);
          }}
          onLogCreated={handleLogCreated}
          initialData={initialLogData}
        />
      )}
    </div>
  );
}

export default App;

