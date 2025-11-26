import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';

const Wishlist = () => {
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

    useEffect(() => {
        fetchWishlist();
    }, [user]);

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

    const handleRemove = async (id) => {
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

    if (loading) {
        return <div className="loading">Loading wishlist...</div>;
    }

    return (
        <div className="wishlist-container">
            <div className="wishlist-header">
                <h2>My Wishlist</h2>
                <button
                    className="btn-primary"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    {showAddForm ? 'Cancel' : '+ Add Restaurant'}
                </button>
            </div>

            {showAddForm && (
                <div className="add-wishlist-form">
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
                        <button type="submit" className="btn-primary">Add to Wishlist</button>
                    </form>
                </div>
            )}

            {wishlist.length === 0 ? (
                <div className="empty-state">
                    <p className="empty-icon">📝</p>
                    <p className="empty-title">Your wishlist is empty</p>
                    <p className="empty-description">
                        Add restaurants you want to try later!
                    </p>
                </div>
            ) : (
                <div className="wishlist-grid">
                    {wishlist.map(item => (
                        <div key={item.id} className="wishlist-card">
                            <div className="wishlist-card-header">
                                <h3>{item.restaurant_name}</h3>
                                <button
                                    className="remove-btn"
                                    onClick={() => handleRemove(item.id)}
                                    title="Remove from wishlist"
                                >
                                    🗑️
                                </button>
                            </div>
                            {item.location && (
                                <p className="wishlist-location">📍 {item.location}</p>
                            )}
                            {item.cuisine && (
                                <p className="wishlist-cuisine">🍽️ {item.cuisine}</p>
                            )}
                            {item.notes && (
                                <p className="wishlist-notes">{item.notes}</p>
                            )}
                            <p className="wishlist-date">
                                Added {new Date(item.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;
