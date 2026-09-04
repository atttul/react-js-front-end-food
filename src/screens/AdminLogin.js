import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminLogin() {
    const navigate = useNavigate();

    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const onChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        if (errorMsg) setErrorMsg(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!credentials.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email.trim())) {
            setErrorMsg('Please enter a valid Admin Email Address.');
            return;
        }

        if (!credentials.password || credentials.password.length < 6) {
            setErrorMsg('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);

        try {
            const localUrl = 'http://localhost:5000/api';
            const remoteUrl = (process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api').replace(/\/$/, '');
            const urlsToTry = [localUrl, remoteUrl];

            let responseData = null;
            let lastErr = null;

            for (const baseUrl of urlsToTry) {
                try {
                    const res = await fetch(`${baseUrl}/login/admin`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email: credentials.email.trim(),
                            password: credentials.password
                        })
                    });

                    const data = await res.json();
                    if (res.ok && data.success) {
                        responseData = data;
                        break;
                    } else if (data && data.message) {
                        lastErr = data.message;
                        // If got a specific domain response like forbidden, break and show error
                        if (res.status === 403 || res.status === 401) {
                            responseData = data;
                            break;
                        }
                    }
                } catch (err) {
                    lastErr = err.message;
                }
            }

            if (responseData && responseData.success) {
                const token = responseData.accessToken || responseData.data?.access_token || responseData.data?._id;
                const adminUser = responseData.data;

                localStorage.setItem('adminAuthToken', token);
                localStorage.setItem('adminUserData', JSON.stringify(adminUser));

                navigate('/admin/dashboard');
            } else {
                setErrorMsg(responseData?.message || lastErr || 'Admin login failed. Please check your credentials.');
            }
        } catch (err) {
            console.error('Admin Login Error:', err);
            setErrorMsg('Server connection failed. Please check your network connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#121212', minHeight: '100vh' }} className="d-flex flex-column justify-content-center align-items-center py-5 px-3">
            {/* Header / Brand */}
            <div className="text-center mb-4">
                <Link to="/" className="text-decoration-none">
                    <h1 className="fw-bold fs-2 text-warning m-0">
                        MERN <span style={{ color: '#fd5631' }}>Dine</span>
                    </h1>
                </Link>
                <div className="badge bg-danger mt-2 px-3 py-2 text-uppercase fs-7 fw-semibold">
                    <i className="bi bi-shield-lock-fill me-1"></i> Admin Portal
                </div>
            </div>

            {/* Login Card */}
            <div className="card text-white bg-dark border-secondary rounded-4 shadow-lg p-4 p-md-5" style={{ maxWidth: '440px', width: '100%' }}>
                <div className="text-center mb-4">
                    <h3 className="fw-bold mb-1">Admin Sign In</h3>
                    <p className="text-muted small">Enter your administrative credentials to manage orders</p>
                </div>

                {errorMsg && (
                    <div className="alert alert-danger rounded-3 small py-2 px-3 mb-4 d-flex align-items-center" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2 fs-5 flex-shrink-0"></i>
                        <div>{errorMsg}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Admin Email */}
                    <div className="mb-3">
                        <label className="form-label text-light small fw-medium">Admin Email Address</label>
                        <div className="input-group">
                            <span className="input-group-text bg-secondary border-secondary text-light">
                                <i className="bi bi-envelope-fill"></i>
                            </span>
                            <input
                                type="email"
                                name="email"
                                className="form-control bg-dark text-white border-secondary"
                                placeholder="admin@merndine.com"
                                value={credentials.email}
                                onChange={onChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Admin Password */}
                    <div className="mb-4">
                        <label className="form-label text-light small fw-medium">Admin Password</label>
                        <div className="input-group">
                            <span className="input-group-text bg-secondary border-secondary text-light">
                                <i className="bi bi-lock-fill"></i>
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                className="form-control bg-dark text-white border-secondary"
                                placeholder="Enter admin password"
                                value={credentials.password}
                                onChange={onChange}
                                required
                            />
                            <button
                                type="button"
                                className="btn btn-outline-secondary text-light border-secondary"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn w-100 fw-bold py-2 text-white shadow-sm mb-3"
                        style={{ backgroundColor: '#fd5631', borderColor: '#fd5631' }}
                    >
                        {loading ? (
                            <span>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Verifying...
                            </span>
                        ) : (
                            <span>
                                <i className="bi bi-box-arrow-in-right me-2"></i> Access Admin Dashboard
                            </span>
                        )}
                    </button>
                </form>

                <div className="text-center mt-3 border-top border-secondary pt-3">
                    <Link to="/" className="text-muted text-decoration-none small">
                        <i className="bi bi-arrow-left me-1"></i> Back to Customer Portal
                    </Link>
                </div>
            </div>

            <footer className="text-center text-muted small mt-4">
                &copy; {new Date().getFullYear()} Mern Dine Food Delivery • Admin System
            </footer>
        </div>
    );
}
