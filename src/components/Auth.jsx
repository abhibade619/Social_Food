import { useState } from 'react';
import { useAuth } from '../context/AuthProvider';

const Auth = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signIn, signUp, resetPassword, isSupabaseConfigured } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isResetPassword) {
                const { error } = await resetPassword(email);
                if (error) throw error;
                setSuccess('✅ Password reset link sent! Check your email.');
                // Don't clear email so they can see where it went
            } else if (isSignUp) {
                const { error } = await signUp(email, password, username);
                if (error) throw error;

                // Show success message
                setSuccess('✅ Account created! Please check your email for a confirmation link.');
                setEmail('');
                setPassword('');
                setUsername('');

                // Switch to sign in after 3 seconds
                setTimeout(() => {
                    setIsSignUp(false);
                    setSuccess('');
                }, 5000);
            } else {
                const { error } = await signIn(email, password);
                if (error) throw error;
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass-panel fade-in">
                <div className="auth-header">
                    <h1 className="auth-title premium-gradient-text">FoodSocial</h1>
                    <p className="auth-tagline">Savor every moment.</p>
                    <p className="auth-subtitle">
                        {isResetPassword
                            ? 'Recover your account.'
                            : (isSignUp ? 'Join the exclusive culinary circle.' : 'Welcome back, connoisseur.')}
                    </p>
                </div>

                {!isSupabaseConfigured && (
                    <div className="config-warning">
                        <strong>⚠️ Configuration Required</strong>
                        <p>Please update your <code>.env</code> file with valid Supabase credentials.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    {isSignUp && !isResetPassword && (
                        <div className="form-group floating-label-group">
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder=" "
                                required
                                className="premium-input"
                            />
                            <label htmlFor="username" className="floating-label">Username</label>
                        </div>
                    )}

                    <div className="form-group floating-label-group">
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder=" "
                            required
                            className="premium-input"
                        />
                        <label htmlFor="email" className="floating-label">Email Address</label>
                    </div>

                    {!isResetPassword && (
                        <div className="form-group floating-label-group">
                            <div className="password-input-wrapper" style={{ position: 'relative' }}>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder=" "
                                    required
                                    minLength={6}
                                    className="premium-input"
                                    style={{ paddingRight: '40px' }}
                                />
                                <label htmlFor="password" className="floating-label">Password</label>
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        zIndex: 10
                                    }}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    )}
                                </button>
                            </div>

                            {!isSignUp && (
                                <div className="forgot-password-link">
                                    <button
                                        type="button"
                                        className="text-link-btn"
                                        onClick={() => {
                                            setIsResetPassword(true);
                                            setError('');
                                            setSuccess('');
                                        }}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <button type="submit" className="premium-button auth-submit-btn" disabled={loading}>
                        {loading ? <div className="loading-spinner-small"></div> : (
                            isResetPassword ? 'Send Reset Link' : (isSignUp ? 'Create Account' : 'Sign In')
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    {isResetPassword ? (
                        <button
                            type="button"
                            onClick={() => {
                                setIsResetPassword(false);
                                setError('');
                                setSuccess('');
                            }}
                            className="auth-switch-btn"
                        >
                            Back to Sign In
                        </button>
                    ) : (
                        <>
                            <p className="auth-switch-text">
                                {isSignUp ? 'Already a member?' : "New to FoodSocial?"}
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError('');
                                    setSuccess('');
                                }}
                                className="auth-switch-btn"
                            >
                                {isSignUp ? 'Sign In' : "Create Account"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;
