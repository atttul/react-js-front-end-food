import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar';

export default function Signup() {
    const [credentials, setcredentials] = useState({ name: "", email: "", password: "", geolocation: "", phone: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(true);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState(null);
    let navigate = useNavigate();

    // Password strength evaluator
    const getPasswordStrength = (pass) => {
        if (!pass) return { score: 0, label: '', color: 'bg-secondary', width: '0%' };
        let score = 0;
        if (pass.length >= 6) score++;
        if (pass.length >= 10) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;

        if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-danger', width: '33%' };
        if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-warning', width: '66%' };
        return { score: 3, label: 'Strong', color: 'bg-success', width: '100%' };
    };

    const passStrength = getPasswordStrength(credentials.password);

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }

        setLocating(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Reverse geocoding via OpenStreetMap Nominatim API
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    const detectedAddress = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                    setcredentials((prev) => ({ ...prev, geolocation: detectedAddress }));
                } catch (err) {
                    setcredentials((prev) => ({ ...prev, geolocation: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}` }));
                } finally {
                    setLocating(false);
                }
            },
            (err) => {
                console.error("Location error:", err);
                setError("Unable to retrieve location. Please type your delivery address manually.");
                setLocating(false);
            },
            { timeout: 10000 }
        );
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!agreeTerms) {
            setError("Please accept the Terms of Service & Privacy Policy to create an account.");
            return;
        }

        setError(null);
        setLoading(true);

        try {
            let response = await fetch(`${process.env.REACT_APP_BASE_URL}/create/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: credentials.name,
                    email: credentials.email,
                    password: credentials.password,
                    location: credentials.geolocation,
                    phone: credentials.phone
                })
            });
            const data = await response.json();

            if (!data.success) {
                setError(data.message || 'User already exists in the database. Please use a different email or phone number.');
            } else {
                navigate('/login');
            }
        } catch (err) {
            console.error("Signup error:", err);
            setError("Failed to register account. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    const onChange = (event) => {
        setcredentials({ ...credentials, [event.target.name]: event.target.value });
    };

    const handleSocialSignup = (provider) => {
        setError(`${provider} sign up is integrated with OAuth. Please register using standard details.`);
    };

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            
            <div className="container px-2 px-sm-3 d-flex justify-content-center align-items-center flex-grow-1 py-3 py-md-5">
                <div className="card auth-wrapper w-100 border-0 overflow-hidden" style={{ maxWidth: '1020px' }}>
                    <div className="row g-0">
                        
                        {/* Left Panel - Hero Branding (Desktop & Tablet) */}
                        <div className="col-md-5 d-none d-md-flex auth-hero-panel">
                            <div className="auth-hero-overlay"></div>
                            
                            <div className="position-relative z-1">
                                <span className="auth-badge mb-3">
                                    <i className="bi bi-gift-fill"></i> Welcome Foodie Offer
                                </span>
                                <h2 className="fw-extrabold text-white display-6 mb-3">
                                    Join Mern Dine Today & Save Big.
                                </h2>
                                <p className="text-white-50 small leading-relaxed mb-4">
                                    Create your account to unlock instant discounts, seamless order tracking, and express 30-minute delivery.
                                </p>

                                <div className="d-flex flex-column gap-3 text-white-50 small mb-4">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-check-circle-fill text-warning fs-6"></i>
                                        <span>Instant SMS & Phone OTP Authentication</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-check-circle-fill text-warning fs-6"></i>
                                        <span>Live GPS Delivery Address Detection</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-check-circle-fill text-warning fs-6"></i>
                                        <span>100% Encrypted & Safe Payment Checkout</span>
                                    </div>
                                </div>
                            </div>

                            <div className="position-relative z-1 mt-auto pt-4 border-top border-secondary border-opacity-50">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="text-white fw-bold small">Already a member?</div>
                                    <Link to="/login" className="btn btn-outline-light btn-sm rounded-pill px-3">
                                        Log In
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Header Banner (< 768px) */}
                        <div className="d-md-none text-center auth-mobile-header p-4 bg-dark bg-opacity-40 border-bottom border-secondary border-opacity-40">
                            <span className="auth-badge mb-2">
                                <i className="bi bi-gift-fill"></i> Join Mern Dine
                            </span>
                            <h4 className="fw-bold text-white mb-1">Create Account</h4>
                            <p className="text-muted small mb-0">Get started in under 60 seconds</p>
                        </div>

                        {/* Right Panel - Signup Form */}
                        <div className="col-md-7 p-3 p-sm-4 p-lg-5 d-flex flex-column justify-content-center">
                            <div className="mb-3 mb-sm-4 d-none d-md-block">
                                <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-dark border border-secondary mb-3 text-warning">
                                    <i className="bi bi-person-plus-fill fs-3"></i>
                                </div>
                                <h3 className="fw-bold text-white mb-1">Create Your Account</h3>
                                <p className="text-muted small mb-0">Get started in under 60 seconds</p>
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
                                <div className="row g-2 g-sm-3">
                                    {/* Full Name */}
                                    <div className="col-12 col-sm-6">
                                        <label htmlFor="name" className="form-label text-white-50 fw-semibold small">
                                            Full Name
                                        </label>
                                        <div className="input-group auth-input-group">
                                            <span className="input-group-text"><i className="bi bi-person"></i></span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="name"
                                                name="name"
                                                placeholder="John Doe"
                                                value={credentials.name}
                                                onChange={onChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Phone Number */}
                                    <div className="col-12 col-sm-6">
                                        <label htmlFor="phone" className="form-label text-white-50 fw-semibold small">
                                            Phone Number
                                        </label>
                                        <div className="input-group auth-input-group">
                                            <span className="input-group-text"><i className="bi bi-telephone"></i></span>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                id="phone"
                                                name="phone"
                                                placeholder="10-digit mobile"
                                                value={credentials.phone}
                                                onChange={onChange}
                                                pattern="[0-9]{10}"
                                                maxLength="10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Email Address */}
                                    <div className="col-12">
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

                                    {/* Password with Strength Indicator */}
                                    <div className="col-12">
                                        <label htmlFor="password" className="form-label text-white-50 fw-semibold small">
                                            Password
                                        </label>
                                        <div className="input-group auth-input-group">
                                            <span className="input-group-text"><i className="bi bi-shield-lock"></i></span>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="form-control"
                                                id="password"
                                                name="password"
                                                placeholder="Create a strong password"
                                                value={credentials.password}
                                                onChange={onChange}
                                                required
                                                minLength="6"
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
                                        {/* Password Strength Meter */}
                                        {credentials.password.length > 0 && (
                                            <div className="mt-2">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="text-white-50 extra-small" style={{ fontSize: '0.75rem' }}>Strength</span>
                                                    <span className={`extra-small fw-semibold ${passStrength.score === 1 ? 'text-danger' : passStrength.score === 2 ? 'text-warning' : 'text-success'}`} style={{ fontSize: '0.75rem' }}>
                                                        {passStrength.label}
                                                    </span>
                                                </div>
                                                <div className="progress bg-dark" style={{ height: '4px' }}>
                                                    <div
                                                        className={`progress-bar ${passStrength.color} password-strength-bar`}
                                                        role="progressbar"
                                                        style={{ width: passStrength.width }}
                                                        aria-valuenow={passStrength.score}
                                                        aria-valuemin="0"
                                                        aria-valuemax="3"
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Delivery Address with Detect Location */}
                                    <div className="col-12">
                                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-1 mb-1">
                                            <label htmlFor="geolocation" className="form-label text-white-50 fw-semibold small mb-0">
                                                Delivery Address
                                            </label>
                                            <button
                                                type="button"
                                                className="btn btn-link text-warning p-0 text-decoration-none extra-small d-flex align-items-center gap-1"
                                                onClick={handleDetectLocation}
                                                disabled={locating}
                                                style={{ fontSize: '0.8rem' }}
                                            >
                                                {locating ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm" style={{ width: '0.8rem', height: '0.8rem' }}></span>
                                                        <span>Detecting...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-geo-alt-fill"></i>
                                                        <span>Detect GPS Location</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <div className="input-group auth-input-group">
                                            <span className="input-group-text"><i className="bi bi-house-door"></i></span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="geolocation"
                                                name="geolocation"
                                                placeholder="House/Flat No., Street, Area, City"
                                                value={credentials.geolocation}
                                                onChange={onChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Terms Checkbox */}
                                <div className="form-check mt-3 mb-3 mb-sm-4">
                                    <input
                                        className="form-check-input bg-dark border-secondary"
                                        type="checkbox"
                                        id="agreeTerms"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                    />
                                    <label className="form-check-label text-white-50 small" htmlFor="agreeTerms">
                                        I agree to Mern Dine's <a href="#terms" className="text-warning text-decoration-none" onClick={(e) => { e.preventDefault(); setError("Terms & Privacy Policy: We respect your privacy and protect your personal credentials."); }}>Terms of Service</a> & <a href="#privacy" className="text-warning text-decoration-none" onClick={(e) => { e.preventDefault(); setError("Privacy Policy: Your data is safely encrypted and used exclusively for order fulfilling."); }}>Privacy Policy</a>.
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
                                            <span>Creating Account...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Create Account Now</span>
                                            <i className="bi bi-arrow-right-short fs-5"></i>
                                        </>
                                    )}
                                </button>

                                {/* Social Login Divider */}
                                <div className="auth-divider">
                                    <span>or sign up with</span>
                                </div>

                                {/* Social Buttons */}
                                <div className="row g-2 mb-3 mb-sm-4">
                                    <div className="col-6">
                                        <button
                                            type="button"
                                            className="btn btn-social w-100"
                                            onClick={() => handleSocialSignup('Google')}
                                        >
                                            <i className="bi bi-google text-danger fs-6"></i>
                                            <span>Google</span>
                                        </button>
                                    </div>
                                    <div className="col-6">
                                        <button
                                            type="button"
                                            className="btn btn-social w-100"
                                            onClick={() => handleSocialSignup('Apple')}
                                        >
                                            <i className="bi bi-apple text-white fs-6"></i>
                                            <span>Apple</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Bottom Link */}
                                <div className="text-center pt-2 border-top border-secondary border-opacity-50">
                                    <span className="text-muted small me-2">Already registered?</span>
                                    <Link to='/login' className='text-warning fw-semibold text-decoration-none small'>
                                        Log in here <i className="bi bi-chevron-right extra-small"></i>
                                    </Link>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}



