// HEIC Conversion Logic
if (file.type === "image/heic" || file.name.toLowerCase().endsWith('.heic')) {
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
    } catch (error) {
        console.error("HEIC conversion failed:", error);
        alert("Failed to process HEIC image. Please try a JPEG or PNG.");
        setUploading(false);
        return;
    }
}

// Validate file type (now checks converted file)
if (!file.type.startsWith('image/')) {
    alert('Please upload an image file');
    setUploading(false);
    return;
}

// Validate file size (max 5MB)
if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB');
    setUploading(false);
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

    // Dispatch event to update Navbar
    window.dispatchEvent(new Event('profileUpdated'));

    alert('Profile picture updated successfully!');
} catch (error) {
    console.error('Error uploading avatar:', error);
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


