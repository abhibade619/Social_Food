import { useState } from 'react';
import { useAuth } from '../context/AuthProvider';

const Auth = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signUp, isSupabaseConfigured } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isSignUp) {
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
                    <h1 className="auth-title">FoodSocial</h1>
                    <p className="auth-subtitle">
                        {isSignUp ? 'Join the exclusive culinary circle.' : 'Welcome back, connoisseur.'}
                    </p>
                </div>

                {!isSupabaseConfigured && (
                    <div className="config-warning">
                        <strong>⚠️ Configuration Required</strong>
                        <p>Please update your <code>.env</code> file with valid Supabase credentials.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    {isSignUp && (
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <div className="input-wrapper">
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="@username"
                                    required
                                    className="auth-input"
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <div className="input-wrapper">
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                                className="auth-input"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="auth-input"
                            />
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                        {loading ? <div className="loading-spinner-small"></div> : (isSignUp ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                <div className="auth-footer">
                    <p className="auth-switch-text">
                        {isSignUp ? 'Already a member?' : "New to FoodSocial?"}
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                        }}
                        className="auth-switch-btn"
                    >
                        {isSignUp ? 'Sign In' : "Create Account"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
