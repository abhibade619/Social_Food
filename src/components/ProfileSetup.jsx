import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';

const ProfileSetup = ({ onComplete }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
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

            // Create or update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: formData.username.toLowerCase(),
                    full_name: formData.full_name,
                    bio: formData.bio || null,
                    updated_at: new Date().toISOString(),
                });

            if (updateError) throw updateError;

            onComplete();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-setup-container">
            <div className="profile-setup-card">
                <div className="profile-setup-header">
                    <h1>👋 Welcome to FoodSocial!</h1>
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
