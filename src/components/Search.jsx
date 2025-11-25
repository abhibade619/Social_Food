import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { restaurants } from '../data/restaurants';
import FollowButton from './FollowButton';

const Search = ({ setCurrentView, setSelectedRestaurant, setSelectedUser }) => {
    const [activeTab, setActiveTab] = useState('restaurants');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (term) => {
        setSearchTerm(term);
        if (term.trim() === '') {
            setFilteredRestaurants([]);
            setFilteredUsers([]);
            return;
        }

        setLoading(true);

        if (activeTab === 'restaurants') {
            // Search restaurants
            const filtered = restaurants.filter(
                (restaurant) =>
                    restaurant.name.toLowerCase().includes(term.toLowerCase()) ||
                    restaurant.cuisine.toLowerCase().includes(term.toLowerCase()) ||
                    restaurant.location.toLowerCase().includes(term.toLowerCase())
            );
            setFilteredRestaurants(filtered);
        } else {
            // Search users
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`)
                    .limit(20);

                if (error) throw error;
                setFilteredUsers(data || []);
            } catch (error) {
                console.error('Error searching users:', error);
                setFilteredUsers([]);
            }
        }

        setLoading(false);
    };

    useEffect(() => {
        handleSearch(searchTerm);
    }, [activeTab]);

    const handleRestaurantClick = (restaurant) => {
        setSelectedRestaurant(restaurant);
        setCurrentView('restaurant');
    };

    const handleUserClick = (user) => {
        if (setSelectedUser) {
            setSelectedUser(user);
            setCurrentView('userProfile');
        }
    };

    return (
        <div className="search-container">
            <h2>Search</h2>

            {/* Tabs */}
            <div className="search-tabs">
                <button
                    className={`search-tab ${activeTab === 'restaurants' ? 'active' : ''}`}
                    onClick={() => setActiveTab('restaurants')}
                >
                    🍽️ Restaurants
                </button>
                <button
                    className={`search-tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    👥 Users
                </button>
            </div>

            {/* Search Box */}
            <div className="search-box">
                <input
                    type="text"
                    placeholder={
                        activeTab === 'restaurants'
                            ? 'Search by name, cuisine, or location...'
                            : 'Search by username or name...'
                    }
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Results */}
            <div className="search-results">
                {loading && <p className="loading">Searching...</p>}

                {!loading && searchTerm && activeTab === 'restaurants' && filteredRestaurants.length === 0 && (
                    <p className="no-results">No restaurants found</p>
                )}

                {!loading && searchTerm && activeTab === 'users' && filteredUsers.length === 0 && (
                    <p className="no-results">No users found</p>
                )}

                {/* Restaurant Results */}
                {activeTab === 'restaurants' &&
                    filteredRestaurants.map((restaurant) => (
                        <div
                            key={restaurant.id}
                            className="restaurant-card"
                            onClick={() => handleRestaurantClick(restaurant)}
                        >
                            <h3>{restaurant.name}</h3>
                            <p className="restaurant-info">
                                <span className="cuisine-tag">{restaurant.cuisine}</span>
                                <span className="location-tag">📍 {restaurant.location}</span>
                            </p>
                        </div>
                    ))}

                {/* User Results */}
                {activeTab === 'users' &&
                    filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="user-result-card"
                        >
                            <div onClick={() => handleUserClick(user)} style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}>
                                <img
                                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                    alt={user.username}
                                    className="user-result-avatar"
                                />
                                <div className="user-result-info">
                                    <p className="user-result-name">{user.full_name || 'No name'}</p>
                                    <p className="user-result-username">@{user.username || 'unknown'}</p>
                                </div>
                            </div>
                            <FollowButton targetUserId={user.id} targetUsername={user.username} />
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default Search;
