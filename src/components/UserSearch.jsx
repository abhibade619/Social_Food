import { mockUsers } from '../data/mockData';

const UserSearch = ({ onUserSelect }) => {
    const handleUserClick = (user) => {
        if (onUserSelect) {
            onUserSelect(user);
        }
    };

    return (
        <div className="user-search">
            <h3>Tag Friends</h3>
            <div className="user-list">
                {mockUsers.map((user) => (
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
            </div>
        </div>
    );
};

export default UserSearch;
