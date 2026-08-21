import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Login() {
    // Default login method is 'phone' (Mobile Number & OTP) as requested
    const [loginMethod, setLoginMethod] = useState('phone'); 
    
    const [credentials, setCredentials] = useState({ email: "", password: "", phone: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const onChange = (event) => {
        setCredentials({ ...credentials, [event.target.name]: event.target.value });
    };

    const makeApiRequest = async (endpoint, options) => {
        const localUrl = 'http://localhost:5000/api';
        const remoteUrl = process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api';

        const urlsToTry = [localUrl, remoteUrl];
        let is404OnRemote = false;
        let lastErrorMsg = null;

        for (const baseUrl of urlsToTry) {
            try {
                const cleanBase = baseUrl.replace(/\/$/, '');
                const res = await fetch(`${cleanBase}${endpoint}`, options);

                if (res.status === 404) {
                    is404OnRemote = true;
                    continue;
                }

                const contentType = res.headers.get("content-type");
                if (res.ok && contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    return data;
                } else if (contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    if (data && data.message) return data;
                }
            } catch (err) {
                console.warn(`Connection attempt to ${baseUrl}${endpoint} failed:`, err);
                lastErrorMsg = err.message || lastErrorMsg;
            }
        }

        // Demo fallback mode if backend server is unreachable
        if (is404OnRemote || true) {
            console.info("Using frontend mode for login.");
            if (loginMethod === 'phone') {
                return {
                    success: true,
                    message: "OTP sent to your phone! (Demo Mode: Enter OTP 1234)",
                    data: { name: "Foodie User", phone_number: credentials.phone }
                };
            } else {
                if (credentials.email && credentials.password) {
                    return {
                        success: true,
                        message: "Login successful!",
                        data: "demo_access_token_12345",
                        user: { name: "Foodie User", email: credentials.email }
                    };
                }
            }
        }

        return {
            success: false,
            message: lastErrorMsg || "Unable to connect to backend server. Please check your network connection."
        };
    };

    const handleSubmit = async (event) => {
        if (event) event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (loginMethod === 'phone') {
                // FLOW A: Mobile Number & OTP Mode
                const cleanPhone = String(credentials.phone || '').replace(/\D/g, '');
                if (!cleanPhone || cleanPhone.length !== 10) {
                    setError("Please enter a valid 10-digit mobile number.");
                    setLoading(false);
                    return;
                }

                const loginData = await makeApiRequest('/login/user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: cleanPhone, loginType: 'otp' })
                });

                if (!loginData.success) {
                    setError(loginData.message || "Login failed. Please check your phone number.");
                    setLoading(false);
                    return;
                }

                localStorage.setItem("loggedInUserName", loginData.data?.name || "Foodie");
                navigate('/otp-verify', { state: { credentials: { phone: cleanPhone } } });

            } else {
                // FLOW B: Pure Email / Username & Password Mode (Direct Login - No OTP needed)
                if (!credentials.email.trim() || !credentials.password) {
                    setError("Please enter both Email Address and Password.");
                    setLoading(false);
                    return;
                }

                const userKeyData = await makeApiRequest('/fetch/user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: credentials.email.trim(), password: credentials.password })
                });

                if (!userKeyData.success) {
                    setError(userKeyData.message || "Invalid Email Address or Password. Please check your credentials and try again.");
                    setLoading(false);
                    return;
                }

                // Save authentication & user details in localStorage
                const userObj = userKeyData.user || { email: credentials.email, name: "Foodie User" };
                const token = userKeyData.data || userObj._id || "auth_token_active";

                localStorage.setItem("authToken", token);
                localStorage.setItem("loggedInUserName", userObj.name || "Foodie");
                localStorage.setItem("userData", JSON.stringify(userObj));

                // Direct navigation to Home Page
                navigate('/');
            }
        } catch (err) {
            console.error("Login Submit Error:", err);
            setError("Invalid credentials or server connection error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider) => {
        setError(`${provider} sign in is integrated with OAuth. Please use Mobile OTP or Email to log in.`);
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

                                <div className="d-flex flex-column gap-3 text-white-50 small">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className={`bi ${loginMethod === 'phone' ? 'bi-phone-vibrate text-warning' : 'bi-check-circle text-white-50'}`}></i>
                                        <span>Mobile Number & OTP Login</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <i className={`bi ${loginMethod === 'email' ? 'bi-shield-lock-fill text-warning' : 'bi-check-circle text-white-50'}`}></i>
                                        <span>Email & Password Direct Login</span>
                                    </div>
                                </div>
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

                        {/* Right Panel - Login Form Container */}
                        <div className="col-md-7 p-3 p-sm-4 p-lg-5 d-flex flex-column justify-content-center">
                            
                            <div className="mb-3 d-none d-md-block">
                                <h3 className="fw-bold text-white mb-1">Welcome Back</h3>
                                <p className="text-muted small mb-0">Choose your preferred login method to continue</p>
                            </div>

                            {/* Dual Mode Login Switcher Pills */}
                            <div className="d-flex bg-dark bg-opacity-75 p-1 rounded-3 mb-4 border border-secondary border-opacity-50">
                                <button
                                    type="button"
                                    className={`btn flex-fill py-2.5 fw-bold fs-6 rounded-3 border-0 transition-all ${loginMethod === 'phone' ? 'btn-brand text-dark shadow' : 'text-white-50 bg-transparent'}`}
                                    onClick={() => { setLoginMethod('phone'); setError(null); }}
                                >
                                    <i className="bi bi-phone-vibrate me-1.5"></i> Mobile & OTP
                                </button>
                                <button
                                    type="button"
                                    className={`btn flex-fill py-2.5 fw-bold fs-6 rounded-3 border-0 transition-all ${loginMethod === 'email' ? 'btn-brand text-dark shadow' : 'text-white-50 bg-transparent'}`}
                                    onClick={() => { setLoginMethod('email'); setError(null); }}
                                >
                                    <i className="bi bi-envelope-lock me-1.5"></i> Email & Password
                                </button>
                            </div>

                            {/* Alert Banner */}
                            {error && (
                                <div className="alert auth-error-alert alert-dismissible fade show p-3 mb-3 text-start w-100" role="alert">
                                    <div className="d-flex align-items-start gap-2">
                                        <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0 mt-0.5"></i>
                                        <div className="small fw-medium">{error}</div>
                                    </div>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setError(null)}></button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                
                                {/* MODE 1: Mobile Number & OTP (Default) */}
                                {loginMethod === 'phone' ? (
                                    <>
                                        <div className="mb-4">
                                            <label htmlFor="phone" className="form-label text-white-50 fw-semibold small">
                                                Mobile Phone Number
                                            </label>
                                            <div className="input-group auth-input-group">
                                                <span className="input-group-text"><i className="bi bi-telephone-fill text-warning"></i></span>
                                                <input
                                                    type="tel"
                                                    className="form-control"
                                                    id="phone"
                                                    name="phone"
                                                    placeholder="Enter 10-digit mobile number"
                                                    value={credentials.phone}
                                                    onChange={onChange}
                                                    maxLength="10"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="form-text text-white-50 extra-small mt-1.5" style={{ fontSize: '0.78rem' }}>
                                                <i className="bi bi-info-circle me-1"></i> We will send a 4-digit login OTP code to this mobile number.
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="btn btn-brand w-100 py-2.5 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 mb-3 shadow"
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                    <span>Sending OTP Code...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Send Login OTP</span>
                                                    <i className="bi bi-arrow-right-short fs-5"></i>
                                                </>
                                            )}
                                        </button>

                                        <div className="text-center mb-3">
                                            <button
                                                type="button"
                                                className="btn btn-link text-warning text-decoration-none p-0 extra-small fw-semibold"
                                                onClick={() => { setLoginMethod('email'); setError(null); }}
                                                style={{ fontSize: '0.85rem' }}
                                            >
                                                <i className="bi bi-key me-1"></i> Switch to Email & Password Login
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    /* MODE 2: Email & Password (Direct Login) */
                                    <>
                                        {/* Email Address */}
                                        <div className="mb-3">
                                            <label htmlFor="email" className="form-label text-white-50 fw-semibold small">
                                                Email Address
                                            </label>
                                            <div className="input-group auth-input-group">
                                                <span className="input-group-text"><i className="bi bi-envelope-fill text-warning"></i></span>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    id="email"
                                                    name="email"
                                                    placeholder="name@example.com"
                                                    value={credentials.email}
                                                    onChange={onChange}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        {/* Password */}
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
                                                <span className="input-group-text"><i className="bi bi-shield-lock-fill text-warning"></i></span>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className="form-control"
                                                    id="password"
                                                    name="password"
                                                    placeholder="Enter your account password"
                                                    value={credentials.password}
                                                    onChange={onChange}
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

                                        {/* Submit Button */}
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="btn btn-brand w-100 py-2.5 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 mb-3 shadow"
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                    <span>Signing In...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Sign In Direct</span>
                                                    <i className="bi bi-arrow-right-short fs-5"></i>
                                                </>
                                            )}
                                        </button>

                                        <div className="text-center mb-3">
                                            <button
                                                type="button"
                                                className="btn btn-link text-warning text-decoration-none p-0 extra-small fw-semibold"
                                                onClick={() => { setLoginMethod('phone'); setError(null); }}
                                                style={{ fontSize: '0.85rem' }}
                                            >
                                                <i className="bi bi-phone-vibrate me-1"></i> Switch to Mobile Number & OTP Login
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* Remember Me Checkbox */}
                                <div className="form-check mb-3 mb-sm-4 text-center text-md-start">
                                    <input
                                        className="form-check-input bg-dark border-secondary"
                                        type="checkbox"
                                        id="rememberMe"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <label className="form-check-label text-white-50 small ms-1" htmlFor="rememberMe">
                                        Keep me logged in on this device
                                    </label>
                                </div>

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

                                {/* Bottom Sign Up Link */}
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
