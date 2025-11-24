import { mockUsers } from '../data/mockData';

const LogCard = ({ log, onClick }) => {
    // Find the user who created this log
    const user = mockUsers.find((u) => u.id === log.user_id) || mockUsers[0];

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getRatingColor = (rating) => {
        const num = parseInt(rating);
        if (num >= 4) return 'rating-good';
        if (num >= 3) return 'rating-ok';
        return 'rating-bad';
    };

    return (
        <div className="log-card" onClick={onClick}>
            <div className="log-header">
                <img src={user.avatar_url} alt={user.username} className="user-avatar" />
                <div className="log-user-info">
                    <p className="log-user-name">{user.full_name}</p>
                    <p className="log-username">@{user.username}</p>
                </div>
                <span className="log-date">{formatDate(log.visit_date)}</span>
            </div>

            <div className="log-content">
                <h3 className="restaurant-name">{log.restaurant_name}</h3>
                <div className="log-meta">
                    <span className="cuisine-tag">{log.cuisine}</span>
                    <span className="location-tag">📍 {log.location}</span>
                    <span className="visit-type-tag">{log.visit_type}</span>
                </div>

                <p className="log-text">{log.content}</p>

                <div className="ratings">
                    {log.rating_food && (
                        <span className={`rating-badge ${getRatingColor(log.rating_food)}`}>
                            Food: {log.rating_food}/5
                        </span>
                    )}
                    {log.rating_service && (
                        <span className={`rating-badge ${getRatingColor(log.rating_service)}`}>
                            Service: {log.rating_service}/5
                        </span>
                    )}
                    {log.rating_ambience && (
                        <span className={`rating-badge ${getRatingColor(log.rating_ambience)}`}>
                            Ambience: {log.rating_ambience}/5
                        </span>
                    )}
                    {log.rating_value && (
                        <span className={`rating-badge ${getRatingColor(log.rating_value)}`}>
                            Value: {log.rating_value}/5
                        </span>
                    )}
                </div>

                <div className="return-intent">
                    <strong>Would return:</strong> {log.return_intent}
                </div>
            </div>
        </div>
    );
};

export default LogCard;
