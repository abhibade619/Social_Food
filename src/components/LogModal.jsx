import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import { cuisineTypes, visitTypes, ratingOptions, returnIntentOptions } from '../data/restaurants';
import RestaurantAutocomplete from './RestaurantAutocomplete';
import { calculateOverallRating } from '../utils/calculateRating';

const LogModal = ({ onClose, onLogCreated, initialData = null }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        restaurant_name: initialData?.name || '',
        location: initialData?.location || '',
        cuisine: initialData?.cuisine || '',
        visit_type: 'Dine-in',
        is_first_time: false,
        rating: '',
        rating_food: '',
        rating_service: '',
        rating_ambience: '',
        rating_value: '',
        rating_packaging: '',
        rating_store_service: '',
        return_intent: '',
        content: '',
        visit_date: new Date().toISOString().split('T')[0],
        place_id: initialData?.place_id || '',
        latitude: initialData?.latitude || null,
        longitude: initialData?.longitude || null,
        full_address: initialData?.address || '',
    });
    const [photos, setPhotos] = useState([]);
    const [photoPreview, setPhotoPreview] = useState([]);
    const [taggedFriends, setTaggedFriends] = useState([]);
    const [friendSearch, setFriendSearch] = useState('');
    const [friendResults, setFriendResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // If we have initial data (like place_id), start in manual mode (autocomplete disabled) 
    // so the user sees the pre-filled info. Otherwise, default to autocomplete.
    const [useAutocomplete, setUseAutocomplete] = useState(!initialData?.place_id);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePlaceSelected = (place) => {
        setFormData((prev) => ({
            ...prev,
            restaurant_name: place.name,
            location: place.location,
            place_id: place.place_id,
            latitude: place.latitude,
            longitude: place.longitude,
            full_address: place.address
        }));
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

            const calculatedRating = calculateOverallRating(formData);

            const logData = {
                ...formData,
                rating: calculatedRating,
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
    const isTakeout = formData.visit_type === 'Takeout';
    const isDelivery = formData.visit_type === 'Delivery';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content compact-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create New Log</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="log-form compact-form">
                    {/* Row 1: Restaurant & Location */}
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1.5 }}>
                            <label htmlFor="restaurant_name">Restaurant *</label>
                            {useAutocomplete ? (
                                <div className="input-with-action">
                                    <RestaurantAutocomplete
                                        onPlaceSelected={handlePlaceSelected}
                                        defaultValue={formData.restaurant_name}
                                        locationBias={formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : null}
                                    />
                                    <button type="button" className="text-action-btn" onClick={() => setUseAutocomplete(false)}>Manual</button>
                                </div>
                            ) : (
                                <div className="input-with-action">
                                    <input
                                        id="restaurant_name"
                                        name="restaurant_name"
                                        type="text"
                                        value={formData.restaurant_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., Joe's Pizza"
                                    />
                                    <button type="button" className="text-action-btn" onClick={() => setUseAutocomplete(true)}>Search</button>
                                </div>
                            )}
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="location">Location</label>
                            <input
                                id="location"
                                name="location"
                                type="text"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="City"
                            />
                        </div>
                    </div>

                    {/* Row 2: Cuisine, Visit Type, Date, First Time */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="cuisine">Cuisine</label>
                            <select
                                id="cuisine"
                                name="cuisine"
                                value={formData.cuisine}
                                onChange={handleChange}
                            >
                                <option value="">Select</option>
                                {cuisineTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="visit_type">Type *</label>
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
                            <label htmlFor="visit_date">Date</label>
                            <input
                                id="visit_date"
                                name="visit_date"
                                type="date"
                                value={formData.visit_date}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group checkbox-group-compact">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="is_first_time"
                                    checked={formData.is_first_time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_first_time: e.target.checked }))}
                                />
                                First Time?
                            </label>
                        </div>
                    </div>

                    {/* Row 3: Ratings Grid */}
                    <div className="form-section compact-section">
                        <h3 className="section-title-compact">Ratings</h3>
                        <div className="ratings-grid">
                            <div className="rating-item">
                                <label htmlFor="rating_food">Food</label>
                                <select id="rating_food" name="rating_food" value={formData.rating_food} onChange={handleChange}>
                                    <option value="">-</option>
                                    {ratingOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            {isDineIn && (
                                <>
                                    <div className="rating-item">
                                        <label htmlFor="rating_service">Service</label>
                                        <select id="rating_service" name="rating_service" value={formData.rating_service} onChange={handleChange}>
                                            <option value="">-</option>
                                            {ratingOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div className="rating-item">
                                        <label htmlFor="rating_ambience">Ambience</label>
                                        <select id="rating_ambience" name="rating_ambience" value={formData.rating_ambience} onChange={handleChange}>
                                            <option value="">-</option>
                                            {ratingOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}

                            {(isTakeout || isDelivery) && (
                                <div className="rating-item">
                                    <label htmlFor="rating_packaging">Packaging</label>
                                    <select id="rating_packaging" name="rating_packaging" value={formData.rating_packaging} onChange={handleChange}>
                                        <option value="">-</option>
                                        {ratingOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            )}

                            {isTakeout && (
                                <div className="rating-item">
                                    <label htmlFor="rating_store_service">Store Svc</label>
                                    <select id="rating_store_service" name="rating_store_service" value={formData.rating_store_service} onChange={handleChange}>
                                        <option value="">-</option>
                                        {ratingOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="rating-item">
                                <label htmlFor="rating_value">Value</label>
                                <select id="rating_value" name="rating_value" value={formData.rating_value} onChange={handleChange}>
                                    <option value="">-</option>
                                    {ratingOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Row 4: Return Intent & Experience */}
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="return_intent">Return?</label>
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
                        <div className="form-group" style={{ flex: 2 }}>
                            <label htmlFor="content">Experience</label>
                            <textarea
                                id="content"
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                rows={1}
                                style={{ resize: 'none', height: '38px', paddingTop: '8px' }}
                                placeholder="Thoughts..."
                            />
                        </div>
                    </div>

                    {/* Row 5: Photos & Tags */}
                    <div className="form-row compact-actions-row">
                        <div className="form-group compact-upload">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoUpload}
                                style={{ display: 'none' }}
                                id="photo-upload"
                            />
                            <label htmlFor="photo-upload" className="btn-secondary btn-sm">
                                📷 Photos ({photos.length})
                            </label>
                        </div>

                        <div className="form-group compact-tags">
                            <input
                                type="text"
                                value={friendSearch}
                                onChange={handleFriendSearch}
                                placeholder="Tag friends..."
                                className="compact-input"
                            />
                        </div>
                    </div>

                    {/* Previews & Tags Display */}
                    {(photoPreview.length > 0 || taggedFriends.length > 0) && (
                        <div className="compact-previews">
                            {photoPreview.map((preview, index) => (
                                <div key={index} className="mini-preview">
                                    <img src={preview} alt="preview" />
                                    <button type="button" onClick={() => removePhoto(index)}>×</button>
                                </div>
                            ))}
                            {taggedFriends.map((friend) => (
                                <div key={friend.id} className="mini-tag">
                                    <span>{friend.full_name}</span>
                                    <button type="button" onClick={() => removeTaggedFriend(friend.id)}>×</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {friendResults.length > 0 && (
                        <div className="friend-search-results compact-results">
                            {friendResults.map((friend) => (
                                <div
                                    key={friend.id}
                                    className="friend-result-item"
                                    onClick={() => addTaggedFriend(friend)}
                                >
                                    <div className="friend-name">{friend.full_name}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && <div className="error-message compact-error">{error}</div>}

                    <div className="modal-footer compact-footer">
                        <button type="button" onClick={onClose} className="btn-secondary">
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
