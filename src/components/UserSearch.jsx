import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const UserSearch = ({ onUserSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const searchUsers = async () => {
            if (!searchTerm.trim()) {
                setUsers([]);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
                    .limit(20);

                if (error) throw error;
                setUsers(data || []);
            } catch (error) {
                console.error('Error searching users:', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            searchUsers();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

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
                {loading && <div className="loading-spinner-small"></div>}

                {!loading && users.map((user) => (
                    <div
                        key={user.id}
                        className="user-item"
                        onClick={() => handleUserClick(user)}
                    >
                        <img
                            src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                            alt={user.username}
                            className="user-avatar-small"
                        />
                        <div className="user-info">
                            <p className="user-name">{user.full_name || 'Unknown User'}</p>
                            <p className="username">@{user.username || 'unknown'}</p>
                        </div>
                    </div>
                ))}

                {!loading && searchTerm && users.length === 0 && (
                    <p className="no-results">No users found.</p>
                )}
            </div>
        </div>
    );
};

export default UserSearch;
