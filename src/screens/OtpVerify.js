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
            localStorage.setItem("authToken", data.data.access_token);
            localStorage.setItem("userData", JSON.stringify(data.data));
            console.log("userData===", JSON.parse(localStorage.getItem("userData")).email); // this the way of using the object in setItem-getItem
            navigate('/', { state: { credentials: location.state.credentials } });
        } else {
            localStorage.removeItem('authToken')
            alert("Invalid OTP, Please try again");
        }
    };

    return (
        <div>
            <Navbar />
            <div className="d-flex flex-column align-items-center mt-5">
                <p className="text-muted small mb-1">(You'll receive an OTP call on your registered Phone Number)</p>
                <div className="text-center p-4 border rounded" style={{ width: "300px" }}>
                    <h4 className="mb-3">Verify OTP</h4>
                    <input
                        type="text"
                        className="form-control mb-3 text-center"
                        placeholder="Enter 4-digit OTP"
                        name='otp'
                        value={form.otp}
                        onChange={handleChange}
                        maxLength="4"
                    />
                    <button className="btn btn-info w-100" onClick={verifyOtpButton}>Verify</button>
                </div>
            </div>
        </div>
    );
};

export default OtpVerify;
