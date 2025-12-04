import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';

const Notifications = ({ onNavigate }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            markAllAsRead();
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    *,
                    sender:from_user_id (
                        id,
                        full_name,
                        username,
                        avatar_url
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (notification.type === 'tag' && notification.reference_id) {
            const confirmAdd = window.confirm("Do you want to add this memory to your diary?");

            if (confirmAdd) {
                try {
                    const { error } = await supabase
                        .from('tagged_users')
                        .update({ show_in_diary: true })
                        .eq('log_id', notification.reference_id)
                        .eq('user_id', user.id);

                    if (error) throw error;
                    alert("Added to your diary!");
                } catch (err) {
                    console.error("Error adding to diary:", err);
                    alert("Failed to add to diary. Please try again.");
                }
            }

            onNavigate('diary');
        } else if (notification.type === 'follow') {
            // Navigate to the user's profile
            if (notification.from_user_id) {
                onNavigate('userProfile', { selectedUser: { id: notification.from_user_id } });
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading notifications...</div>;
    }

    return (
        <div className="notifications-container container">
            <h2 className="page-title">Notifications</h2>

            {notifications.length === 0 ? (
                <div className="empty-state glass-panel">
                    <div className="empty-icon">🔔</div>
                    <p className="empty-title">No notifications yet</p>
                    <p className="empty-description">
                        When someone tags you or follows you, it will appear here.
                    </p>
                </div>
            ) : (
                <div className="notifications-list-premium">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`premium-notification-item ${!notification.is_read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="notification-icon-premium">
                                {notification.sender?.avatar_url ? (
                                    <img
                                        src={notification.sender.avatar_url}
                                        alt="User"
                                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    notification.type === 'tag' ? '🏷️' : notification.type === 'follow' ? '👤' : '🔔'
                                )}
                            </div>
                            <div className="notification-content">
                                <p className="notification-message">
                                    {notification.message || (
                                        notification.type === 'follow' && notification.sender ? (
                                            <span>
                                                <strong>{notification.sender.full_name || notification.sender.username}</strong> started following you.
                                            </span>
                                        ) : 'New notification'
                                    )}
                                </p>
                                <span className="notification-time">
                                    {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            {!notification.is_read && <div className="unread-dot"></div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
