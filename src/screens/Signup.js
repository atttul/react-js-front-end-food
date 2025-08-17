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
        <div>
            <div><Navbar /></div>
            <div className='container'>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="name" className="form-label">Name</label>
                        <input type="text" className="form-control" id="exampleInputName1" name='name' value={credentials.name} onChange={onChange} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <p className="text-muted small mb-1">(Remember this Email - this will be used for login)</p>
                        <input type="email" className="form-control" id="exampleInputEmail1" name='email' value={credentials.email} onChange={onChange} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <p className="text-muted small mb-1">(Remember this Password - this will be used for login)</p>
                        <input type="password" className="form-control" id="exampleInputPassword1" name='password' value={credentials.password} onChange={onChange} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="address" className="form-label">Address</label>
                        <input type="text" className="form-control" id="exampleInputAddress1" name='geolocation' value={credentials.geolocation} onChange={onChange} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="address" className="form-label">Phone Number</label>
                        <p className="text-muted small mb-1">(Enter a valid 10-digit Number - this will be used for login and OTP verification)</p>
                        <input type="tel" className="form-control" id="exampleInputPhone1" name='phone' value={credentials.phone} onChange={onChange} pattern="[0-9]{10}" maxLength="10"/>
                    </div>
                    <button type="submit" className="m-3 btn btn-success">Submit</button>
                    <Link to='/login' className='m-3 btn btn-danger'>Already a user</Link>
                </form>
            </div>
        </div>
    )
}
