import { useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { supabase } from '../supabaseClient';

const AccountInfo = ({ onNavigate }) => {
    const { user } = useAuth();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'permanently delete') return;

        setIsDeleting(true);
        try {
            const { error } = await supabase.rpc('delete_user');
            if (error) throw error;
            await supabase.auth.signOut();
            window.location.href = '/';
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Failed to delete account. Please try again or contact support.');
        } finally {
            setIsDeleting(false);
        }
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

            <div className="account-management-section" style={{ marginTop: '3rem' }}>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Account Management</h3>

                <div className="management-actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        className="premium-button"
                        onClick={() => onNavigate('change-password')}
                        style={{ maxWidth: '300px' }}
                    >
                        Change Password
                    </button>

                    <button
                        className="delete-account-btn"
                        onClick={() => setShowDeleteModal(true)}
                        style={{ maxWidth: '300px' }}
                    >
                        Delete Account
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="delete-confirmation-modal glass-panel">
                        <h3 className="text-danger">Delete Account</h3>
                        <p>Are you sure you want to delete your account? This action is irreversible and will permanently remove all your data.</p>

                        <div className="confirmation-input-wrapper">
                            <label>Type <strong>permanently delete</strong> to confirm:</label>
                            <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                className="premium-input"
                                placeholder="permanently delete"
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmation('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-danger"
                                disabled={deleteConfirmation !== 'permanently delete' || isDeleting}
                                onClick={handleDeleteAccount}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountInfo;
