import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Login() {
    const [credentials, setCredentials] = useState({ email: "", password: "", phone: "" });
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault(); // prevent default form submit

        // Optional: Fetch the auth token (user key) first
        const userKeyResponse = await fetch(`${process.env.REACT_APP_BASE_URL}/fetch/user  `, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });

        const userKey = await userKeyResponse.json();

        if (!userKey.success) {
            alert(userKey.message || "Invalid credentials (auth token fetch)");
            return;
        }

        // Then use that token to login
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
            alert(loginData.message || "Login failed");
            return;
        }
        localStorage.setItem("loggedInUserName", loginData.data?.name); 
        
        navigate('/otp-verify', { state: { credentials: credentials } });
    };

    const onChange = (event) => {
        setCredentials({ ...credentials, [event.target.name]: event.target.value });
    };

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <div className="container d-flex justify-content-center align-items-center flex-grow-1 py-5">
                <div className="card food-card p-4 p-sm-5 shadow-lg border-0" style={{ maxWidth: '460px', width: '100%' }}>
                    <div className="text-center mb-4">
                        <div className="d-inline-block p-3 rounded-circle bg-dark border border-secondary mb-3 text-warning">
                            <i className="bi bi-person-lock fs-2"></i>
                        </div>
                        <h3 className="fw-bold text-white mb-1">Welcome Back</h3>
                        <p className="text-muted small">Log in to your Mern Dine account</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label text-white-50 fw-semibold small">Email Address</label>
                            <div className="input-group">
                                <span className="input-group-text bg-dark text-muted border-secondary"><i className="bi bi-envelope"></i></span>
                                <input
                                    type="email"
                                    className="form-control bg-dark text-white border-secondary"
                                    id="email"
                                    name='email'
                                    placeholder="name@example.com"
                                    value={credentials.email}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="password" className="form-label text-white-50 fw-semibold small">Password</label>
                            <div className="input-group">
                                <span className="input-group-text bg-dark text-muted border-secondary"><i className="bi bi-key"></i></span>
                                <input
                                    type="password"
                                    className="form-control bg-dark text-white border-secondary"
                                    id="password"
                                    name='password'
                                    placeholder="Enter password"
                                    value={credentials.password}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="phone" className="form-label text-white-50 fw-semibold small">Phone Number</label>
                            <div className="input-group">
                                <span className="input-group-text bg-dark text-muted border-secondary"><i className="bi bi-phone"></i></span>
                                <input
                                    type="phone"
                                    className="form-control bg-dark text-white border-secondary"
                                    id="phone"
                                    name='phone'
                                    placeholder="10 digit phone number"
                                    value={credentials.phone}
                                    onChange={onChange}
                                    pattern="[0-9]{10}" 
                                    maxLength="10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="d-grid gap-2 mb-3">
                            <button type="submit" className="btn btn-brand py-2 fw-bold fs-6">Submit & Continue</button>
                        </div>

                        <div className="text-center mt-3 pt-3 border-top border-secondary">
                            <span className="text-muted small me-2">New to Mern Dine?</span>
                            <Link to='/signup' className='text-warning fw-semibold text-decoration-none small'>Create an Account</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

