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

    // Cropper State
    const [showCropper, setShowCropper] = useState(false);
    onChange = {(e) => setFormData({ ...formData, username: e.target.value })}
className = "premium-input"
    />
                            </div >
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
                        </form >
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
                </div >
            </div >

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
        </div >
    );
};

export default Profile;
