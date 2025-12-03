import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import LogCard from './LogCard';
import heic2any from 'heic2any';

const Profile = ({ onNavigate, onViewFollowers, onViewFollowing }) => {
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
            // Fetch user's own logs
            const { data: ownLogs, error: ownError } = await supabase
                .from('logs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (ownError) throw ownError;

            // Fetch logs where user is tagged AND accepted
            const { data: taggedData, error: taggedError } = await supabase
                .from('tagged_users')
                .select('log_id')
                .eq('user_id', user.id)
                .eq('show_in_diary', true);

            if (taggedError) throw taggedError;

            let taggedLogs = [];
            if (taggedData && taggedData.length > 0) {
                const taggedLogIds = taggedData.map(t => t.log_id);
                const { data: taggedLogsData, error: taggedLogsError } = await supabase
                    .from('logs')
                    .select('*')
                    .in('id', taggedLogIds)
                    .order('created_at', { ascending: false });

                if (!taggedLogsError && taggedLogsData) {
                    taggedLogs = taggedLogsData;
                }
            }

            // Combine and sort
            const allLogs = [...(ownLogs || []), ...taggedLogs];
            // Deduplicate based on ID just in case
            const uniqueLogs = Array.from(new Map(allLogs.map(log => [log.id, log])).values());

            uniqueLogs.sort((a, b) => new Date(b.visit_date || b.created_at) - new Date(a.visit_date || a.created_at));

            setUserLogs(uniqueLogs);
        } catch (error) {
            console.error('Error fetching user logs:', error);
        }
    };

    const fetchFollowCounts = async () => {
        try {
            const { count: followers } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', user.id);

            const { count: following } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', user.id);

            setFollowerCount(followers || 0);
            setFollowingCount(following || 0);
        } catch (error) {
            console.error('Error fetching follow counts:', error);
        }
    };

    const handleAvatarUpload = async (e) => {
        console.log("handleAvatarUpload triggered");
        let file = e.target.files[0];
        if (!file) {
            console.log("No file selected");
            return;
        }
        console.log("Original file:", file.name, file.type, file.size);

        // HEIC Conversion Logic
        if (file.type === "image/heic" || file.name.toLowerCase().endsWith('.heic')) {
            console.log("HEIC file detected, starting conversion...");
            try {
                setUploading(true); // Show loading state during conversion
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: "image/jpeg",
                    quality: 0.8
                });

                // Handle case where heic2any returns an array (for multi-image HEIC)
                const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

                // Create a new File object from the blob
                file = new File([blob], file.name.replace(/\.heic$/i, ".jpg"), {
                    type: "image/jpeg"
                });
                console.log("HEIC conversion successful. New file:", file.name, file.type, file.size);
            } catch (error) {
                console.error("HEIC conversion failed:", error);
                alert("Failed to process HEIC image. Please try a JPEG or PNG.");
                setUploading(false);
                return;
            }
        }

        // Validate file type (now checks converted file)
        if (!file.type.startsWith('image/')) {
            console.error("Invalid file type:", file.type);
            alert('Please upload an image file');
            setUploading(false);
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            console.error("File too large:", file.size);
            alert('File size must be less than 5MB');
            setUploading(false);
            return;
        }

        setUploading(true);
        try {
            // Create unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            console.log("Uploading to Supabase Storage:", fileName);

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                console.error("Supabase Storage Upload Error:", uploadError);
                throw uploadError;
            }
            console.log("Upload successful:", uploadData);

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            console.log("Public URL retrieved:", publicUrl);

            // Update profile with new avatar URL
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) {
                console.error("Profile Update Error:", updateError);
                throw updateError;
            }

            console.log("Profile updated successfully");

            // Refresh profile
            await fetchProfile();

            // Dispatch event to update Navbar
            window.dispatchEvent(new Event('profileUpdated'));

            alert('Profile picture updated successfully!');
        } catch (error) {
            console.error('Error uploading avatar (Catch Block):', error);
            alert(`Failed to upload profile picture: ${error.message || error.error_description || 'Unknown error'}`);
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
        <div className="profile-container-premium">
            <div className="profile-header-premium profile-hero-gradient">
                <div className="profile-header-content">
                    <div className="profile-avatar-premium">
                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Profile"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`;
                                }}
                            />
                        ) : (
                            <div className="avatar-placeholder-premium">
                                {(profile?.username || user.email)?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>

                    {editing ? (
                        <form onSubmit={handleUpdate} className="profile-form glass-panel">
                            {/* Form content remains same but wrapped in glass-panel */}
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="premium-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="full_name">Full Name</label>
                                <input
                                    id="full_name"
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="premium-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="website">Website</label>
                                <input
                                    id="website"
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    className="premium-input"
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
                                    className="premium-input"
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
                                    className="premium-input"
                                />
                                {uploading && <p className="upload-status">Uploading...</p>}
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="premium-button">Save</button>
                                <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <h2 className="profile-name-premium">{profile?.full_name || 'No name set'}</h2>
                            <p className="profile-username-premium">@{profile?.username || 'No username'}</p>

                            {profile?.bio && (
                                <p className="profile-bio-premium">{profile.bio}</p>
                            )}

                            <div className="profile-stats-premium">
                                <div className="stat-item-premium">
                                    <span className="stat-icon">📝</span>
                                    <span className="stat-value-premium">{userLogs.length}</span>
                                    <span className="stat-label-premium">Logs</span>
                                </div>
                                <div
                                    className="stat-item-premium clickable"
                                    onClick={() => onViewFollowers && onViewFollowers(user.id)}
                                >
                                    <span className="stat-icon">👥</span>
                                    <span className="stat-value-premium">{followerCount}</span>
                                    <span className="stat-label-premium">Followers</span>
                                </div>
                                <div
                                    className="stat-item-premium clickable"
                                    onClick={() => onViewFollowing && onViewFollowing(user.id)}
                                >
                                    <span className="stat-icon">👣</span>
                                    <span className="stat-value-premium">{followingCount}</span>
                                    <span className="stat-label-premium">Following</span>
                                </div>
                            </div>

                            <button className="btn-edit-profile-premium" onClick={() => setEditing(true)}>
                                Edit Profile
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="profile-logs">
                <h3 className="profile-section-title">My Logs</h3>
                {userLogs.length > 0 ? (
                    <div className="logs-grid">
                        {userLogs.map((log) => (
                            <LogCard key={log.id} log={log} isDiaryView={true} profileOwner={user} />
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
