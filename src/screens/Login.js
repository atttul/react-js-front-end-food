import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Login() {
    const [credentials, setCredentials] = useState({ email: "", password: "", phone: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Step 1: Fetch user auth token
            const userKeyResponse = await fetch(`${process.env.REACT_APP_BASE_URL}/fetch/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const userKey = await userKeyResponse.json();

            if (!userKey.success) {
                setError(userKey.message || "Invalid credentials. Please check your details and try again.");
                setLoading(false);
                return;
            }

            // Step 2: Perform actual login
            const loginResponse = await fetch(`${process.env.REACT_APP_BASE_URL}/login/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userKey.data}`
                },
                body: JSON.stringify(credentials)
            });

            const loginData = await loginResponse.json();
            
            if (!loginData.success) {
                setError(loginData.message || "Login failed. Please verify your credentials.");
                setLoading(false);
                return;
            }
            
            localStorage.setItem("loggedInUserName", loginData.data?.name || "Foodie"); 
            
            navigate('/otp-verify', { state: { credentials: credentials } });
        } catch (err) {
            console.error("Login Error:", err);
            setError("Unable to connect to server. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const onChange = (event) => {
        setCredentials({ ...credentials, [event.target.name]: event.target.value });
    };

    const handleSocialLogin = (provider) => {
        setError(`${provider} login is integrated with OAuth. Please complete standard credentials or OTP to proceed.`);
    };



    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            
            <div className="container px-2 px-sm-3 d-flex justify-content-center align-items-center flex-grow-1 py-3 py-md-5">
                <div className="card auth-wrapper w-100 border-0 overflow-hidden" style={{ maxWidth: '960px' }}>
                    <div className="row g-0">
                        
                        {/* Left Panel - Branding & Highlights (Desktop & Tablet) */}
                        <div className="col-md-5 d-none d-md-flex auth-hero-panel">
                            <div className="auth-hero-overlay"></div>
                            
                            <div className="position-relative z-1">
                                <span className="auth-badge mb-3">
                                    <i className="bi bi-fire"></i> Fresh & Hot Delivery
                                </span>
                                <h2 className="fw-extrabold text-white display-6 mb-3">
                                    Taste the extraordinary, delivered daily.
                                </h2>
                                <p className="text-white-50 small leading-relaxed mb-4">
                                    Access exclusive gourmet deals, track live order status, and satisfy your cravings in minutes.
                                </p>
                            </div>

                            <div className="position-relative z-1 mt-auto pt-4 border-top border-secondary border-opacity-50">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="d-flex text-warning fs-5">
                                        <i className="bi bi-star-fill"></i>
                                        <i className="bi bi-star-fill"></i>
                                        <i className="bi bi-star-fill"></i>
                                        <i className="bi bi-star-fill"></i>
                                        <i className="bi bi-star-fill"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-white small">4.9 / 5.0 Rating</div>
                                        <div className="text-white-50 extra-small" style={{ fontSize: '0.75rem' }}>Trusted by 50,000+ food lovers</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Header Banner (< 768px) */}
                        <div className="d-md-none text-center auth-mobile-header p-4 bg-dark bg-opacity-40 border-bottom border-secondary border-opacity-40">
                            <span className="auth-badge mb-2">
                                <i className="bi bi-fire"></i> Mern Dine
                            </span>
                            <h4 className="fw-bold text-white mb-1">Welcome Back</h4>
                            <p className="text-muted small mb-0">Sign in to order your favorite dishes</p>
                        </div>

                        {/* Right Panel - Login Form */}
                        <div className="col-md-7 p-3 p-sm-4 p-lg-5 d-flex flex-column justify-content-center">
                            <div className="mb-3 mb-sm-4 d-none d-md-block">
                                <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-dark border border-secondary mb-3 text-warning">
                                    <i className="bi bi-person-lock fs-3"></i>
                                </div>
                                <h3 className="fw-bold text-white mb-1">Welcome Back</h3>
                                <p className="text-muted small mb-0">Sign in to manage orders & express checkout</p>
                            </div>

                            {/* Alert Banner */}
                            {error && (
                                <div className="alert auth-error-alert alert-dismissible fade show p-3 mb-3 mb-sm-4 text-start w-100" role="alert">
                                    <div className="d-flex align-items-start gap-2">
                                        <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0 mt-0.5"></i>
                                        <div className="small fw-medium">{error}</div>
                                    </div>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setError(null)}></button>
                                </div>
                            )}


                            <form onSubmit={handleSubmit}>
                                {/* Email Field */}
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label text-white-50 fw-semibold small">
                                        Email Address
                                    </label>
                                    <div className="input-group auth-input-group">
                                        <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="email"
                                            name="email"
                                            placeholder="name@example.com"
                                            value={credentials.email}
                                            onChange={onChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Field with Toggle */}
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label htmlFor="password" className="form-label text-white-50 fw-semibold small mb-0">
                                            Password
                                        </label>
                                        <Link
                                            to="/forgot-password"
                                            className="text-warning text-decoration-none extra-small"
                                            style={{ fontSize: '0.8rem' }}
                                        >
                                            Forgot password?
                                        </Link>

                                    </div>
                                    <div className="input-group auth-input-group">
                                        <span className="input-group-text"><i className="bi bi-shield-lock"></i></span>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="form-control"
                                            id="password"
                                            name="password"
                                            placeholder="Enter your password"
                                            value={credentials.password}
                                            onChange={onChange}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="btn password-toggle-btn input-group-text"
                                            onClick={() => setShowPassword(!showPassword)}
                                            title={showPassword ? "Hide Password" : "Show Password"}
                                        >
                                            <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                                        </button>
                                    </div>
                                </div>

                                {/* Phone Field */}
                                <div className="mb-3">
                                    <label htmlFor="phone" className="form-label text-white-50 fw-semibold small">
                                        Phone Number <span className="text-muted fw-normal">(For OTP verification)</span>
                                    </label>
                                    <div className="input-group auth-input-group">
                                        <span className="input-group-text"><i className="bi bi-telephone"></i></span>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            id="phone"
                                            name="phone"
                                            placeholder="10-digit mobile number"
                                            value={credentials.phone}
                                            onChange={onChange}
                                            pattern="[0-9]{10}"
                                            maxLength="10"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Remember Me */}
                                <div className="form-check mb-3 mb-sm-4">
                                    <input
                                        className="form-check-input bg-dark border-secondary"
                                        type="checkbox"
                                        id="rememberMe"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <label className="form-check-label text-white-50 small" htmlFor="rememberMe">
                                        Keep me logged in on this device
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="btn btn-brand w-100 py-2.5 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 mb-3"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            <span>Authenticating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign In & Continue</span>
                                            <i className="bi bi-arrow-right-short fs-5"></i>
                                        </>
                                    )}
                                </button>

                                {/* Social Login Divider */}
                                <div className="auth-divider">
                                    <span>or sign in with</span>
                                </div>

                                {/* Social Buttons */}
                                <div className="row g-2 mb-3 mb-sm-4">
                                    <div className="col-6">
                                        <button
                                            type="button"
                                            className="btn btn-social w-100"
                                            onClick={() => handleSocialLogin('Google')}
                                        >
                                            <i className="bi bi-google text-danger fs-6"></i>
                                            <span>Google</span>
                                        </button>
                                    </div>
                                    <div className="col-6">
                                        <button
                                            type="button"
                                            className="btn btn-social w-100"
                                            onClick={() => handleSocialLogin('Apple')}
                                        >
                                            <i className="bi bi-apple text-white fs-6"></i>
                                            <span>Apple</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Bottom Link */}
                                <div className="text-center pt-2 border-top border-secondary border-opacity-50">
                                    <span className="text-muted small me-2">New to Mern Dine?</span>
                                    <Link to='/signup' className='text-warning fw-semibold text-decoration-none small'>
                                        Create an account <i className="bi bi-chevron-right extra-small"></i>
                                    </Link>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}



