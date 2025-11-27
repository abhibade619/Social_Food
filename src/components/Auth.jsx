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
            <div className="auth-card">
                <h1 className="auth-title">FoodSocial</h1>
                <p className="auth-subtitle">
                    {isSignUp ? 'Join the exclusive food community.' : 'Welcome back, connoisseur.'}
                </p>

                {!isSupabaseConfigured && (
                    <div className="config-warning">
                        <strong>⚠️ Configuration Required</strong>
                        <p>Please update your <code>.env</code> file with valid Supabase credentials.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    {isSignUp && (
                        <div className="form-group">
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && <div className="error-message" style={{ color: 'var(--accent-color)' }}>{error}</div>}
                    {success && <div className="success-message" style={{ color: 'var(--primary-color)' }}>{success}</div>}

                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px' }} disabled={loading}>
                        {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer" style={{ marginTop: '20px' }}>
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                        }}
                        className="nav-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
