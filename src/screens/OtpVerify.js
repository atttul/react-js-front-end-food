import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const OtpVerify = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        email: location.state.credentials.email,
        phone: location.state.credentials.phone,
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
                email: location.state.credentials.email,
                otp: form.otp
            })
        });
        const data = await res.json();
        if (data.success) {
            navigate('/', { state: { credentials: location.state.credentials } });
        }
    };

    return (
        <div>
            <Navbar />
            <div style={{ padding: "2rem", marginTop: "100px", marginLeft: "200px", marginRight: "200px" }}>
                <h2>Verify OTP</h2>
                <input type="text" name="otp" placeholder="OTP" value={form.otp} onChange={handleChange} /><br />
                <button onClick={verifyOtpButton}>Verify OTP</button>
            </div>
        </div>
    );
};

export default OtpVerify;
