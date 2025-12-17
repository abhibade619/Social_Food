import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';

const ProfileSetup = ({ onComplete }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        username: user?.user_metadata?.username || '',
        full_name: '',
        bio: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.full_name.trim()) {
            setError('Full Name is required.');
            return;
        }

        setLoading(true);

        try {
            // Check if username is already taken
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', formData.username.toLowerCase())
                .single();

            if (existingUser) {
                setError('Username already taken. Please choose another.');
                setLoading(false);
                return;
            }

            // Prepare profile data
            const profileData = {
                id: user.id,
                username: formData.username.toLowerCase(),
                full_name: formData.full_name,
                updated_at: new Date().toISOString(),
            };

            // Only add bio if it's not empty, but if the column is missing, this will still fail.
            // We'll try to insert with bio first (if provided), and if it fails with specific error, retry without.
            if (formData.bio) {
                profileData.bio = formData.bio;
            }

            try {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .upsert(profileData);

                if (updateError) throw updateError;
            } catch (upsertError) {
                // If error is about missing column 'bio', retry without it
                if (upsertError.message?.includes('bio') || upsertError.message?.includes('column')) {
                    console.warn("Bio column missing or error, retrying without bio:", upsertError);
                    delete profileData.bio;
                    const { error: retryError } = await supabase
                        .from('profiles')
                        .upsert(profileData);
                    if (retryError) throw retryError;
                } else {
                    throw upsertError;
                }
            }

            onComplete();
        } catch (err) {
            console.error("Profile setup error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-setup-container">
            <div className="profile-setup-card">
                <div className="profile-setup-header">
                    <h1>👋 Welcome to Khrunch!</h1>
                    <p>Let's set up your profile</p>
                </div>

                <form onSubmit={handleSubmit} className="profile-setup-form">
                    <div className="form-group">
                        <label htmlFor="username">Username *</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Choose a unique username"
                            required
                            pattern="[a-zA-Z0-9_]{3,20}"
                            title="3-20 characters, letters, numbers, and underscores only"
                        />
                        <small>This will be your @username</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="full_name">Full Name *</label>
                        <input
                            id="full_name"
                            name="full_name"
                            type="text"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="Your full name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio">Bio (Optional)</label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell us about yourself..."
                            rows={3}
                            maxLength={160}
                        />
                        <small>{formData.bio.length}/160 characters</small>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creating Profile...' : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetup;
