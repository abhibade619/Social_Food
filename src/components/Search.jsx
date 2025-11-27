import { useState } from 'react';
import LocationSelector from './LocationSelector';
import RestaurantAutocomplete from './RestaurantAutocomplete';
import UserSearch from './UserSearch';

const Search = ({ setCurrentView, setSelectedRestaurant, setSelectedUser }) => {
    const [activeTab, setActiveTab] = useState('restaurants');
    const [location, setLocation] = useState({ name: '', lat: null, lng: null });

    const handleLocationChange = (newLocation) => {
        // newLocation can be a string (legacy/fallback) or object {name, lat, lng}
        if (typeof newLocation === 'string') {
            setLocation({ name: newLocation, lat: null, lng: null });
        } else {
            setLocation(newLocation);
        }
    };

    return (
        <div className="search-page container">
            <div className="search-header-premium">
                <h1>Search</h1>
                <div className="segmented-control">
                    <button
                        className={`segment-btn ${activeTab === 'restaurants' ? 'active' : ''}`}
                        onClick={() => setActiveTab('restaurants')}
                    >
                        Restaurants
                    </button>
                    <button
                        className={`segment-btn ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Users
                    </button>
                </div>
            </div>

            <div className="search-content-premium">
                {activeTab === 'restaurants' ? (
                    <div className="search-section fade-in">
                        <div className="search-input-wrapper glass-panel">
                            <RestaurantAutocomplete
                                onPlaceSelected={(place) => {
                                    setSelectedRestaurant(place);
                                    setCurrentView('restaurant');
                                }}
                                locationBias={location}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="search-section fade-in">
                        <div className="search-input-wrapper glass-panel">
                            <UserSearch
                                onUserSelected={(user) => {
                                    setSelectedUser(user);
                                    setCurrentView('userProfile');
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
