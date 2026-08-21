import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Cart from '../screens/Cart';
import Modal from './Modal';

export default function Navbar(props) {
    const [cartView, setCartView] = useState(false)
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('authToken')
        navigate('/')
    }

    const [getCartItems, setGetCartItems] = useState([]);
    const handleGetCartItems = async () => {
        try {
            let res = await fetch(`${process.env.REACT_APP_BASE_URL}/fetch/cart/items`, {
                method: 'GET',
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json',
                },
            });
            let cartItems = await res.json();
            let items = cartItems.data || [];
            
            if ((!items || items.length === 0) && localStorage.getItem("pendingCartItems")) {
                try {
                    items = JSON.parse(localStorage.getItem("pendingCartItems"));
                } catch (e) {}
            }
            setGetCartItems(items || []);
        } catch (err) {
            console.error("Error fetching cart items:", err);
            if (localStorage.getItem("pendingCartItems")) {
                try {
                    setGetCartItems(JSON.parse(localStorage.getItem("pendingCartItems")));
                } catch (e) {}
            }
        }
    };

    useEffect(() => {
        if (location.state?.openCart) {
            setCartView(true);
        }
    }, [location.state]);

    useEffect(() => {
        if (localStorage.getItem('authToken')) {
            handleGetCartItems()
        }

        const handleCartUpdate = () => {
            if (localStorage.getItem('authToken')) {
                handleGetCartItems()
            }
        }

        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        }
    }, [])


    return (
        <div>
            <nav className="navbar navbar-expand-lg navbar-dark glass-navbar sticky-top py-2 px-3 shadow">
                <div className="container-fluid">
                    <Link className="navbar-brand d-flex align-items-center me-4" to="/">
                        <img 
                            src={process.env.REACT_APP_ICON || "https://imgs.search.brave.com/_xF5ysFMOhnGQvZ1EDChebtqgVBEubaK3iatWuQR0SI/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/dHJpb2FuZ2xlLmNv/bS9pbWFnZXMvdWJl/cmVhdHMtY2xvbmUv/ZnJlZS1hcHAtc3Vi/bWlzc2lvbi53ZWJw"}
                            alt="logo" 
                            width="40" 
                            height="40" 
                            className="rounded-circle me-2 border border-warning"
                        />
                        <span className="fs-3 fw-bold tracking-tight text-white">
                            Mern <span style={{ color: 'var(--primary-color)' }}>Dine</span>
                        </span>
                    </Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0 fw-semibold">
                            <li className="nav-item">
                                <Link className="nav-link active d-flex align-items-center" to="/">
                                    <i className="bi bi-house-door me-1"></i> Home
                                </Link>
                            </li>
                            {
                                localStorage.getItem('authToken')
                                ? (
                                    <li className="nav-item">
                                        <Link className="nav-link active d-flex align-items-center" to="/myorders">
                                            <i className="bi bi-receipt me-1"></i> My Orders
                                        </Link>
                                    </li>
                                )
                                : ''
                            }
                        </ul>
                        <div>
                            {
                                localStorage.getItem('authToken') 
                                ? (
                                    <div className="d-flex align-items-center flex-wrap gap-2">
                                        <span 
                                            className="badge bg-dark border border-warning text-warning fs-6 px-3 py-2 rounded-pill cursor-pointer"
                                            onClick={()=>{navigate('/myorders')}}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <i className="bi bi-person-fill me-1"></i> {localStorage.getItem("loggedInUserName")}
                                        </span>

                                        <button className="btn btn-brand d-inline-flex align-items-center px-3 py-2" onClick={() => { setCartView(true); }}>
                                            <i className="bi bi-cart3 me-2 fs-5"></i> My Cart
                                            {getCartItems && getCartItems.length > 0 && (
                                                <span className="badge bg-warning text-dark ms-2 rounded-pill fw-bold">
                                                    {getCartItems.length}
                                                </span>
                                            )}
                                        </button>

                                        {
                                            cartView 
                                            ? (
                                                <Modal onClose={() => { setCartView(false); handleGetCartItems(); }}>
                                                    <Cart onCartChange={() => handleGetCartItems()} />
                                                </Modal>
                                            ) 
                                            : ''
                                        }

                                        <button className="btn btn-outline-danger px-3 py-2 fw-semibold" onClick={handleLogout}>
                                            <i className="bi bi-box-arrow-right me-1"></i> Logout
                                        </button>
                                    </div>
                                )
                                : (
                                    <div className="d-flex gap-2">
                                        <Link className="btn btn-outline-warning fw-semibold px-3 py-2" to="/login">Login</Link>
                                        <Link className="btn btn-brand fw-semibold px-3 py-2" to="/signup">Sign Up</Link>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>
            </nav>

            {/* Floating View Cart Button when items are present */}
            {
                localStorage.getItem('authToken') && getCartItems && getCartItems.length > 0 && !cartView && (
                    <div 
                        className="position-fixed bottom-0 end-0 m-3 m-sm-4" 
                        style={{ zIndex: 1040 }}
                    >
                        <button
                            type="button"
                            className="btn btn-brand rounded-pill px-4 py-3 shadow-lg d-flex align-items-center gap-3 border border-warning float-cart-btn"
                            onClick={() => setCartView(true)}
                            style={{
                                boxShadow: '0 8px 25px rgba(253, 86, 49, 0.55)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div className="position-relative d-flex align-items-center">
                                <i className="bi bi-cart3 fs-4 text-white"></i>
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark fw-bold px-2 py-1 shadow-sm">
                                    {getCartItems.length}
                                </span>
                            </div>
                            <span className="fw-bold fs-6 text-white text-uppercase tracking-wider ms-1">View Cart</span>
                            <span className="badge bg-dark bg-opacity-50 text-warning px-2 py-1.5 rounded-pill small fw-semibold border border-warning opacity-90">
                                ₹{getCartItems.reduce((total, item) => total + (item.total_amount || 0), 0)}/-
                            </span>
                        </button>
                    </div>
                )
            }
        </div>
    )
}

