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
import Notifications from './components/Notifications';
import AccountInfo from './components/AccountInfo';
import ChangePassword from './components/ChangePassword';
import Settings from './components/Settings';


import Diary from './components/Diary';
import LogModal from './components/LogModal';
import Home from './components/Home';
import './App.css';

function App() {
  const { user, loading, passwordRecoveryMode } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [listTargetUser, setListTargetUser] = useState(null); // New state for followers/following lists
  const [profileComplete, setProfileComplete] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [initialLogData, setInitialLogData] = useState(null);
  const [feedVersion, setFeedVersion] = useState(0);

  // Handle browser back button
  // Handle browser back button and initial load
  useEffect(() => {
    // Check for existing state on mount (fix for refresh)
    if (window.history.state && window.history.state.view) {
      setCurrentView(window.history.state.view);
      if (window.history.state.selectedRestaurant) setSelectedRestaurant(window.history.state.selectedRestaurant);
      if (window.history.state.selectedUser) setSelectedUser(window.history.state.selectedUser);
      if (window.history.state.listTargetUser) setListTargetUser(window.history.state.listTargetUser);
    } else {
      // Only set default if no state exists
      window.history.replaceState({ view: 'home' }, '');
    }

    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
        // Restore other state if needed
        if (event.state.selectedRestaurant) setSelectedRestaurant(event.state.selectedRestaurant);
        if (event.state.selectedUser) setSelectedUser(event.state.selectedUser);
        if (event.state.listTargetUser) setListTargetUser(event.state.listTargetUser);
      } else {
        setCurrentView('feed');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Helper to change view and push to history
  const navigateTo = (view, state = {}) => {
    setCurrentView(view);
    if (state.selectedUser) setSelectedUser(state.selectedUser);
    if (state.selectedRestaurant) setSelectedRestaurant(state.selectedRestaurant);
    if (state.listTargetUser) setListTargetUser(state.listTargetUser);
    window.history.pushState({ view, ...state }, '');
  };

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
    navigateTo('feed'); // Optional: switch to feed to see new log
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
    navigateTo('restaurant', { selectedRestaurant: restaurantData });
  };

  const handleNavigateToProfile = (userId) => {
    setSelectedUser({ id: userId });
    navigateTo('userProfile', { selectedUser: { id: userId } });
  };

  const handleViewFollowers = (userId) => {
    setListTargetUser(userId);
    navigateTo('followers');
  };

  const handleViewFollowing = (userId) => {
    setListTargetUser(userId);
    navigateTo('following');
  };

  const renderView = () => {
    if (currentView === 'restaurant' && selectedRestaurant) {
      return (
        <RestaurantPage
          restaurant={selectedRestaurant}
          onBack={() => navigateTo('search')}
          onNewLog={handleNewLog}
          onViewProfile={handleNavigateToProfile}
        />
      );
    }

    if (currentView === 'userProfile' && selectedUser) {
      return (
        <UserProfile
          userId={selectedUser.id}
          onBack={() => navigateTo('search')}
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
          onBack={() => navigateTo('profile')} // Ideally back to previous view, but profile is safe fallback
          onNavigate={handleNavigateToProfile}
        />
      );
    }

    if (currentView === 'following') {
      return (
        <FollowingList
          userId={listTargetUser || user.id}
          onBack={() => navigateTo('profile')}
          onNavigate={handleNavigateToProfile}
        />
      );
    }

    switch (currentView) {
      case 'home':
        return <Home
          onRestaurantClick={handleNavigateToRestaurant}
          onViewProfile={handleNavigateToProfile}
          onNewLog={handleNewLog}
        />;
      case 'feed':
        return <Feed
          key={feedVersion} // Force re-render/refetch when version changes
          onViewProfile={(userId) => {
            setSelectedUser({ id: userId });
            navigateTo('userProfile', { selectedUser: { id: userId } });
          }}
          onRestaurantClick={handleNavigateToRestaurant}
        />;
      case 'search':
        return (
          <Search
            setCurrentView={navigateTo}
            setSelectedRestaurant={setSelectedRestaurant}
            setSelectedUser={setSelectedUser}
            onRestaurantClick={handleNavigateToRestaurant}
          />
        );
      case 'profile':
        return <Profile
          onNavigate={navigateTo}
          onViewFollowers={handleViewFollowers}
          onViewFollowing={handleViewFollowing}
        />;
      case 'wishlist':
        return <Wishlist onRestaurantClick={handleNavigateToRestaurant} />;
      case 'diary':
        return <Diary onRestaurantClick={handleNavigateToRestaurant} />;
      case 'account':
        return <AccountInfo onNavigate={navigateTo} />;
      case 'change-password':
        return <ChangePassword onBack={() => navigateTo('account')} />;
      case 'settings':
        return <Settings />;
      case 'notifications':
        return <Notifications onNavigate={navigateTo} />;
      default:
        return <Feed />;
    }
  };

  return (
    <div className="app">
      <Navbar
        currentView={currentView}
        setCurrentView={navigateTo}
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

