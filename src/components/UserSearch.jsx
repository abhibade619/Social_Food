import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import FollowButton from './FollowButton';

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
        <div className="search-component-wrapper">
            <input
                type="text"
                placeholder="Search for users..."
                className="premium-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="user-list">
                {loading && <div className="loading-spinner-small"></div>}

                {!loading && users.map((user) => (
                    <div
                        key={user.id}
                        className="premium-user-item"
                        onClick={() => handleUserClick(user)}
                    >
                        <div className="user-item-content" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img
                                src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                                alt={user.username}
                                className="premium-avatar-small"
                            />
                            <div className="user-info">
                                <p className="user-name" style={{ margin: 0, fontWeight: 600 }}>{user.full_name || 'Unknown User'}</p>
                                <p className="username" style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>@{user.username || 'unknown'}</p>
                            </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                            <FollowButton targetUserId={user.id} />
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
