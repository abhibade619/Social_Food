import { useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { supabase } from '../supabaseClient';
import Logo from './Logo';

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
                // Check if username already exists
                const { data: existingUser, error: checkError } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('username', username)
                    .single();

                if (existingUser) {
                    throw new Error("This username is already taken. Please choose another one.");
                }

                // Check if email already exists using RPC
                const { data: emailExists, error: emailCheckError } = await supabase
                    .rpc('check_email_exists', { email_input: email });

                if (emailExists) {
                    throw new Error("This email already exists. Please sign in instead.");
                }

                const { error } = await signUp(email, password, username);
                if (error) {
                    if (error.message.includes("User already registered") || error.message.includes("unique constraint")) {
                        throw new Error("This email already exists. Please sign in instead.");
                    }
                    throw error;
                }

                // Show success message
                setSuccess('✅ Account created! Please check your email for a confirmation link before signing in.');
                setEmail('');
                setPassword('');
                setUsername('');

                // Redirect to sign-in view after 3 seconds
                setTimeout(() => {
                    setIsSignUp(false);
                    setSuccess('');
                    setError('');
                }, 3000);

                // No auto-redirect. User must confirm email first.
            } else {
                let signInEmail = email;
                // Check if input is an email
                const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

                if (!isEmail) {
                    // Try to resolve username to email
                    const { data: resolvedEmail, error: resolveError } = await supabase
                        .rpc('get_email_by_username', { username_input: email });

                    if (resolveError || !resolvedEmail) {
                        throw new Error("Username not found or invalid credentials.");
                    }
                    signInEmail = resolvedEmail;
                }

                const { error } = await signIn(signInEmail, password);
                if (error) throw error;
            }
        } catch (err) {
            console.error("Auth error:", err);
            if (err.message.includes("Email not confirmed")) {
                setError("⚠️ Please verify your email address. Check your inbox for the confirmation link.");
            } else {
                setError(err.message);
            }
            setSuccess('');
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="auth-card glass-panel fade-in">
            <div className="auth-header">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <Logo height="70px" style={{ width: 'auto', maxWidth: '80%' }} />
                </div>
                <p className="auth-tagline">Savor every moment.</p>
                <p className="auth-subtitle">
                    {isResetPassword
                        ? 'Recover your account.'
                        : (isSignUp ? 'Join the exclusive culinary circle.' : 'Welcome back, foodie.')}
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
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label htmlFor="username" style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose a username"
                            required
                            className="premium-input"
                            style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', padding: '0.8rem' }}
                        />
                    </div>
                )}

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>
                        {isSignUp ? 'Email Address' : 'Email or Username'}
                    </label>
                    <input
                        id="email"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={isSignUp ? "Enter your email address" : "Enter your email or username"}
                        required
                        className="premium-input"
                        style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', padding: '0.8rem' }}
                    />
                </div>

                {!isResetPassword && (
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Password</label>
                        <div className="password-input-wrapper" style={{ position: 'relative' }}>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                minLength={6}
                                className="premium-input"
                                style={{ paddingRight: '40px', background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', padding: '0.8rem' }}
                            />
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
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px'
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
                            <div className="forgot-password-link" style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    className="text-link-btn"
                                    onClick={() => {
                                        setIsResetPassword(true);
                                        setError('');
                                        setSuccess('');
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {error && <div className="error-message" style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
                {success && <div className="success-message" style={{ color: '#4caf50', marginBottom: '1rem', fontSize: '0.9rem' }}>{success}</div>}

                <button type="submit" className="premium-button auth-submit-btn" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
                    {loading ? 'Processing...' : (
                        isResetPassword ? 'Send Reset Link' : (isSignUp ? 'Create Account' : 'Sign In')
                    )}
                </button>
            </form>

            <div className="auth-footer" style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                {isResetPassword ? (
                    <button
                        type="button"
                        onClick={() => {
                            setIsResetPassword(false);
                            setError('');
                            setSuccess('');
                        }}
                        className="auth-switch-btn"
                        style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '600' }}
                    >
                        Back to Sign In
                    </button>
                ) : (
                    <>
                        <p className="auth-switch-text" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            {isSignUp ? 'Already a member?' : "New to Khrunch?"}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError('');
                                setSuccess('');
                            }}
                            className="auth-switch-btn"
                            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '700', fontSize: '1.1rem' }}
                        >
                            {isSignUp ? 'Sign In' : "Create Account"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Auth;
