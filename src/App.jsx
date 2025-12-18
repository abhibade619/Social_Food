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
import LandingPage from './components/LandingPage';
import './App.css';

function App() {
  const { user, loading, passwordRecoveryMode } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [listTargetUser, setListTargetUser] = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [initialLogData, setInitialLogData] = useState(null);
  const [feedVersion, setFeedVersion] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false); // New state for auth modal

  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const triggerUpdate = () => {
    setLastUpdated(Date.now());
  };

  // Handle browser back button and initial load
  useEffect(() => {
    if (window.history.state && window.history.state.view) {
      setCurrentView(window.history.state.view);
      if (window.history.state.selectedRestaurant) setSelectedRestaurant(window.history.state.selectedRestaurant);
      if (window.history.state.selectedUser) setSelectedUser(window.history.state.selectedUser);
      if (window.history.state.listTargetUser) setListTargetUser(window.history.state.listTargetUser);
    } else {
      window.history.replaceState({ view: 'home' }, '');
    }

    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
        if (event.state.selectedRestaurant) setSelectedRestaurant(event.state.selectedRestaurant);
        if (event.state.selectedUser) setSelectedUser(event.state.selectedUser);
        if (event.state.listTargetUser) setListTargetUser(event.state.listTargetUser);
      } else {
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
      setShowAuthModal(false); // Close auth modal on successful login
    } else {
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
    navigateTo('feed');
    triggerUpdate();
  };

  const handleNewLog = (data = null) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setInitialLogData(data);
    setShowLogModal(true);
  };

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  if (loading || checkingProfile) {
    return (
      <div className="loading-screen">
        <h1>🍽️ Khrunch</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (passwordRecoveryMode) {
    return <UpdatePassword onComplete={() => window.location.href = '/'} />;
  }

  // If not logged in and not showing auth modal, show Landing Page (or Auth if explicitly requested)
  if (!user && !showAuthModal) {
    // We can render LandingPage here.
    // But we also need to handle if the user was trying to access a specific view (unlikely for initial load if public)
    // For now, let's just render LandingPage which contains the public view.
    // However, to support the "Home" view structure, we might want to wrap it.
    // Actually, the requirement is: "Home page appears... popular restaurants... mark as visited -> login"

    // Let's use a simplified render for non-auth users
    return (
      <div className="app">
        <Navbar
          currentView={currentView}
          setCurrentView={navigateTo}
          onNewLog={() => handleNewLog(null)}
          onAuthRequired={handleAuthRequired} // Pass to Navbar for "Sign In" button
        />
        <main className="main-content">
          <LandingPage
            onAuthRequired={handleAuthRequired}
            onRestaurantClick={(r) => {
              // Allow viewing restaurant details? Or block?
              // User said "popular restaurants appear... mark as visited -> login"
              // Let's allow viewing details for now, or just trigger auth if they click?
              // "It's not redirecting to anything" -> implies they want to see details or action.
              // Let's allow viewing details but actions inside will trigger auth.
              setSelectedRestaurant(r);
              navigateTo('restaurant', { selectedRestaurant: r });
            }}
            onNewLog={handleNewLog}
          />
        </main>
      </div>
    );
  }

  if (!user && showAuthModal) {
    // Show Auth screen. 
    // Ideally this should be a modal over the landing page, but for simplicity/existing structure, 
    // we can render the Auth component. 
    // Or we can render the LandingPage AND the Auth modal.
    // Let's try to render Auth as a full page for now to match existing style, 
    // or better, render it over the app.

    // User said: "when they want to mark as visited or log in, then it should appear sign up or login"
    // This implies a transition.
    return (
      <div className="app">
        <Navbar
          currentView={currentView}
          setCurrentView={navigateTo}
          onNewLog={() => handleNewLog(null)}
          onAuthRequired={handleAuthRequired}
        />
        <main className="main-content">
          {/* We could keep LandingPage in background if we made Auth a modal, but Auth.jsx is a full page card. */}
          {/* Let's just render Auth.jsx. It has a "back" button? No, but we can add one or just rely on browser back? */}
          {/* Actually, Auth.jsx is a centered card. We can render it on top of a blurred background? */}
          <LandingPage onAuthRequired={() => { }} />
          <div
            onClick={() => setShowAuthModal(false)}

            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2000,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(5px)',
              padding: '20px'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              <Auth />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (user && !profileComplete) {
    return <ProfileSetup onComplete={handleProfileSetupComplete} />;
  }

  const handleNavigateToRestaurant = (restaurantData) => {
    setSelectedRestaurant(restaurantData);
    navigateTo('restaurant', { selectedRestaurant: restaurantData });
  };

  const handleNavigateToProfile = (userId, options = {}) => {
    setSelectedUser({ id: userId, ...options });
    navigateTo('userProfile', { selectedUser: { id: userId, ...options } });
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
          triggerUpdate={triggerUpdate}
        />
      );
    }

    if (currentView === 'userProfile' && selectedUser) {
      return (
        <UserProfile
          userId={selectedUser.id}
          initialTab={selectedUser.initialTab}
          onBack={() => navigateTo('search')}
          onNavigate={handleNavigateToProfile}
          onViewFollowers={handleViewFollowers}
          onViewFollowing={handleViewFollowing}
          onRestaurantClick={handleNavigateToRestaurant}
          triggerUpdate={triggerUpdate}
          lastUpdated={lastUpdated}
        />
      );
    }

    if (currentView === 'followers') {
      return (
        <FollowersList
          userId={listTargetUser || user.id}
          onBack={() => navigateTo('profile')}
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
          lastUpdated={lastUpdated}
        />;
      case 'feed':
        return <Feed
          key={feedVersion}
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
          triggerUpdate={triggerUpdate}
          lastUpdated={lastUpdated}
        />;
      case 'wishlist':
        return <Wishlist onRestaurantClick={handleNavigateToRestaurant} />;
      case 'diary':
        return <Diary
          onRestaurantClick={handleNavigateToRestaurant}
          onViewProfile={handleNavigateToProfile}
        />;
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

