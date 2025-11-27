import React from 'react';

const CUISINES = [
    { id: 'all', label: 'All', icon: '🍽️' },
    { id: 'italian', label: 'Italian', icon: '🍝' },
    { id: 'chinese', label: 'Chinese', icon: '🥡' },
    { id: 'indian', label: 'Indian', icon: '🍛' },
    { id: 'mexican', label: 'Mexican', icon: '🌮' },
    { id: 'thai', label: 'Thai', icon: '🍜' },
    { id: 'japanese', label: 'Japanese', icon: '🍣' },
    { id: 'burgers', label: 'Burgers', icon: '🍔' },
    { id: 'pizza', label: 'Pizza', icon: '🍕' },
    { id: 'cafe', label: 'Cafe', icon: '☕' },
    { id: 'dessert', label: 'Dessert', icon: '🍰' },
];

const CuisineSelector = ({ selectedCuisine, onSelectCuisine }) => {
    return (
        <div className="cuisine-selector">
            <div className="cuisine-list">
                {CUISINES.map((cuisine) => (
                    <button
                        key={cuisine.id}
                        className={`cuisine-item ${selectedCuisine === cuisine.id ? 'active' : ''}`}
                        onClick={() => onSelectCuisine(cuisine.id)}
                    >
                        <span className="cuisine-icon">{cuisine.icon}</span>
                        <span className="cuisine-label">{cuisine.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CuisineSelector;
