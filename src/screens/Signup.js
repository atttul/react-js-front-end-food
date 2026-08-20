import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar';

export default function Signup() {
    const [credentials, setcredentials] = useState({ name: "", email: "", password: "", geolocation: "", phone: "" });
    let navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault()
        let response = await fetch(`${process.env.REACT_APP_BASE_URL}/create/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: credentials.name, email: credentials.email, password: credentials.password, location: credentials.geolocation, phone: credentials.phone })
        })
        response = await response.json();

        if (!response.success) {
            alert('User already exists in the Database, Please provide different EMAIL or PHONE NUMBER')
        } else {
            navigate('/login')
        }
    }

    const onChange = async (event) => {
        setcredentials({ ...credentials, [event.target.name]: event.target.value })
    }

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <div className="container d-flex justify-content-center align-items-center flex-grow-1 py-5">
                <div className="card food-card p-4 p-sm-5 shadow-lg border-0" style={{ maxWidth: '540px', width: '100%' }}>
                    <div className="text-center mb-4">
                        <div className="d-inline-block p-3 rounded-circle bg-dark border border-secondary mb-3 text-warning">
                            <i className="bi bi-person-plus-fill fs-2"></i>
                        </div>
                        <h3 className="fw-bold text-white mb-1">Create Account</h3>
                        <p className="text-muted small">Join Mern Dine for fast food delivery</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="name" className="form-label text-white-50 fw-semibold small">Full Name</label>
                            <input type="text" className="form-control bg-dark text-white border-secondary" id="exampleInputName1" name='name' placeholder="John Doe" value={credentials.name} onChange={onChange} required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label text-white-50 fw-semibold small">Email Address</label>
                            <input type="email" className="form-control bg-dark text-white border-secondary" id="exampleInputEmail1" name='email' placeholder="name@example.com" value={credentials.email} onChange={onChange} required />
                            <span className="text-muted small d-block mt-1">(Used for account login)</span>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label text-white-50 fw-semibold small">Password</label>
                            <input type="password" className="form-control bg-dark text-white border-secondary" id="exampleInputPassword1" name='password' placeholder="Create password" value={credentials.password} onChange={onChange} required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="address" className="form-label text-white-50 fw-semibold small">Address</label>
                            <input type="text" className="form-control bg-dark text-white border-secondary" id="exampleInputAddress1" name='geolocation' placeholder="Your delivery address" value={credentials.geolocation} onChange={onChange} required />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="phone" className="form-label text-white-50 fw-semibold small">Phone Number</label>
                            <input type="tel" className="form-control bg-dark text-white border-secondary" id="exampleInputPhone1" name='phone' placeholder="10 digit mobile number" value={credentials.phone} onChange={onChange} pattern="[0-9]{10}" maxLength="10" required />
                            <span className="text-muted small d-block mt-1">(Used for OTP verification)</span>
                        </div>

                        <div className="d-grid gap-2 mb-3">
                            <button type="submit" className="btn btn-brand py-2 fw-bold fs-6">Sign Up Now</button>
                        </div>

                        <div className="text-center mt-3 pt-3 border-top border-secondary">
                            <span className="text-muted small me-2">Already registered?</span>
                            <Link to='/login' className='text-warning fw-semibold text-decoration-none small'>Log In Here</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

