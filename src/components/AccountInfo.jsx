import { useAuth } from '../context/AuthProvider';

const AccountInfo = () => {
    const { user } = useAuth();

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="account-info-container">
            <h2>Account Information</h2>

            <div className="info-card">
                <div className="info-section">
                    <h3>Profile Details</h3>
                    <div className="info-row">
                        <span className="info-label">Email:</span>
                        <span className="info-value">{user?.email || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">User ID:</span>
                        <span className="info-value info-value-mono">{user?.id || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Account Created:</span>
                        <span className="info-value">{formatDate(user?.created_at)}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Last Sign In:</span>
                        <span className="info-value">{formatDate(user?.last_sign_in_at)}</span>
                    </div>
                </div>

                <div className="info-section">
                    <h3>Account Status</h3>
                    <div className="info-row">
                        <span className="info-label">Email Verified:</span>
                        <span className={`info-badge ${user?.email_confirmed_at ? 'badge-success' : 'badge-warning'}`}>
                            {user?.email_confirmed_at ? '✓ Verified' : '⚠ Not Verified'}
                        </span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Account Type:</span>
                        <span className="info-badge badge-info">Standard</span>
                    </div>
                </div>
            </div>

            <div className="info-actions">
                <p className="info-note">
                    Need to update your profile? Go to the <strong>Profile</strong> page to edit your username, name, and other details.
                </p>
            </div>
        </div>
    );
};

export default AccountInfo;
