import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';

const Wishlist = ({ onRestaurantClick }) => {
    const { user } = useAuth();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        restaurant_name: '',
        location: '',
        cuisine: '',
        notes: ''
    });

    const [isPrivate, setIsPrivate] = useState(false);

    useEffect(() => {
        fetchWishlist();
        fetchPrivacySettings();
    }, [user]);

    const fetchPrivacySettings = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('is_wishlist_private')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            setIsPrivate(data?.is_wishlist_private || false);
        } catch (error) {
            console.error('Error fetching privacy settings:', error);
        }
    };

    const handlePrivacyToggle = async (e) => {
        const newValue = e.target.checked;
        setIsPrivate(newValue);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_wishlist_private: newValue })
                .eq('id', user.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating privacy:', error);
            setIsPrivate(!newValue); // Revert on error
            alert('Failed to update privacy settings');
        }
    };

    const fetchWishlist = async () => {
        try {
            const { data, error } = await supabase
                .from('wishlist')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWishlist(data || []);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('wishlist')
                .insert([{
                    user_id: user.id,
                    ...formData
                }]);

            if (error) throw error;

            // Reset form and refresh list
            setFormData({
                restaurant_name: '',
                location: '',
                cuisine: '',
                notes: ''
            });
            setShowAddForm(false);
            await fetchWishlist();
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            alert('Failed to add restaurant. Please try again.');
        }
    };

    const handleRemove = async (e, id) => {
        e.stopPropagation(); // Prevent card click
        if (!confirm('Remove this restaurant from your wishlist?')) return;

        try {
            const { error } = await supabase
                .from('wishlist')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchWishlist();
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            alert('Failed to remove restaurant. Please try again.');
        }
    };

    const handleCardClick = (item) => {
        if (onRestaurantClick) {
            // Construct a restaurant object compatible with RestaurantPage
            const restaurantData = {
                name: item.restaurant_name,
                vicinity: item.location,
                place_id: item.place_id, // Ensure this is saved/fetched
                geometry: { location: { lat: 0, lng: 0 } } // Placeholder if missing
            };
            onRestaurantClick(restaurantData);
        }
    };

    if (loading) {
        return <div className="loading">Loading wishlist...</div>;
    }

    return (
        <div className="wishlist-container container">
            <div className="wishlist-header-premium">
                <h2>My Wishlist</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <input
                            type="checkbox"
                            checked={isPrivate}
                            onChange={handlePrivacyToggle}
                        />
                        🔒 Private Wishlist
                    </label>
                    <button
                        className="premium-button"
                        onClick={() => setShowAddForm(true)}
                    >
                        + Add Restaurant
                    </button>
                </div>
            </div>

            {showAddForm && (
                <div className="add-wishlist-modal" onClick={(e) => {
                    if (e.target.className === 'add-wishlist-modal') setShowAddForm(false);
                }}>
                    <div className="add-wishlist-content">
                        <div className="add-wishlist-header">
                            <h3>Add to Wishlist</h3>
                            <button className="close-button" onClick={() => setShowAddForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleAdd}>
                            <div className="form-group">
                                <label htmlFor="restaurant_name">Restaurant Name *</label>
                                <input
                                    id="restaurant_name"
                                    type="text"
                                    required
                                    value={formData.restaurant_name}
                                    onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                                    placeholder="e.g., Joe's Pizza"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="location">Location</label>
                                <input
                                    id="location"
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g., Downtown LA"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="cuisine">Cuisine</label>
                                <input
                                    id="cuisine"
                                    type="text"
                                    value={formData.cuisine}
                                    onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                                    placeholder="e.g., Italian"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="notes">Notes</label>
                                <textarea
                                    id="notes"
                                    rows="3"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Why do you want to try this place?"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Add to Wishlist</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {wishlist.length === 0 ? (
                <div className="empty-state glass-panel">
                    <span className="empty-icon">✨</span>
                    <h3 className="empty-title">Your wishlist is empty</h3>
                    <p className="empty-description">
                        Start adding restaurants you want to visit!
                    </p>
                </div>
            ) : (
                <div className="wishlist-grid-premium">
                    {wishlist.map(item => (
                        <div
                            key={item.id}
                            className="wishlist-card-premium"
                            onClick={() => handleCardClick(item)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="wishlist-card-header">
                                <h3>{item.restaurant_name}</h3>
                                <button
                                    className="remove-btn-icon"
                                    onClick={(e) => handleRemove(e, item.id)}
                                    title="Remove from wishlist"
                                >
                                    🗑️
                                </button>
                            </div>
                            <div className="wishlist-card-body">
                                {item.location && (
                                    <div className="wishlist-info-row">
                                        <span className="wishlist-icon">📍</span>
                                        <span>{item.location}</span>
                                    </div>
                                )}
                                {item.cuisine && (
                                    <div className="wishlist-info-row">
                                        <span className="wishlist-icon">🍽️</span>
                                        <span>{item.cuisine}</span>
                                    </div>
                                )}
                                {item.notes && (
                                    <div className="wishlist-notes">
                                        "{item.notes}"
                                    </div>
                                )}
                            </div>
                            <div className="wishlist-footer">
                                <span>Added {new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;
