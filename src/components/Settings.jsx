import { useState } from 'react';

const Settings = ({ onNavigate }) => {
    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: false,
        publicProfile: true,
        showLocation: true,
    });

    const handleToggle = (key) => {
        setSettings((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
        // In a real app, you'd save this to the database
    };

    return (
        <div className="settings-container settings-panel">
            <div className="section-header-premium">
                <h2>Settings</h2>
            </div>

            <div className="settings-card">
                <h3>Notifications</h3>
                <div className="setting-item">
                    <div className="setting-info">
                        <p className="setting-label">Email Notifications</p>
                        <p className="setting-description">Receive email updates about your activity</p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.emailNotifications}
                            onChange={() => handleToggle('emailNotifications')}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="setting-item">
                    <div className="setting-info">
                        <p className="setting-label">Push Notifications</p>
                        <p className="setting-description">Get notified about new followers and likes</p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.pushNotifications}
                            onChange={() => handleToggle('pushNotifications')}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div className="settings-card">
                <h3>Privacy</h3>
                <div className="setting-item">
                    <div className="setting-info">
                        <p className="setting-label">Public Profile</p>
                        <p className="setting-description">Allow others to view your profile</p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.publicProfile}
                            onChange={() => handleToggle('publicProfile')}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="setting-item">
                    <div className="setting-info">
                        <p className="setting-label">Show Location</p>
                        <p className="setting-description">Display your location on your profile</p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.showLocation}
                            onChange={() => handleToggle('showLocation')}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div className="settings-card">
                <h3>Account Management</h3>
                <div className="account-actions">
                    <button
                        className="btn-secondary settings-button"
                        onClick={() => onNavigate && onNavigate('change-password')}
                    >
                        Change Password
                    </button>
                    <button className="btn-secondary settings-button">Download My Data</button>
                </div>

                <div className="danger-zone">
                    <p className="danger-text">Danger Zone</p>
                    <button className="btn-delete-account">
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
