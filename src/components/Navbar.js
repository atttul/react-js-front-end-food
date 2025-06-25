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
    
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem('authToken')
        navigate('/')
    }
    
    const [getCartItems, setGetCartItems] = useState([]);
    const handleGetCartItems = async () => {
        let cartItems = await fetch(`${process.env.REACT_APP_BASE_URL}/fetch/cart/items`, {
            method: 'GET',
            headers: {
                "authorization": `Bearer ${localStorage.getItem("authToken")}`,
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
                    <Link className="navbar-brand fs-1 fst-italic" to="/">InstaMart</Link>
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
                                    <button>User: {localStorage.getItem("loginData")}</button>
                                    <button className="btn btn-info mx-2" onClick={() => {setCartView(true);}}>My Cart 
                                        {/* {console.log("props=", localStorage.getItem("count"))} */}
                                        {/* <Badge pill bg="danger">{props.cartItems.length || ''}</Badge> */}
                                    </button>
                                    {cartView ? (<Modal onClose={() => setCartView(false)}><Cart /></Modal>) : ''}
                                    <button className="btn btn-danger mx-2" onClick={handleLogout}>
                                        Logout
                                    </button>
                                </div>
                            ) : (<div>
                                {/* <div className="btn btn-success m-2"> */}
                                    <Link className="btn btn-warning m-2" to="/login">Login</Link>

                                    <Link className="btn btn-danger m-2" to="/signup">Sign Up</Link>
                                {/* </div> */}
                            </div>
                            )}
                    </div>
                </div>
            </nav>
        </div>
    )
}
