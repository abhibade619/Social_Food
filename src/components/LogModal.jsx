import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import { cuisineTypes, visitTypes, ratingOptions, returnIntentOptions } from '../data/restaurants';

const LogModal = ({ onClose, onLogCreated }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        restaurant_name: '',
        location: '',
        cuisine: '',
        visit_type: 'Dine-in',
        rating_food: '',
        rating_service: '',
        rating_ambience: '',
        rating_value: '',
        rating_packaging: '',
        rating_store_service: '',
        return_intent: '',
        content: '',
        visit_date: new Date().toISOString().split('T')[0],
    });
    const [photos, setPhotos] = useState([]);
    const [photoPreview, setPhotoPreview] = useState([]);
    const [taggedFriends, setTaggedFriends] = useState([]);
    const [friendSearch, setFriendSearch] = useState('');
    const [friendResults, setFriendResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + photos.length > 5) {
            setError('Maximum 5 photos allowed');
            return;
        }

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

    const uploadPhotos = async () => {
        const photoUrls = [];

        for (const photo of photos) {
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

        return photoUrls;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Upload photos if any
            let photoUrls = [];
            if (photos.length > 0) {
                photoUrls = await uploadPhotos();
            }

            const logData = {
                ...formData,
                user_id: user.id,
                photos: photoUrls,
            };

            const { data: logResult, error: logError } = await supabase
                .from('logs')
                .insert([logData])
                .select()
                .single();

            if (logError) throw logError;

            // Tag friends if any
            if (taggedFriends.length > 0) {
                const tagData = taggedFriends.map(friend => ({
                    log_id: logResult.id,
                    user_id: friend.id
                }));

                const { error: tagError } = await supabase
                    .from('tagged_users')
                    .insert(tagData);

                if (tagError) console.error('Error tagging users:', tagError);
            }

            onLogCreated(logResult);
        } catch (err) {
            setError(err.message);
            console.error('Error creating log:', err);
        } finally {
            setLoading(false);
        }
    };

    const isDineIn = formData.visit_type === 'Dine-in';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create New Log</h2>
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

                    {/* Photo Upload Section */}
                    <div className="form-group">
                        <label>Photos (Optional - Max 5)</label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoUpload}
                            style={{ display: 'none' }}
                            id="photo-upload"
                        />
                        <label htmlFor="photo-upload" className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                            📷 Add Photos
                        </label>

                        {photoPreview.length > 0 && (
                            <div className="photo-preview-grid">
                                {photoPreview.map((preview, index) => (
                                    <div key={index} className="photo-preview-item">
                                        <img src={preview} alt={`Preview ${index + 1}`} />
                                        <button
                                            type="button"
                                            className="remove-photo-btn"
                                            onClick={() => removePhoto(index)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tag Friends Section */}
                    <div className="form-group">
                        <label>Tag Friends (Optional)</label>
                        <input
                            type="text"
                            placeholder="Search friends by name or username..."
                            value={friendSearch}
                            onChange={handleFriendSearch}
                            className="friend-search-input"
                        />

                        {friendResults.length > 0 && (
                            <div className="friend-results">
                                {friendResults.map(friend => (
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
                                            <p className="friend-name">{friend.full_name || friend.username}</p>
                                            <p className="friend-username">@{friend.username}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {taggedFriends.length > 0 && (
                            <div className="tagged-friends-list">
                                {taggedFriends.map(friend => (
                                    <div key={friend.id} className="tagged-friend-chip">
                                        <img
                                            src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                                            alt={friend.username}
                                            className="friend-avatar-tiny"
                                        />
                                        <span>{friend.full_name || friend.username}</span>
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
                            {loading ? 'Creating...' : 'Create Log'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LogModal;
