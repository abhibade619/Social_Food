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
    const [visitedRestaurants, setVisitedRestaurants] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [activeTab, setActiveTab] = useState('logs'); // 'logs', 'visited', 'wishlist'
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        bio: '',
        website: '',
        is_wishlist_private: false,
    });

    // Cropper State
    const [showCropper, setShowCropper] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showAvatarView, setShowAvatarView] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchUserLogs();
            fetchVisited();
            fetchWishlist();
            fetchFollowCounts();
        }
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
                    is_wishlist_private: data.is_wishlist_private || false,
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

    const fetchVisited = async () => {
        try {
            const { data, error } = await supabase
                .from('visited_restaurants')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVisitedRestaurants(data || []);
        } catch (error) {
            console.error('Error fetching visited restaurants:', error);
        }
    };

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

    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Strict JPEG/JPG Check
        const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg' || /\.(jpg|jpeg)$/i.test(file.name);
        if (!isJpeg) {
            alert("Please upload the image in JPEG or JPG format");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImageSrc(reader.result);
            setShowCropper(true);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
        });
        reader.readAsDataURL(file);
        // Reset input
        e.target.value = null;
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            e.preventDefault();
            setCrop({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const getCroppedImg = async () => {
        try {
            const image = new Image();
            image.src = imageSrc;
            await new Promise(resolve => { image.onload = resolve; });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set fixed output size (e.g., 400x400 for avatars)
            canvas.width = 400;
            canvas.height = 400;

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Translate to center
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(zoom, zoom);
            ctx.translate(crop.x, crop.y);

            // Draw image centered
            ctx.drawImage(image, -image.width / 2, -image.height / 2);

            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.9);
            });
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const handleCropSave = async () => {
        if (!imageSrc) return;
        setUploading(true);

        try {
            const blob = await getCroppedImg();
            if (!blob) throw new Error("Failed to crop image");

            const fileExt = 'jpg';
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            await fetchProfile();
            window.dispatchEvent(new Event('profileUpdated'));
            setShowCropper(false);
            alert('Profile picture updated successfully!');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Failed to upload profile picture.');
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
            {/* Avatar View Modal */}
            {showAvatarView && profile?.avatar_url && (
                <div className="avatar-view-modal" onClick={() => setShowAvatarView(false)}>
                    <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="avatar-view-image"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                    />
                </div>
            )}

            {/* Cropper Modal */}
            {showCropper && (
                <div className="cropper-modal">
                    <div className="cropper-content">
                        <h3>Edit Profile Picture</h3>
                        <div
                            className="cropper-area"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <img
                                src={imageSrc}
                                alt="Crop"
                                style={{
                                    transform: `translate(${crop.x}px, ${crop.y}px) scale(${zoom})`,
                                    cursor: isDragging ? 'grabbing' : 'grab'
                                }}
                                draggable={false}
                            />
                        </div>
                        <div className="cropper-controls">
                            <label>Zoom</label>
                            <input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.1"
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="cropper-actions">
                            <button className="btn-secondary" onClick={() => setShowCropper(false)}>Cancel</button>
                            <button className="premium-button" onClick={handleCropSave} disabled={uploading}>
                                {uploading ? 'Saving...' : 'Save & Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="profile-header-premium profile-hero-gradient">
                <div className="profile-header-content">
                    <div className="profile-avatar-premium" onClick={() => !editing && profile?.avatar_url && setShowAvatarView(true)} style={{ cursor: !editing && profile?.avatar_url ? 'pointer' : 'default' }}>
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
                                <div className="file-input-wrapper">
                                    <input
                                        id="avatar"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        disabled={uploading}
                                        className="hidden-input"
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="avatar" className="file-input-label premium-input clickable">
                                        {uploading ? 'Uploading...' : (
                                            <>
                                                <span className="file-name">
                                                    {profile?.avatar_url
                                                        ? profile.avatar_url.split('/').pop().split('?')[0]
                                                        : 'Choose a file...'}
                                                </span>
                                                <span className="btn-secondary btn-sm">Change</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="premium-button">Save Changes</button>
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
                                    <span className="stat-value-premium">{userLogs.length}</span>
                                    <span className="stat-label-premium">Logs</span>
                                </div>
                                <div className="stat-item-premium">
                                    <span className="stat-value-premium">{visitedRestaurants.length}</span>
                                    <span className="stat-label-premium">Visited</span>
                                </div>
                                <div
                                    className="stat-item-premium clickable"
                                    onClick={() => onViewFollowers && onViewFollowers(user.id)}
                                >
                                    <span className="stat-value-premium">{followerCount}</span>
                                    <span className="stat-label-premium">Followers</span>
                                </div>
                                <div
                                    className="stat-item-premium clickable"
                                    onClick={() => onViewFollowing && onViewFollowing(user.id)}
                                >
                                    <span className="stat-value-premium">{followingCount}</span>
                                    <span className="stat-label-premium">Following</span>
                                </div>
                            </div>

                            <button className="premium-button btn-edit-profile-premium" onClick={() => setEditing(true)}>
                                Edit Profile
                            </button>
                        </>
                    )}
                </div>
            </div>

            {!editing && (
                <>
                    <div className="profile-tabs" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <button
                            className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('logs')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: activeTab === 'logs' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                padding: '1rem',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                borderBottom: activeTab === 'logs' ? '2px solid var(--primary-color)' : 'none'
                            }}
                        >
                            Logs
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'visited' ? 'active' : ''}`}
                            onClick={() => setActiveTab('visited')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: activeTab === 'visited' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                padding: '1rem',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                borderBottom: activeTab === 'visited' ? '2px solid var(--primary-color)' : 'none'
                            }}
                        >
                            Visited
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'wishlist' ? 'active' : ''}`}
                            onClick={() => setActiveTab('wishlist')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: activeTab === 'wishlist' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                padding: '1rem',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                borderBottom: activeTab === 'wishlist' ? '2px solid var(--primary-color)' : 'none'
                            }}
                        >
                            Wishlist
                        </button>
                    </div>

                    <div className="profile-content">
                        {activeTab === 'logs' && (
                            <div className="profile-logs-section">
                                {userLogs.length > 0 ? (
                                    <div className="logs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', justifyContent: 'start' }}>
                                        {userLogs.map((log) => (
                                            <LogCard key={log.id} log={log} isDiaryView={true} profileOwner={user} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-logs">No logs yet. Start sharing your dining experiences!</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'visited' && (
                            <div className="visited-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                {visitedRestaurants.length > 0 ? (
                                    visitedRestaurants.map((place) => (
                                        <div key={place.id} className="visited-card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{place.restaurant_name}</h3>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{place.location}</p>
                                            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                                <button
                                                    className="btn-secondary btn-sm"
                                                    onClick={() => onNavigate && onNavigate('restaurant', {
                                                        selectedRestaurant: {
                                                            place_id: place.place_id,
                                                            name: place.restaurant_name,
                                                            address: place.location
                                                        }
                                                    })}
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-logs" style={{ gridColumn: '1/-1', textAlign: 'center' }}>
                                        No visited restaurants marked yet.
                                    </p>
                                )}
                            </div>
                        )}

                        {activeTab === 'wishlist' && (
                            <div className="profile-logs-section">
                                <div className="wishlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                    {wishlist.length > 0 ? (
                                        wishlist.map((place) => (
                                            <div key={place.id} className="wishlist-card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{place.restaurant_name}</h3>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{place.location}</p>
                                                <p style={{ color: 'var(--primary-color)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{place.cuisine}</p>
                                                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                                    <button
                                                        className="btn-secondary btn-sm"
                                                        onClick={() => onNavigate && onNavigate('restaurant', {
                                                            selectedRestaurant: {
                                                                place_id: place.place_id,
                                                                name: place.restaurant_name,
                                                                address: place.location
                                                            }
                                                        })}
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="no-logs" style={{ gridColumn: '1/-1', textAlign: 'center' }}>
                                            Your wishlist is empty.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Profile;
