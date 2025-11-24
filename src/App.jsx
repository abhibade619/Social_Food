import { useState } from 'react';
import { useAuth } from './context/AuthProvider';
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Feed from './components/Feed';
import Search from './components/Search';
import Profile from './components/Profile';
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

  if (loading) {
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

  const renderView = () => {
    if (currentView === 'restaurant' && selectedRestaurant) {
      return (
        <RestaurantPage
          restaurant={selectedRestaurant}
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
