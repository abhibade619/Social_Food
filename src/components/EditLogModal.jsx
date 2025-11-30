import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import { cuisineTypes, visitTypes, ratingOptions, returnIntentOptions } from '../data/restaurants';
import { calculateOverallRating } from '../utils/calculateRating';

const EditLogModal = ({ log, onClose, onLogUpdated }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        restaurant_name: log.restaurant_name || '',
        location: log.location || '',
        cuisine: log.cuisine || '',
        visit_type: log.visit_type || 'Dine-in',
        is_first_time: log.is_first_time || false,
        rating: log.rating || '',
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
    const [photos, setPhotos] = useState([]);
    const [photoPreview, setPhotoPreview] = useState([]);
    const [taggedFriends, setTaggedFriends] = useState([]);
    const [friendSearch, setFriendSearch] = useState('');
    const [friendResults, setFriendResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Initialize photos from log
    useEffect(() => {
        if (log.photos) {
            const existingPhotos = typeof log.photos === 'string' ? JSON.parse(log.photos) : log.photos;
            setPhotos(existingPhotos); // For existing photos, we store the URL string
            setPhotoPreview(existingPhotos);
        }
    }, [log.photos]);

    // Fetch existing tagged users
    useEffect(() => {
        const fetchTaggedUsers = async () => {
            const { data } = await supabase
                .from('tagged_users')
                .select(`user_id, profiles: user_id(id, username, full_name, avatar_url)`)
                .eq('log_id', log.id);

            if (data) {
                setTaggedFriends(data.map(d => d.profiles));
            }
        };
        fetchTaggedUsers();
    }, [log.id]);

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + photos.length > 5) {
            setError('Maximum 5 photos allowed');
            return;
        }

        // We store File objects for new uploads, and URL strings for existing ones
        setPhotos([...photos, ...files]);

        // Create preview URLs
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPhotoPreview([...photoPreview, ...newPreviews]);
    };

    const removePhoto = (index) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        const newPreviews = photoPreview.filter((_, i) => i !== index);
        setPhotos(newPhotos);
        setPhotoPreview(newPreviews);
    };

    const uploadPhotos = async () => {
        const photoUrls = [];

        for (const photo of photos) {
            if (typeof photo === 'string') {
                // It's an existing photo URL
                photoUrls.push(photo);
            } else {
                // It's a new File object
                const fileExt = photo.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { data, error } = await supabase.storage
                    .from('log-photos')
                    .upload(fileName, photo);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('log-photos')
                    .getPublicUrl(fileName);

                photoUrls.push(publicUrl);
            }
        }

        return photoUrls;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const searchFriends = async (searchTerm) => {
        if (searchTerm.length < 2) {
            setFriendResults([]);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
                .neq('id', user.id)
                .limit(5);

            if (error) throw error;
            setFriendResults(data || []);
        } catch (err) {
            console.error('Error searching friends:', err);
        }
    };

    const handleFriendSearch = (e) => {
        const value = e.target.value;
        setFriendSearch(value);
        searchFriends(value);
    };

    const addTaggedFriend = (friend) => {
        if (!taggedFriends.find(f => f.id === friend.id)) {
            setTaggedFriends([...taggedFriends, friend]);
        }
        setFriendSearch('');
        setFriendResults([]);
    };

    const removeTaggedFriend = (friendId) => {
        setTaggedFriends(taggedFriends.filter(f => f.id !== friendId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Upload new photos if any
            const photoUrls = await uploadPhotos();

            const calculatedRating = calculateOverallRating(formData);

            const { data, error } = await supabase
                .from('logs')
                .update({
                    ...formData,
                    rating: calculatedRating,
                    photos: photoUrls,
                    updated_at: new Date().toISOString()
                })
                .eq('id', log.id)
                .eq('user_id', user.id) // Ensure user owns the log
                .select()
                .single();

            if (error) throw error;

            // Update tagged friends
            // First delete all existing tags for this log
            await supabase.from('tagged_users').delete().eq('log_id', log.id);

            // Then add new tags
            if (taggedFriends.length > 0) {
                const tagData = taggedFriends.map(friend => ({
                    log_id: log.id,
                    user_id: friend.id
                }));
                await supabase.from('tagged_users').insert(tagData);
            }

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
    const isTakeout = formData.visit_type === 'Takeout';
    const isDelivery = formData.visit_type === 'Delivery';

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
                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="is_first_time"
                                checked={formData.is_first_time}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_first_time: e.target.checked }))}
                            />
                            First time visiting?
                        </label>
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
                                </>
                            )}

                            {(isTakeout || isDelivery) && (
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
                            )}

                            {isTakeout && (
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
                            )}

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

                    {/* Photos Section */}
                    <div className="form-group">
                        <label>Photos (Max 5)</label>
                        <div className="photo-upload-container">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoUpload}
                                style={{ display: 'none' }}
                                id="edit-photo-upload"
                            />
                            <label htmlFor="edit-photo-upload" className="btn-secondary btn-sm">
                                📷 Add Photos
                            </label>
                            <span className="photo-count">{photos.length}/5</span>
                        </div>

                        {photoPreview.length > 0 && (
                            <div className="photo-previews">
                                {photoPreview.map((preview, index) => (
                                    <div key={index} className="photo-preview-item">
                                        <img src={preview} alt={`Preview ${index}`} />
                                        <button type="button" onClick={() => removePhoto(index)} className="remove-photo-btn">×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Friend Tagging Section */}
                    <div className="form-group">
                        <label>Tag Friends (Optional)</label>
                        <input
                            type="text"
                            value={friendSearch}
                            onChange={handleFriendSearch}
                            placeholder="Search for friends to tag..."
                        />

                        {friendResults.length > 0 && (
                            <div className="friend-search-results">
                                {friendResults.map((friend) => (
                                    <div
                                        key={friend.id}
                                        className="friend-result-item"
                                        onClick={() => addTaggedFriend(friend)}
                                    >
                                        <img
                                            src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                                            alt={friend.username}
                                            className="friend-avatar-small"
                                        />
                                        <div>
                                            <div className="friend-name">{friend.full_name}</div>
                                            <div className="friend-username">@{friend.username}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {taggedFriends.length > 0 && (
                            <div className="tagged-friends-list">
                                {taggedFriends.map((friend) => (
                                    <div key={friend.id} className="tagged-friend-chip">
                                        <img
                                            src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                                            alt={friend.username}
                                            className="friend-avatar-tiny"
                                        />
                                        <span>{friend.full_name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeTaggedFriend(friend.id)}
                                            className="remove-tag-btn"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
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
