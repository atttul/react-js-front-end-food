import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const OtpVerify = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        email: location.state?.credentials?.email || '',
        phone: location.state?.credentials?.phone || '',
        otp: ''
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const verifyOtpButton = async () => {
        const res = await fetch(`${process.env.REACT_APP_BASE_URL}/verify/otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: location.state?.credentials?.email,
                otp: form.otp
            })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem("authToken", data.data.access_token);
            localStorage.setItem("userData", JSON.stringify(data.data));
            console.log("userData===", JSON.parse(localStorage.getItem("userData")).email);
            navigate('/', { state: { credentials: location.state?.credentials } });
        } else {
            localStorage.removeItem('authToken')
            alert("Invalid OTP, Please try again");
        }
    };

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <div className="container d-flex justify-content-center align-items-center flex-grow-1 py-5">
                <div className="card food-card p-4 p-sm-5 text-center shadow-lg border-0" style={{ maxWidth: "420px", width: "100%" }}>
                    <div className="d-inline-block p-3 rounded-circle bg-dark border border-secondary mb-3 text-info mx-auto" style={{ width: 'fit-content' }}>
                        <i className="bi bi-shield-lock-fill fs-2"></i>
                    </div>
                    <h3 className="fw-bold text-white mb-2">Verify OTP</h3>
                    <p className="text-muted small mb-4">
                        Enter the 4-digit code sent to your registered phone number <strong className="text-white">{form.phone}</strong>
                    </p>

                    <div className="mb-4">
                        <input
                            type="text"
                            className="form-control bg-dark text-white border-secondary text-center fs-3 fw-bold tracking-widest py-2"
                            placeholder="• • • •"
                            name='otp'
                            value={form.otp}
                            onChange={handleChange}
                            maxLength="4"
                            style={{ letterSpacing: '8px' }}
                        />
                    </div>

                    <button className="btn btn-brand w-100 py-2 fw-bold fs-6 mb-3" onClick={verifyOtpButton}>
                        Verify & Complete Login
                    </button>
                    
                    <span className="text-muted small">Didn't receive the call/SMS? Check phone details and try again.</span>
                </div>
            </div>
        </div>
    );
};

export default OtpVerify;

