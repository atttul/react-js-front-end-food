import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Login() {
    const [credentials, setCredentials] = useState({ email: "", password: "" });
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

        localStorage.setItem("authToken", userKey.data);

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
        localStorage.setItem("loginData", loginData.data.email);
        console.log("Login User Data=", loginData.data);

        if (!loginData.success) {
            alert(loginData.message || "Login failed");
            return;
        }

        navigate('/');
    };

    const onChange = (event) => {
        setCredentials({ ...credentials, [event.target.name]: event.target.value });
    };

    return (
        <div>
            <div><Navbar /></div>
            <form className='container' onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input
                        type="email"
                        className="form-control"
                        id="email"
                        name='email'
                        value={credentials.email}
                        onChange={onChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                        type="password"
                        className="form-control"
                        id="password"
                        name='password'
                        value={credentials.password}
                        onChange={onChange}
                        required
                    />
                </div>
                <button type="submit" className="m-3 btn btn-success">Submit</button>
                <Link to='/signup' className='m-3 btn btn-danger'>Signup User</Link>
            </form>
        </div>
    );
}
