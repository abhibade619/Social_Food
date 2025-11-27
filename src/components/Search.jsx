import { useState } from 'react';
import LocationSelector from './LocationSelector';
import RestaurantAutocomplete from './RestaurantAutocomplete';
import UserSearch from './UserSearch';
import CuisineSelector from './CuisineSelector';
import RestaurantList from './RestaurantList';

const Search = ({ setCurrentView, setSelectedRestaurant, setSelectedUser }) => {
    const [activeTab, setActiveTab] = useState('restaurants');
    const [location, setLocation] = useState({ name: '', lat: null, lng: null });
    const [selectedCuisine, setSelectedCuisine] = useState('all');

    const handleLocationChange = (newLocation) => {
        // newLocation can be a string (legacy/fallback) or object {name, lat, lng}
        if (typeof newLocation === 'string') {
            setLocation({ name: newLocation, lat: null, lng: null });
        } else {
            setLocation(newLocation);
        }
    };

    const handleRestaurantClick = (place) => {
        // Transform Google Places result to match app's expected format if needed
        // Or just pass the place object if RestaurantPage handles it
        // For now, passing the place object directly.
        // We might need to fetch full details if not all fields are present, 
        // but RestaurantPage usually fetches details by place_id anyway.
        setSelectedRestaurant(place);
        setCurrentView('restaurant');
    };

    return (
        <div className="search-page">
            <div className="search-header">
                <LocationSelector
                    currentLocation={location.name || (typeof location === 'string' ? location : '')}
                    onLocationChange={handleLocationChange}
                />
            </div>

            <div className="search-tabs">
                <button
                    className={`tab-button ${activeTab === 'restaurants' ? 'active' : ''}`}
                    onClick={() => setActiveTab('restaurants')}
                >
                    Restaurants
                </button>
                <button
                    className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    People
                </button>
            </div>

            <div className="search-content">
                {activeTab === 'restaurants' ? (
                    <div className="restaurant-search-section">
                        <h2>Find Restaurants</h2>

                        <div className="search-input-container">
                            <RestaurantAutocomplete
                                onPlaceSelected={(place) => {
                                    setSelectedRestaurant(place);
                                    setCurrentView('restaurant');
                                }}
                                locationBias={location}
                            />
                        </div>

                        <div className="browse-section">
                            <h3>Browse by Cuisine</h3>
                            <CuisineSelector
                                selectedCuisine={selectedCuisine}
                                onSelectCuisine={setSelectedCuisine}
                            />
                        </div>

                        {location.name && (
                            <RestaurantList
                                location={location}
                                cuisine={selectedCuisine}
                                onRestaurantClick={handleRestaurantClick}
                            />
                        )}
                    </div>
                ) : (
                    <div className="user-search-section">
                        <h2>Find People</h2>
                        <UserSearch
                            onUserSelected={(user) => {
                                setSelectedUser(user);
                                setCurrentView('userProfile');
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
