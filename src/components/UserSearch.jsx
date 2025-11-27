import { useState } from 'react';
import { mockUsers } from '../data/mockData';

const UserSearch = ({ onUserSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = mockUsers.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUserClick = (user) => {
        if (onUserSelect) {
            onUserSelect(user);
        }
    };

    return (
        <div className="user-search">
            <input
                type="text"
                placeholder="Search for users..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="user-list">
                {filteredUsers.map((user) => (
                    <div
                        key={user.id}
                        className="user-item"
                        onClick={() => handleUserClick(user)}
                    >
                        <img src={user.avatar_url} alt={user.username} className="user-avatar-small" />
                        <div className="user-info">
                            <p className="user-name">{user.full_name}</p>
                            <p className="username">@{user.username}</p>
                        </div>
                    </div>
                ))}
                {filteredUsers.length === 0 && (
                    <p className="no-results">No users found.</p>
                )}
            </div>
        </div>
    );
};

export default UserSearch;
