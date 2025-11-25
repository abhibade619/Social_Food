import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import { cuisineTypes, visitTypes, ratingOptions, returnIntentOptions } from '../data/restaurants';

const EditLogModal = ({ log, onClose, onLogUpdated }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        restaurant_name: log.restaurant_name || '',
        location: log.location || '',
        cuisine: log.cuisine || '',
        visit_type: log.visit_type || 'Dine-in',
        rating_food: log.rating_food || '',
        rating_service: log.rating_service || '',
        rating_ambience: log.rating_ambience || '',
        rating_value: log.rating_value || '',
        rating_packaging: log.rating_packaging || '',
        rating_store_service: log.rating_store_service || '',
        return_intent: log.return_intent || '',
        content: log.content || '',
        visit_date: log.visit_date || new Date().toISOString().split('T')[0],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error } = await supabase
                .from('logs')
                .update({
                    ...formData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', log.id)
                .eq('user_id', user.id) // Ensure user owns the log
                .select()
                .single();

            if (error) throw error;

            onLogUpdated(data);
            onClose();
        } catch (err) {
            setError(err.message);
            console.error('Error updating log:', err);
        } finally {
            setLoading(false);
        }
    };

    const isDineIn = formData.visit_type === 'Dine-in';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Log</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="log-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="restaurant_name">Restaurant Name *</label>
                            <input
                                id="restaurant_name"
                                name="restaurant_name"
                                type="text"
                                value={formData.restaurant_name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="location">Location</label>
                            <input
                                id="location"
                                name="location"
                                type="text"
                                value={formData.location}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="cuisine">Cuisine</label>
                            <select
                                id="cuisine"
                                name="cuisine"
                                value={formData.cuisine}
                                onChange={handleChange}
                            >
                                <option value="">Select cuisine</option>
                                {cuisineTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="visit_type">Visit Type *</label>
                            <select
                                id="visit_type"
                                name="visit_type"
                                value={formData.visit_type}
                                onChange={handleChange}
                                required
                            >
                                {visitTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="visit_date">Visit Date</label>
                            <input
                                id="visit_date"
                                name="visit_date"
                                type="date"
                                value={formData.visit_date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Ratings</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="rating_food">Food</label>
                                <select
                                    id="rating_food"
                                    name="rating_food"
                                    value={formData.rating_food}
                                    onChange={handleChange}
                                >
                                    <option value="">-</option>
                                    {ratingOptions.map((rating) => (
                                        <option key={rating} value={rating}>{rating}</option>
                                    ))}
                                </select>
                            </div>

                            {isDineIn && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="rating_service">Service</label>
                                        <select
                                            id="rating_service"
                                            name="rating_service"
                                            value={formData.rating_service}
                                            onChange={handleChange}
                                        >
                                            <option value="">-</option>
                                            {ratingOptions.map((rating) => (
                                                <option key={rating} value={rating}>{rating}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="rating_ambience">Ambience</label>
                                        <select
                                            id="rating_ambience"
                                            name="rating_ambience"
                                            value={formData.rating_ambience}
                                            onChange={handleChange}
                                        >
                                            <option value="">-</option>
                                            {ratingOptions.map((rating) => (
                                                <option key={rating} value={rating}>{rating}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="rating_value">Value</label>
                                        <select
                                            id="rating_value"
                                            name="rating_value"
                                            value={formData.rating_value}
                                            onChange={handleChange}
                                        >
                                            <option value="">-</option>
                                            {ratingOptions.map((rating) => (
                                                <option key={rating} value={rating}>{rating}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {!isDineIn && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="rating_packaging">Packaging</label>
                                        <select
                                            id="rating_packaging"
                                            name="rating_packaging"
                                            value={formData.rating_packaging}
                                            onChange={handleChange}
                                        >
                                            <option value="">-</option>
                                            {ratingOptions.map((rating) => (
                                                <option key={rating} value={rating}>{rating}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="rating_store_service">Store Service</label>
                                        <select
                                            id="rating_store_service"
                                            name="rating_store_service"
                                            value={formData.rating_store_service}
                                            onChange={handleChange}
                                        >
                                            <option value="">-</option>
                                            {ratingOptions.map((rating) => (
                                                <option key={rating} value={rating}>{rating}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="return_intent">Would you return?</label>
                        <select
                            id="return_intent"
                            name="return_intent"
                            value={formData.return_intent}
                            onChange={handleChange}
                        >
                            <option value="">-</option>
                            {returnIntentOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="content">Your Experience</label>
                        <textarea
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Share your thoughts about this dining experience..."
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditLogModal;
