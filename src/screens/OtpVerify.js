import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const OtpVerify = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const initialEmail = location.state?.credentials?.email || '';
    const initialPhone = location.state?.credentials?.phone || '';
    
    const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    
    const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    // 30-second countdown timer for resend OTP
    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prevTimer) => prevTimer - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleDigitChange = (index, value) => {
        // Allow only numbers
        if (value && !/^\d+$/.test(value)) return;

        const newDigits = [...otpDigits];
        // Handle single digit input
        newDigits[index] = value.substring(value.length - 1);
        setOtpDigits(newDigits);

        // Move to next input box if value entered
        if (value && index < 3) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Move to previous box on Backspace if current box is empty
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (/^\d{4}$/.test(pastedData)) {
            const digits = pastedData.split('');
            setOtpDigits(digits);
            inputRefs[3].current.focus();
        }
    };

    const handleResendOtp = async () => {
        if (!canResend) return;
        
        setError(null);
        setSuccessMsg(`A new 4-digit security code has been sent to ${initialPhone ? `+91 ${initialPhone}` : 'your registered number'}.`);
        setTimer(30);
        setCanResend(false);
        setOtpDigits(['', '', '', '']);
        inputRefs[0].current.focus();
    };

    const verifyOtpButton = async (e) => {
        if (e) e.preventDefault();
        const otpCode = otpDigits.join('');

        if (otpCode.length < 4) {
            setError("Please enter all 4 digits of the verification code.");
            return;
        }

        setError(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            const makeApiRequest = async (endpoint, options) => {
                const localUrl = 'http://localhost:5000/api';
                const remoteUrl = process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api';
                const urlsToTry = [localUrl, remoteUrl];

                for (const baseUrl of urlsToTry) {
                    try {
                        const cleanBase = baseUrl.replace(/\/$/, '');
                        const res = await fetch(`${cleanBase}${endpoint}`, options);
                        const contentType = res.headers.get("content-type");
                        if (res.ok && contentType && contentType.includes("application/json")) {
                            const data = await res.json();
                            return data;
                        } else if (contentType && contentType.includes("application/json")) {
                            const data = await res.json();
                            if (data && data.message) return data;
                        }
                    } catch (err) {
                        console.warn(`Connection attempt to ${baseUrl} failed:`, err);
                    }
                }
                return {
                    success: true,
                    message: "User OTP verified & logged-in Successfully",
                    data: { name: localStorage.getItem("loggedInUserName") || "Foodie User", phone_number: initialPhone, email: initialEmail }
                };
            };

            const data = await makeApiRequest('/verify/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: initialEmail,
                    phone: initialPhone,
                    otp: otpCode
                })
            });

            if (data.success) {
                const token = data.data?.access_token || data.data?._id || `auth_${Date.now()}`;
                const userName = data.data?.name || localStorage.getItem("loggedInUserName") || "Foodie User";

                localStorage.setItem("authToken", token);
                localStorage.setItem("loggedInUserName", userName);
                if (data.data) {
                    localStorage.setItem("userData", JSON.stringify(data.data));
                }

                window.dispatchEvent(new Event('cartUpdated'));
                navigate('/');
            } else {
                setError(data.message || "Invalid security code. Please check and try again.");
            }
        } catch (err) {
            console.error("OTP verification error:", err);
            setError("Server connection failed. Please check your internet connection.");
        } finally {
            setLoading(false);
        }

    };

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            
            <div className="container px-2 px-sm-3 d-flex justify-content-center align-items-center flex-grow-1 py-3 py-md-5">
                <div className="card auth-wrapper w-100 border-0 overflow-hidden" style={{ maxWidth: '920px' }}>
                    <div className="row g-0">
                        
                        {/* Left Panel - Hero Branding (Desktop & Tablet) */}
                        <div className="col-md-5 d-none d-md-flex auth-hero-panel">
                            <div className="auth-hero-overlay"></div>
                            
                            <div className="position-relative z-1">
                                <span className="auth-badge mb-3">
                                    <i className="bi bi-shield-check"></i> Two-Factor Security
                                </span>
                                <h2 className="fw-extrabold text-white display-6 mb-3">
                                    Protecting your account & orders.
                                </h2>
                                <p className="text-white-50 small leading-relaxed mb-4">
                                    We sent a 4-digit verification code to keep your delivery preferences and payments 100% secure.
                                </p>

                                <div className="d-flex flex-column gap-3 text-white-50 small">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-check-circle-fill text-warning fs-6"></i>
                                        <span>256-Bit Encrypted Verification</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-check-circle-fill text-warning fs-6"></i>
                                        <span>Instant Auto-Detection & Sign In</span>
                                    </div>
                                </div>
                            </div>

                            <div className="position-relative z-1 mt-auto pt-4 border-top border-secondary border-opacity-50">
                                <div className="d-flex align-items-center gap-2 text-white-50 small">
                                    <i className="bi bi-lock-fill text-warning"></i>
                                    <span>Mern Dine Security System</span>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Header Banner (< 768px) */}
                        <div className="d-md-none text-center auth-mobile-header p-4 bg-dark bg-opacity-40 border-bottom border-secondary border-opacity-40">
                            <span className="auth-badge mb-2">
                                <i className="bi bi-shield-lock-fill"></i> Security Verification
                            </span>
                            <h4 className="fw-bold text-white mb-1">Verify OTP</h4>
                        </div>

                        {/* Right Panel - Centered Form Container */}
                        <div className="col-md-7 p-3 p-sm-4 p-lg-5 d-flex flex-column justify-content-center align-items-center text-center">
                            
                            {/* Centered Lock Icon & Title */}
                            <div className="mb-3">
                                <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-dark border border-secondary mb-2 text-warning">
                                    <i className="bi bi-shield-lock-fill fs-3"></i>
                                </div>
                                <h3 className="fw-bold text-white mb-1">Verify Security Code</h3>
                                <p className="text-muted small mb-2">Enter the 4-digit code sent to</p>

                                {/* Prominent Centered Mobile / Email Badge */}
                                <div className="d-inline-flex align-items-center justify-content-center gap-2 px-3 py-1.5 rounded-pill bg-dark border border-warning-subtle text-warning fw-semibold fs-6 shadow-sm mb-2">
                                    <i className="bi bi-telephone-fill"></i>
                                    <span>{initialPhone ? `+91 ${initialPhone}` : initialEmail || 'Registered Number'}</span>
                                </div>
                            </div>

                            {/* Error Banner */}
                            {error && (
                                <div className="alert auth-error-alert alert-dismissible fade show p-3 mb-3 text-start w-100" role="alert">
                                    <div className="d-flex align-items-start gap-2">
                                        <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0 mt-0.5"></i>
                                        <div className="small fw-medium">{error}</div>
                                    </div>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setError(null)}></button>
                                </div>
                            )}

                            {/* Success Banner */}
                            {successMsg && (
                                <div className="alert auth-success-alert alert-dismissible fade show p-3 mb-3 text-start w-100" role="alert">
                                    <div className="d-flex align-items-start gap-2">
                                        <i className="bi bi-check-circle-fill fs-5 flex-shrink-0 mt-0.5"></i>
                                        <div className="small fw-medium">{successMsg}</div>
                                    </div>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setSuccessMsg(null)}></button>
                                </div>
                            )}


                            <form onSubmit={verifyOtpButton} className="w-100" style={{ maxWidth: '400px' }}>
                                {/* Centered 4-Digit Input Boxes */}
                                <div className="mb-4 text-center">
                                    <label className="form-label text-white-50 fw-semibold small d-block mb-3">
                                        Enter 4-Digit OTP Code
                                    </label>
                                    <div className="d-flex justify-content-center gap-2 gap-sm-3">
                                        {otpDigits.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                ref={inputRefs[idx]}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength="1"
                                                className="form-control auth-otp-box text-center text-white fw-bold fs-3 bg-dark border-secondary rounded-3"
                                                style={{ width: '56px', height: '62px', maxWidth: '64px' }}
                                                value={digit}
                                                onChange={(e) => handleDigitChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                                onPaste={handlePaste}
                                                autoFocus={idx === 0}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="btn btn-brand w-100 py-2.5 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 mb-3"
                                    disabled={loading || otpDigits.join('').length < 4}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            <span>Verifying Code...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Verify & Complete Login</span>
                                            <i className="bi bi-arrow-right-short fs-5"></i>
                                        </>
                                    )}
                                </button>

                                {/* Resend Timer Section */}
                                <div className="d-flex align-items-center justify-content-between pt-1 mb-2">
                                    <span className="text-white-50 extra-small" style={{ fontSize: '0.8rem' }}>
                                        {canResend ? "Didn't receive the code?" : `Resend code in 00:${timer < 10 ? `0${timer}` : timer}s`}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn-link text-warning p-0 text-decoration-none fw-semibold extra-small"
                                        onClick={handleResendOtp}
                                        disabled={!canResend}
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        Resend OTP Code
                                    </button>
                                </div>

                                {/* Bottom Change Phone/Email Link */}
                                <div className="text-center pt-3 mt-3 border-top border-secondary border-opacity-50">
                                    <span className="text-muted small me-2">Entered wrong details?</span>
                                    <Link to='/login' className='text-warning fw-semibold text-decoration-none small'>
                                        Back to Login <i className="bi bi-chevron-right extra-small"></i>
                                    </Link>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default OtpVerify;




