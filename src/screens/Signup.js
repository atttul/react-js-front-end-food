import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Signup() {
    const [credentials, setCredentials] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        geolocation: ""
    });

    const [touched, setTouched] = useState({
        name: false,
        email: false,
        phone: false,
        password: false,
        confirmPassword: false,
        geolocation: false
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(true);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState(null);
    const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

    let navigate = useNavigate();

    // Password strength calculation
    const getPasswordStrength = (pass) => {
        if (!pass) return { score: 0, label: '', color: 'bg-secondary', width: '0%', textClass: 'text-muted' };
        let score = 0;
        if (pass.length >= 6) score++;
        if (pass.length >= 10) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;

        if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-danger', width: '33%', textClass: 'text-danger' };
        if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-warning', width: '66%', textClass: 'text-warning' };
        return { score: 3, label: 'Strong', color: 'bg-success', width: '100%', textClass: 'text-success' };
    };

    const passStrength = getPasswordStrength(credentials.password);

    // Realistic field-by-field validator
    const validateField = (fieldName, value, currentCredentials = credentials) => {
        let errorMsg = "";

        switch (fieldName) {
            case 'name':
                if (!value || value.trim().length === 0) {
                    errorMsg = "Full Name is required.";
                } else if (value.trim().length < 2) {
                    errorMsg = "Name must be at least 2 characters.";
                } else if (!/^[a-zA-Z\s.'-]+$/.test(value.trim())) {
                    errorMsg = "Name can only contain letters and spaces.";
                }
                break;

            case 'phone':
                const cleanPhone = String(value || '').replace(/\D/g, '');
                if (!cleanPhone) {
                    errorMsg = "Mobile Phone Number is required.";
                } else if (cleanPhone.length !== 10) {
                    errorMsg = "Phone number must be exactly 10 digits.";
                } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
                    errorMsg = "Please enter a valid 10-digit mobile number (starts with 6-9).";
                }
                break;

            case 'email':
                if (!value || value.trim().length === 0) {
                    errorMsg = "Email Address is required.";
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
                    errorMsg = "Please enter a valid email format (e.g. name@example.com).";
                }
                break;

            case 'password':
                if (!value) {
                    errorMsg = "Password is required.";
                } else if (value.length < 6) {
                    errorMsg = "Password must be at least 6 characters long.";
                }
                break;

            case 'confirmPassword':
                if (!value) {
                    errorMsg = "Please confirm your password.";
                } else if (value !== currentCredentials.password) {
                    errorMsg = "Passwords do not match.";
                }
                break;

            case 'geolocation':
                if (!value || value.trim().length === 0) {
                    errorMsg = "Delivery location/address is required.";
                } else if (value.trim().length < 5) {
                    errorMsg = "Address should be at least 5 characters.";
                }
                break;

            default:
                break;
        }

        return errorMsg;
    };

    const validateAllFields = (dataToValidate = credentials) => {
        const newErrors = {};
        Object.keys(dataToValidate).forEach((field) => {
            const err = validateField(field, dataToValidate[field], dataToValidate);
            if (err) newErrors[field] = err;
        });
        return newErrors;
    };

    const onChange = (event) => {
        const { name, value } = event.target;
        const updatedCredentials = { ...credentials, [name]: value };
        setCredentials(updatedCredentials);

        // If field was already touched, validate dynamically
        if (touched[name]) {
            const fieldErr = validateField(name, value, updatedCredentials);
            setErrors(prev => ({ ...prev, [name]: fieldErr }));

            // Also re-validate confirmPassword if password changes
            if (name === 'password' && touched.confirmPassword) {
                const confirmErr = validateField('confirmPassword', credentials.confirmPassword, updatedCredentials);
                setErrors(prev => ({ ...prev, confirmPassword: confirmErr }));
            }
        }
    };

    const handleBlur = (event) => {
        const { name, value } = event.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const fieldErr = validateField(name, value, credentials);
        setErrors(prev => ({ ...prev, [name]: fieldErr }));
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser. Please type your delivery address.");
            return;
        }

        setLocating(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    const detectedAddress = data.display_name || `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
                    
                    const updated = { ...credentials, geolocation: detectedAddress };
                    setCredentials(updated);
                    setTouched(prev => ({ ...prev, geolocation: true }));
                    setErrors(prev => ({ ...prev, geolocation: "" }));
                } catch (err) {
                    console.error("Reverse geocoding error:", err);
                    const fallback = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
                    setCredentials(prev => ({ ...prev, geolocation: fallback }));
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

    const makeApiRequest = async (endpoint, options) => {
        const localUrl = 'http://localhost:5000/api';
        const remoteUrl = process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api';
        const urlsToTry = [localUrl, remoteUrl];

        for (const baseUrl of urlsToTry) {
            try {
                const cleanBase = baseUrl.replace(/\/$/, '');
                const res = await fetch(`${cleanBase}${endpoint}`, options);
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    return { status: res.status, ok: res.ok, data };
                }
            } catch (err) {
                console.warn(`Connection attempt to ${baseUrl} failed:`, err);
            }
        }
        return null;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Mark all fields touched
        const allTouched = {
            name: true,
            email: true,
            phone: true,
            password: true,
            confirmPassword: true,
            geolocation: true
        };
        setTouched(allTouched);

        const formErrors = validateAllFields();
        setErrors(formErrors);

        if (Object.keys(formErrors).length > 0) {
            setError("Please fix the highlighted errors before creating your account.");
            return;
        }

        if (!agreeTerms) {
            setError("Please accept the Terms of Service & Privacy Policy to create an account.");
            return;
        }

        setError(null);
        setIsAlreadyRegistered(false);
        setLoading(true);

        try {
            const cleanPhone = String(credentials.phone).replace(/\D/g, '');
            const responseObj = await makeApiRequest('/create/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: credentials.name.trim(),
                    email: credentials.email.trim().toLowerCase(),
                    password: credentials.password,
                    location: credentials.geolocation.trim(),
                    phone: cleanPhone
                })
            });

            if (!responseObj) {
                setError("Unable to connect to server. Please check your internet connection.");
                return;
            }

            const { ok, data } = responseObj;

            if (!ok || !data.success) {
                const isDup = data?.alreadyExists || (data?.message && (data.message.includes('already exists') || data.message.includes('E11000') || data.message.includes('duplicate')));
                setIsAlreadyRegistered(!!isDup);
                setError(data?.message || 'An account with this Email Address or Mobile Number already exists.');
            } else {
                navigate('/login', { state: { registeredEmail: credentials.email } });
            }
        } catch (err) {
            console.error("Signup error:", err);
            setError("Failed to register account. Please check your network and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialSignup = (provider) => {
        setError(`${provider} sign up is integrated with OAuth. Please enter your details directly to create an account.`);
    };

    const getInputClass = (fieldName) => {
        if (!touched[fieldName]) return "form-control";
        return errors[fieldName] ? "form-control is-invalid" : "form-control is-valid";
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
                                    Create your free account to unlock instant discounts, live GPS order tracking, and express 30-minute food delivery.
                                </p>

                                <div className="d-flex flex-column gap-3 text-white-50 small mb-4">
                                    <div className="d-flex align-items-center gap-2.5">
                                        <div className="auth-feature-icon bg-warning bg-opacity-20 text-warning rounded-circle p-1">
                                            <i className="bi bi-shield-check-fill fs-6"></i>
                                        </div>
                                        <span>Instant SMS & Phone OTP Authentication</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2.5">
                                        <div className="auth-feature-icon bg-warning bg-opacity-20 text-warning rounded-circle p-1">
                                            <i className="bi bi-geo-alt-fill fs-6"></i>
                                        </div>
                                        <span>Live GPS Delivery Address Detection</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2.5">
                                        <div className="auth-feature-icon bg-warning bg-opacity-20 text-warning rounded-circle p-1">
                                            <i className="bi bi-lock-fill fs-6"></i>
                                        </div>
                                        <span>100% Encrypted & Safe Checkout</span>
                                    </div>
                                </div>
                            </div>

                            <div className="position-relative z-1 mt-auto pt-4 border-top border-secondary border-opacity-50">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="text-white fw-bold small">Already have an account?</div>
                                    <Link to="/login" className="btn btn-outline-light btn-sm rounded-pill px-3.5 fw-semibold">
                                        Log In
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Header Banner (< 768px) */}
                        <div className="d-md-none text-center auth-mobile-header p-3 p-sm-4 bg-dark bg-opacity-50 border-bottom border-secondary border-opacity-40">
                            <span className="auth-badge mb-2">
                                <i className="bi bi-gift-fill"></i> Welcome Foodie
                            </span>
                            <h4 className="fw-bold text-white mb-1">Create Account</h4>
                            <p className="text-white-50 small mb-0">Get started with Mern Dine in under 60 seconds</p>
                        </div>

                        {/* Right Panel - Signup Form */}
                        <div className="col-md-7 p-3 p-sm-4 p-lg-5 d-flex flex-column justify-content-center">
                            <div className="mb-3 mb-sm-4 d-none d-md-block">
                                <div className="d-inline-flex align-items-center justify-content-center p-2.5 rounded-circle bg-dark border border-secondary mb-2.5 text-warning">
                                    <i className="bi bi-person-plus-fill fs-4"></i>
                                </div>
                                <h3 className="fw-bold text-white mb-1">Create Your Account</h3>
                                <p className="text-white-50 small mb-0">Fill in your details below to set up your profile</p>
                            </div>

                            {/* Top Alert Banner */}
                            {error && (
                                <div className="alert auth-error-alert alert-dismissible fade show p-3 mb-3 mb-sm-4 text-start w-100 shadow" role="alert">
                                    <div className="d-flex align-items-start gap-2 mb-1">
                                        <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0 mt-0.5 text-warning"></i>
                                        <div className="small fw-semibold leading-relaxed text-white">{error}</div>
                                    </div>

                                    {isAlreadyRegistered && (
                                        <div className="pt-2.5 mt-2 border-top border-secondary border-opacity-40 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                                            <span className="extra-small text-white-50">Already registered?</span>
                                            <div className="d-flex gap-2">
                                                <Link to="/forgot-password" className="btn btn-sm btn-outline-warning text-white fw-bold rounded-pill px-3 py-1 extra-small">
                                                    <i className="bi bi-key-fill me-1"></i> Forgot Password?
                                                </Link>
                                                <Link to="/login" className="btn btn-sm btn-brand text-white fw-bold rounded-pill px-3 py-1 extra-small">
                                                    <i className="bi bi-box-arrow-in-right me-1"></i> Log In
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    <button type="button" className="btn-close btn-close-white" onClick={() => { setError(null); setIsAlreadyRegistered(false); }}></button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} noValidate>
                                <div className="row g-2 g-sm-3">
                                    {/* Full Name */}
                                    <div className="col-12 col-sm-6">
                                        <label htmlFor="name" className="form-label text-white-50 fw-semibold small mb-1">
                                            Full Name <span className="text-danger">*</span>
                                        </label>
                                        <div className={`input-group auth-input-group ${touched.name ? (errors.name ? 'has-error' : 'has-success') : ''}`}>
                                            <span className="input-group-text"><i className="bi bi-person"></i></span>
                                            <input
                                                type="text"
                                                className={getInputClass('name')}
                                                id="name"
                                                name="name"
                                                placeholder="e.g. John Doe"
                                                value={credentials.name}
                                                onChange={onChange}
                                                onBlur={handleBlur}
                                                required
                                            />
                                            {touched.name && !errors.name && credentials.name && (
                                                <span className="input-group-text text-success bg-transparent border-0 pe-2">
                                                    <i className="bi bi-check-circle-fill"></i>
                                                </span>
                                            )}
                                        </div>
                                        {touched.name && errors.name && (
                                            <div className="invalid-feedback d-block extra-small mt-1 text-danger fw-medium">
                                                <i className="bi bi-exclamation-circle me-1"></i>{errors.name}
                                            </div>
                                        )}
                                    </div>

                                    {/* Mobile Phone Number */}
                                    <div className="col-12 col-sm-6">
                                        <label htmlFor="phone" className="form-label text-white-50 fw-semibold small mb-1">
                                            Mobile Number <span className="text-danger">*</span>
                                        </label>
                                        <div className={`input-group auth-input-group ${touched.phone ? (errors.phone ? 'has-error' : 'has-success') : ''}`}>
                                            <span className="input-group-text"><i className="bi bi-telephone"></i></span>
                                            <input
                                                type="tel"
                                                className={getInputClass('phone')}
                                                id="phone"
                                                name="phone"
                                                placeholder="10-digit mobile number"
                                                value={credentials.phone}
                                                onChange={onChange}
                                                onBlur={handleBlur}
                                                maxLength="10"
                                                required
                                            />
                                            {touched.phone && !errors.phone && credentials.phone && (
                                                <span className="input-group-text text-success bg-transparent border-0 pe-2">
                                                    <i className="bi bi-check-circle-fill"></i>
                                                </span>
                                            )}
                                        </div>
                                        {touched.phone && errors.phone && (
                                            <div className="invalid-feedback d-block extra-small mt-1 text-danger fw-medium">
                                                <i className="bi bi-exclamation-circle me-1"></i>{errors.phone}
                                            </div>
                                        )}
                                    </div>

                                    {/* Email Address */}
                                    <div className="col-12">
                                        <label htmlFor="email" className="form-label text-white-50 fw-semibold small mb-1">
                                            Email Address <span className="text-danger">*</span>
                                        </label>
                                        <div className={`input-group auth-input-group ${touched.email ? (errors.email ? 'has-error' : 'has-success') : ''}`}>
                                            <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                                            <input
                                                type="email"
                                                className={getInputClass('email')}
                                                id="email"
                                                name="email"
                                                placeholder="name@example.com"
                                                value={credentials.email}
                                                onChange={onChange}
                                                onBlur={handleBlur}
                                                required
                                            />
                                            {touched.email && !errors.email && credentials.email && (
                                                <span className="input-group-text text-success bg-transparent border-0 pe-2">
                                                    <i className="bi bi-check-circle-fill"></i>
                                                </span>
                                            )}
                                        </div>
                                        {touched.email && errors.email && (
                                            <div className="invalid-feedback d-block extra-small mt-1 text-danger fw-medium">
                                                <i className="bi bi-exclamation-circle me-1"></i>{errors.email}
                                            </div>
                                        )}
                                    </div>

                                    {/* Password */}
                                    <div className="col-12 col-sm-6">
                                        <label htmlFor="password" className="form-label text-white-50 fw-semibold small mb-1">
                                            Password <span className="text-danger">*</span>
                                        </label>
                                        <div className={`input-group auth-input-group ${touched.password ? (errors.password ? 'has-error' : 'has-success') : ''}`}>
                                            <span className="input-group-text"><i className="bi bi-lock"></i></span>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className={getInputClass('password')}
                                                id="password"
                                                name="password"
                                                placeholder="At least 6 characters"
                                                value={credentials.password}
                                                onChange={onChange}
                                                onBlur={handleBlur}
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

                                        {/* Dynamic Password Strength Indicator */}
                                        {credentials.password.length > 0 && (
                                            <div className="mt-1.5 px-0.5">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="text-white-50 extra-small" style={{ fontSize: '0.72rem' }}>Strength</span>
                                                    <span className={`extra-small fw-bold ${passStrength.textClass}`} style={{ fontSize: '0.72rem' }}>
                                                        {passStrength.label}
                                                    </span>
                                                </div>
                                                <div className="progress bg-dark border border-secondary border-opacity-30" style={{ height: '5px' }}>
                                                    <div
                                                        className={`progress-bar ${passStrength.color} password-strength-bar`}
                                                        role="progressbar"
                                                        style={{ width: passStrength.width }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {touched.password && errors.password && (
                                            <div className="invalid-feedback d-block extra-small mt-1 text-danger fw-medium">
                                                <i className="bi bi-exclamation-circle me-1"></i>{errors.password}
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="col-12 col-sm-6">
                                        <label htmlFor="confirmPassword" className="form-label text-white-50 fw-semibold small mb-1">
                                            Confirm Password <span className="text-danger">*</span>
                                        </label>
                                        <div className={`input-group auth-input-group ${touched.confirmPassword ? (errors.confirmPassword ? 'has-error' : 'has-success') : ''}`}>
                                            <span className="input-group-text"><i className="bi bi-shield-check"></i></span>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                className={getInputClass('confirmPassword')}
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                placeholder="Re-enter password"
                                                value={credentials.confirmPassword}
                                                onChange={onChange}
                                                onBlur={handleBlur}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="btn password-toggle-btn input-group-text"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                title={showConfirmPassword ? "Hide Password" : "Show Password"}
                                            >
                                                <i className={`bi ${showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                                            </button>
                                        </div>

                                        {touched.confirmPassword && !errors.confirmPassword && credentials.confirmPassword && (
                                            <div className="valid-feedback d-block extra-small mt-1 text-success fw-medium">
                                                <i className="bi bi-check-circle me-1"></i>Passwords match!
                                            </div>
                                        )}

                                        {touched.confirmPassword && errors.confirmPassword && (
                                            <div className="invalid-feedback d-block extra-small mt-1 text-danger fw-medium">
                                                <i className="bi bi-exclamation-circle me-1"></i>{errors.confirmPassword}
                                            </div>
                                        )}
                                    </div>

                                    {/* Address / Location */}
                                    <div className="col-12">
                                        <label htmlFor="geolocation" className="form-label text-white-50 fw-semibold small mb-1">
                                            Delivery Location / Address <span className="text-danger">*</span>
                                        </label>
                                        <div className={`input-group auth-input-group ${touched.geolocation ? (errors.geolocation ? 'has-error' : 'has-success') : ''}`}>
                                            <span className="input-group-text"><i className="bi bi-geo-alt"></i></span>
                                            <input
                                                type="text"
                                                className={getInputClass('geolocation')}
                                                id="geolocation"
                                                name="geolocation"
                                                placeholder="Enter full delivery address or click Detect GPS..."
                                                value={credentials.geolocation}
                                                onChange={onChange}
                                                onBlur={handleBlur}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-warning input-group-text px-2.5 px-sm-3 fw-bold extra-small"
                                                onClick={handleDetectLocation}
                                                disabled={locating}
                                                title="Detect current GPS location"
                                            >
                                                {locating ? (
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-crosshair me-1"></i> Detect GPS
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        {touched.geolocation && errors.geolocation && (
                                            <div className="invalid-feedback d-block extra-small mt-1 text-danger fw-medium">
                                                <i className="bi bi-exclamation-circle me-1"></i>{errors.geolocation}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Terms & Conditions */}
                                <div className="form-check my-3">
                                    <input
                                        className="form-check-input bg-dark border-secondary cursor-pointer"
                                        type="checkbox"
                                        id="agreeTerms"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                    />
                                    <label className="form-check-label text-white-50 small ms-1 cursor-pointer" htmlFor="agreeTerms">
                                        I agree to Mern Dine's <Link to="#" className="text-warning text-decoration-none fw-medium">Terms of Service</Link> & <Link to="#" className="text-warning text-decoration-none fw-medium">Privacy Policy</Link>
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-brand w-100 py-2.5 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 mb-3 shadow"
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            <span>Creating Your Account...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Create Account</span>
                                            <i className="bi bi-arrow-right-short fs-5"></i>
                                        </>
                                    )}
                                </button>

                                {/* Social Signup Divider */}
                                <div className="auth-divider">
                                    <span>or sign up with</span>
                                </div>

                                {/* Social Buttons */}
                                <div className="row g-2 mb-3">
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

                                {/* Bottom Log In Link */}
                                <div className="text-center pt-2 border-top border-secondary border-opacity-50">
                                    <span className="text-muted small me-2">Already have an account?</span>
                                    <Link to='/login' className='text-warning fw-bold text-decoration-none small'>
                                        Sign In <i className="bi bi-chevron-right extra-small"></i>
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
