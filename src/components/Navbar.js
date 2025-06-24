import React, { useState, useEffect } from 'react'
import {
    Link,
    useNavigate
} from 'react-router-dom';
import Badge from 'react-bootstrap/Badge'
import Cart from '../screens/Cart';
import Modal from './Modal';
import { useCart } from './ContextReducer';

export default function Navbar(props) {
    const [cartView, setCartView] = useState(false)
    const [getCartItems, setGetCartItems] = useState([]);

    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem('authToken')
        navigate('/')
    }

    const handleGetCartItems = async () => {
        let cartItems = await fetch('http://localhost:5000/api/fetch/cart/items', {
            method: 'GET',
            headers: {
                // "authorization": `bearer ${localStorage.getItem("authToken")}`,
                "authorization": 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODU2M2U3NmYyZTljMTk4NjIzZjVhZjkiLCJpYXQiOjE3NTA0ODI1NTB9.D3piMaGxxrhCmY2pogTc-FTAhOju4k-4vmtTHqHsNHE',
                'Content-Type': 'application/json',
            },
        })
        cartItems = await cartItems.json();
        setGetCartItems(cartItems.data)
    }

    useEffect(()=>{
        handleGetCartItems()
    }, [])

    return (
        <div>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container-fluid">
                    <Link className="navbar-brand fs-1 fst-italic" to="/">GoFood</Link>
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li>
                            <Link className="nav-link active" to="/">Home</Link>
                        </li>
                        {
                            localStorage.getItem('authToken')
                                ? <div>
                                    <li>
                                        <Link className="nav-link active" to="/myorders">My Orders</Link>
                                    </li>
                                </div>
                                : ''
                        }
                    </ul>
                    <div>
                        {
                            localStorage.getItem('authToken') ? (
                                <div className="d-flex align-items-center">
                                    <button className="btn btn-success mx-2" onClick={() => {setCartView(true);}}>My Cart 
                                        {/* {console.log("props=", localStorage.getItem("count"))}
                                        <Badge pill bg="danger">{localStorage.getItem("count") || ''}</Badge> */}
                                    </button>
                                    {cartView ? (<Modal onClose={() => setCartView(false)}><Cart /></Modal>) : ''}
                                    <button className="btn btn-danger mx-2" onClick={handleLogout}>
                                        Logout
                                    </button>
                                </div>
                            ) : (<div>
                                <div className="btn btn-success m-2">
                                    <Link className="nav-link active" to="/login">Login</Link>
                                </div>
                                <div className="btn btn-success">
                                    <Link className="nav-link active" to="/signup">SignUp</Link>
                                </div>
                            </div>
                            )}
                    </div>
                </div>
            </nav>
        </div>
    )
}
