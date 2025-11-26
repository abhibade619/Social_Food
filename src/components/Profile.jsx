import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import LogCard from './LogCard';

const Profile = ({ onNavigate }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [userLogs, setUserLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        bio: '',
        website: '',
    });

    useEffect(() => {
        fetchProfile();
        fetchUserLogs();
        fetchFollowCounts();
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setProfile(data);
                setFormData({
                    username: data.username || '',
                    full_name: data.full_name || '',
                    bio: data.bio || '',
                    website: data.website || '',
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('logs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUserLogs(data || []);
        } catch (error) {
            console.error('Error fetching user logs:', error);
        }
    };

    const fetchFollowCounts = async () => {
        try {
            // Get follower count
            const { count: followerCount } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', user.id);

            setFollowerCount(followerCount || 0);

            // Get following count
            const { count: followingCount } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', user.id);

            setFollowingCount(followingCount || 0);
        } catch (error) {
            console.error('Error fetching follow counts:', error);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            // Create unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // Update profile with new avatar URL
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Refresh profile
            await fetchProfile();
            alert('Profile picture updated successfully!');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Failed to upload profile picture. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...formData,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            setProfile({ ...profile, ...formData });
            setEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    if (loading) {
        return <div className="loading">Loading profile...</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-avatar">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" />
                    ) : (
                        <div className="avatar-placeholder">
                            {(profile?.username || user.email)?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="profile-info">
                    {editing ? (
                        <form onSubmit={handleUpdate} className="profile-form">
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="full_name">Full Name</label>
                                <input
                                    id="full_name"
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="website">Website</label>
                                <input
                                    id="website"
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="bio">Bio</label>
                                <textarea
                                    id="bio"
                                    rows="4"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Tell us about yourself..."
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="avatar">Profile Picture</label>
                                <input
                                    id="avatar"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={uploading}
                                />
                                {uploading && <p className="upload-status">Uploading...</p>}
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-primary">Save</button>
                                <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <h2>{profile?.full_name || 'No name set'}</h2>
                            <p className="username">@{profile?.username || 'No username'}</p>
                            <p className="email">{user.email}</p>
                            {profile?.website && (
                                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="website">
                                    {profile.website}
                                </a>
                            )}
                            {profile?.bio && (
                                <p className="profile-bio">{profile.bio}</p>
                            )}
                            <button className="btn-primary" onClick={() => setEditing(true)}>
                                Edit Profile
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="profile-stats">
                <div className="stat">
                    <span className="stat-value">{userLogs.length}</span>
                    <span className="stat-label">Logs</span>
                </div>
                <div
                    className="stat stat-clickable"
                    onClick={() => onNavigate && onNavigate('followers')}
                    style={{ cursor: 'pointer' }}
                >
                    <span className="stat-value">{followerCount}</span>
                    <span className="stat-label">Followers</span>
                </div>
                <div
                    className="stat stat-clickable"
                    onClick={() => onNavigate && onNavigate('following')}
                    style={{ cursor: 'pointer' }}
                >
                    <span className="stat-value">{followingCount}</span>
                    <span className="stat-label">Following</span>
                </div>
            </div>

            <div className="profile-logs">
                <h3>My Logs</h3>
                {userLogs.length > 0 ? (
                    <div className="logs-grid">
                        {userLogs.map((log) => (
                            <LogCard key={log.id} log={log} />
                        ))}
                    </div>
                ) : (
                    <p className="no-logs">No logs yet. Start sharing your dining experiences!</p>
                )}
            </div>
        </div>
    );
};

export default Profile;
