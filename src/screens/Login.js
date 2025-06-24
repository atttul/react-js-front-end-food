import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'


export default function Login() {
    const [credentials, setCredentials] = useState({ email: "", password: "" });

    let navigate = useNavigate();
    const handleSubmit = async (event) => {
        event.preventDefault()
        const response = await fetch('http://localhost:5000/api/login/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODU2M2U3NmYyZTljMTk4NjIzZjVhZjkiLCJpYXQiOjE3NTA0ODI1NTB9.D3piMaGxxrhCmY2pogTc-FTAhOju4k-4vmtTHqHsNHE'
            },
            body: JSON.stringify({ email: credentials.email, password: credentials.password })
        })
        const json = await response.json();

        if (!json.success) {
            alert(json.message)
        }
        if(json.success){
            localStorage.setItem("authToken", json.data.access_token)
            navigate('/')
        }
    }

    const onChange = async (event) => {
        setCredentials({ ...credentials, [event.target.name]: event.target.value })
    }

    return (
        <div>
            <div><Navbar /></div>
            <form className='container' onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input type="email" className="form-control" id="exampleInputEmail1" name='email' value={credentials.email} onChange={onChange} />
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input type="password" className="form-control" id="exampleInputPassword1" name='password' value={credentials.password} onChange={onChange} />
                </div>
                <button type="submit" className="m-3 btn btn-success">Submit</button>
                <Link to='/signup' className='m-3 btn btn-danger'>Singup User</Link>
            </form>
        </div>
    )
}
