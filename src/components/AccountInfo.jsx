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
            <div className="section-header-premium">
                <h2>Account Information</h2>
            </div>

            <div className="account-grid">
                <div className="info-summary-card">
                    <h3>Profile Details</h3>
                    <div className="info-row-premium">
                        <span className="info-label-premium">
                            <span className="info-icon">📧</span> Email
                        </span>
                        <span className="info-value">{user?.email || 'N/A'}</span>
                    </div>
                    <div className="info-row-premium">
                        <span className="info-label-premium">
                            <span className="info-icon">🆔</span> User ID
                        </span>
                        <span className="info-value info-value-mono" style={{ fontSize: '0.8rem' }}>{user?.id?.substring(0, 8)}...</span>
                    </div>
                    <div className="info-row-premium">
                        <span className="info-label-premium">
                            <span className="info-icon">📅</span> Joined
                        </span>
                        <span className="info-value">{formatDate(user?.created_at)}</span>
                    </div>
                    <div className="info-row-premium">
                        <span className="info-label-premium">
                            <span className="info-icon">🕒</span> Last Seen
                        </span>
                        <span className="info-value">{formatDate(user?.last_sign_in_at)}</span>
                    </div>
                </div>

                <div className="info-summary-card">
                    <h3>Account Status</h3>
                    <div className="info-row-premium">
                        <span className="info-label-premium">
                            <span className="info-icon">🛡️</span> Verification
                        </span>
                        <span className={`premium-badge ${user?.email_confirmed_at ? 'success' : 'warning'}`}>
                            {user?.email_confirmed_at ? 'Verified' : 'Unverified'}
                        </span>
                    </div>
                    <div className="info-row-premium">
                        <span className="info-label-premium">
                            <span className="info-icon">👤</span> Type
                        </span>
                        <span className="premium-badge info">Standard</span>
                    </div>
                </div>
            </div>

            <div className="info-actions" style={{ marginTop: '2rem' }}>
                <p className="info-note">
                    Need to update your profile? Go to the <strong>Profile</strong> page to edit your username, name, and other details.
                </p>
            </div>
        </div>
    );
};

export default AccountInfo;
