import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Cart from '../screens/Cart';
import Modal from './Modal';
import OrderTrackerModal from './OrderTrackerModal';

export default function Navbar() {
    const [cartView, setCartView] = useState(false);
    const [isNavExpanded, setIsNavExpanded] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    
    const [getCartItems, setGetCartItems] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [activeOrder, setActiveOrder] = useState(null);
    const [showOrderTracker, setShowOrderTracker] = useState(false);

    // Location editing modal states
    const [editLocationInput, setEditLocationInput] = useState('');
    const [locatingGPS, setLocatingGPS] = useState(false);
    const [locationUpdateMsg, setLocationUpdateMsg] = useState(null);
    const [locationUpdateError, setLocationUpdateError] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const profileDropdownRef = useRef(null);

    const isLoggedIn = !!localStorage.getItem('authToken');

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close mobile nav on route change
    useEffect(() => {
        setIsNavExpanded(false);
        setProfileDropdownOpen(false);
    }, [location.pathname]);

    // Handle user logout
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('loggedInUserName');
        localStorage.removeItem('userData');
        setUserProfile(null);
        setActiveOrder(null);
        setGetCartItems([]);
        setProfileDropdownOpen(false);
        window.dispatchEvent(new Event('cartUpdated'));
        navigate('/login');
    };

    // Fetch Cart Items
    const handleGetCartItems = async () => {
        if (!isLoggedIn) return;
        try {
            const baseUrl = process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api';
            const cleanBase = baseUrl.replace(/\/$/, '');
            let res = await fetch(`${cleanBase}/fetch/cart/items`, {
                method: 'GET',
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json',
                },
            });
            if (res.ok) {
                let cartItems = await res.json();
                let items = cartItems.data || [];
                setGetCartItems(items || []);
            }
        } catch (err) {
            console.warn("Cart fetch warning:", err);
            if (localStorage.getItem("pendingCartItems")) {
                try {
                    setGetCartItems(JSON.parse(localStorage.getItem("pendingCartItems")));
                } catch (e) {}
            }
        }
    };

    // Fetch User Profile & Active Order
    const fetchUserDataAndActiveOrder = async () => {
        if (!isLoggedIn) return;
        const baseUrl = process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api';
        const cleanBase = baseUrl.replace(/\/$/, '');
        const token = localStorage.getItem("authToken");

        // 1. Load cached user profile from localStorage first
        try {
            const cachedUser = localStorage.getItem("userData");
            if (cachedUser) {
                const parsed = JSON.parse(cachedUser);
                setUserProfile(parsed);
                setEditLocationInput(parsed.location || '');
            }
        } catch (e) {}

        // 2. Fetch fresh profile from API
        try {
            const profRes = await fetch(`${cleanBase}/user/profile`, {
                headers: { "authorization": `Bearer ${token}` }
            });
            if (profRes.ok) {
                const profData = await profRes.json();
                if (profData.success && profData.data) {
                    setUserProfile(profData.data);
                    setEditLocationInput(profData.data.location || '');
                    localStorage.setItem("userData", JSON.stringify(profData.data));
                    if (profData.data.name) {
                        localStorage.setItem("loggedInUserName", profData.data.name);
                    }
                }
            }
        } catch (e) {
            console.warn("User profile fetch warning:", e);
        }

        // 3. Fetch active order
        try {
            const orderRes = await fetch(`${cleanBase}/user/active-order`, {
                headers: { "authorization": `Bearer ${token}` }
            });
            if (orderRes.ok) {
                const orderData = await orderRes.json();
                if (orderData.success && orderData.data) {
                    setActiveOrder(orderData.data);
                } else {
                    setActiveOrder(null);
                }
            }
        } catch (e) {}
    };

    useEffect(() => {
        if (location.state?.openCart) {
            setCartView(true);
        }
    }, [location.state]);

    useEffect(() => {
        if (isLoggedIn) {
            handleGetCartItems();
            fetchUserDataAndActiveOrder();
        }

        const handleCartUpdate = () => {
            if (localStorage.getItem('authToken')) {
                handleGetCartItems();
                fetchUserDataAndActiveOrder();
            } else {
                setGetCartItems([]);
                setUserProfile(null);
                setActiveOrder(null);
            }
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn]);

    // Handle Detect GPS Location in Location Modal
    const handleDetectGPSInModal = () => {
        if (!navigator.geolocation) {
            setLocationUpdateError("Geolocation is not supported by your browser.");
            return;
        }

        setLocatingGPS(true);
        setLocationUpdateError(null);
        setLocationUpdateMsg(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    const detectedAddress = data.display_name || `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
                    setEditLocationInput(detectedAddress);
                    setLocationUpdateMsg("Location detected! Click 'Save Delivery Address' below to confirm.");
                } catch (err) {
                    console.error("Reverse geocoding error:", err);
                    setEditLocationInput(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
                } finally {
                    setLocatingGPS(false);
                }
            },
            (err) => {
                console.error("Location error:", err);
                setLocationUpdateError("Unable to retrieve location. Please type your delivery address manually.");
                setLocatingGPS(false);
            },
            { timeout: 10000 }
        );
    };

    // Save Updated Delivery Location
    const handleSaveLocation = async (e) => {
        if (e) e.preventDefault();
        if (!editLocationInput || editLocationInput.trim().length < 3) {
            setLocationUpdateError("Please enter a valid address (at least 3 characters).");
            return;
        }

        const newLoc = editLocationInput.trim();
        setLocationUpdateError(null);

        // Update local state and cache immediately
        const updatedProf = { ...(userProfile || {}), location: newLoc };
        setUserProfile(updatedProf);
        localStorage.setItem("userData", JSON.stringify(updatedProf));

        if (isLoggedIn) {
            try {
                const baseUrl = process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api';
                const cleanBase = baseUrl.replace(/\/$/, '');
                await fetch(`${cleanBase}/user/update-location`, {
                    method: 'POST',
                    headers: {
                        "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ location: newLoc })
                });
            } catch (err) {
                console.warn("Location save API warning:", err);
            }
        }

        setLocationUpdateMsg("Delivery location updated successfully!");
        setTimeout(() => {
            setShowLocationModal(false);
            setLocationUpdateMsg(null);
        }, 1200);
    };

    // Calculate cart totals
    const cartItemCount = getCartItems.length;
    const cartTotalPrice = getCartItems.reduce((total, item) => total + (item.total_amount || 0), 0);

    // Display Name & Location
    const userName = userProfile?.name || localStorage.getItem("loggedInUserName") || "Foodie User";
    const userLocation = userProfile?.location || "Connaught Place, New Delhi";
    const shortLocation = userLocation.length > 26 ? `${userLocation.substring(0, 23)}...` : userLocation;

    return (
        <header className="sticky-top" style={{ zIndex: 1050 }}>
            <nav className="navbar glass-navbar border-bottom border-secondary border-opacity-25 py-2 px-2.5 px-md-4 shadow-sm">
                <div className="container-fluid px-0 px-sm-2 d-flex align-items-center justify-content-between">
                    
                    {/* 1. Left Group: Brand Logo & Compact Location Button */}
                    <div className="d-flex align-items-center gap-1.5 gap-sm-2.5 overflow-hidden">
                        {/* Brand Logo */}
                        <Link className="navbar-brand d-flex align-items-center gap-2 m-0 p-0" to="/">
                            <div className="brand-logo-badge d-flex align-items-center justify-content-center rounded-circle shadow-sm" style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #fd5631 0%, #d9381e 100%)' }}>
                                <i className="bi bi-fire text-white fs-6"></i>
                            </div>
                            <div className="d-flex flex-column justify-content-center">
                                <span className="fs-5 fw-extrabold text-white tracking-tight" style={{ lineHeight: '1.1' }}>
                                    Mern <span style={{ color: 'var(--primary-color)' }}>Dine</span>
                                </span>
                                <span className="extra-small text-warning fw-bold tracking-wider d-none d-sm-inline" style={{ fontSize: '0.6rem', letterSpacing: '0.08em' }}>
                                    FOOD EXPRESS
                                </span>
                            </div>
                        </Link>

                        {/* Compact Location Pill Button (Mobile & Desktop) */}
                        <button 
                            type="button"
                            className="btn mobile-location-btn d-flex align-items-center gap-1.5 ms-1 ms-sm-2 text-truncate"
                            title={`Deliver to: ${userLocation}. Tap to change.`}
                            onClick={() => {
                                setEditLocationInput(userLocation);
                                setShowLocationModal(true);
                                setLocationUpdateMsg(null);
                                setLocationUpdateError(null);
                            }}
                        >
                            <i className="bi bi-geo-alt-fill text-warning flex-shrink-0" style={{ fontSize: '0.825rem' }}></i>
                            <span className="text-white text-truncate fw-semibold" style={{ fontSize: '0.78rem' }}>{shortLocation}</span>
                            <i className="bi bi-chevron-down text-warning extra-small opacity-75 flex-shrink-0 ms-auto"></i>
                        </button>
                    </div>

                    {/* 2. Right Group: Desktop Nav/Profile & Mobile Action Controls */}
                    <div className="d-flex align-items-center gap-2 ms-2">
                        
                        {/* DESKTOP NAVIGATION BAR (Visible on >= 992px) */}
                        <div className="d-none d-lg-flex align-items-center gap-3">
                            
                            {/* Nav Links */}
                            <ul className="navbar-nav d-flex flex-row align-items-center fw-semibold gap-3 me-2 mb-0">
                                <li className="nav-item">
                                    <Link 
                                        className={`nav-link px-3 py-1.5 rounded-3 d-flex align-items-center gap-2 ${location.pathname === '/' ? 'text-warning active bg-dark bg-opacity-60 fw-bold border border-secondary border-opacity-40' : 'text-white-50'}`} 
                                        to="/"
                                    >
                                        <i className="bi bi-house-door-fill text-warning"></i> <span>Home</span>
                                    </Link>
                                </li>

                                {isLoggedIn && (
                                    <li className="nav-item">
                                        <Link 
                                            className={`nav-link px-3 py-1.5 rounded-3 d-flex align-items-center gap-2 ${location.pathname === '/myorders' ? 'text-warning active bg-dark bg-opacity-60 fw-bold border border-secondary border-opacity-40' : 'text-white-50'}`} 
                                            to="/myorders"
                                        >
                                            <i className="bi bi-receipt-cutoff text-warning"></i> <span>My Orders</span>
                                        </Link>
                                    </li>
                                )}

                                {/* Active Order Live Tracking Badge */}
                                {isLoggedIn && activeOrder && (
                                    <li className="nav-item">
                                        <button 
                                            type="button"
                                            className="nav-link btn btn-link text-warning active bg-warning bg-opacity-10 px-3 py-1.5 rounded-pill d-flex align-items-center gap-2 border border-warning border-opacity-40 animate-pulse text-decoration-none"
                                            onClick={() => setShowOrderTracker(true)}
                                        >
                                            <i className="bi bi-bicycle text-warning fs-6"></i>
                                            <span className="small fw-bold">Live Delivery</span>
                                            <span className="badge bg-warning text-dark extra-small rounded-pill">Track</span>
                                        </button>
                                    </li>
                                )}
                            </ul>

                            {/* Cart Button */}
                            <button 
                                type="button"
                                className="btn btn-brand d-inline-flex align-items-center gap-2 px-3.5 py-1.5 shadow-sm rounded-pill font-weight-semibold" 
                                onClick={() => setCartView(true)}
                            >
                                <i className="bi bi-bag-check-fill fs-6"></i>
                                <span>My Cart</span>
                                {cartItemCount > 0 && (
                                    <span className="badge bg-warning text-dark rounded-pill fw-bold ms-0.5">
                                        {cartItemCount}
                                    </span>
                                )}
                                {cartTotalPrice > 0 && (
                                    <span className="extra-small text-white-50 bg-dark bg-opacity-40 px-2 py-0.5 rounded-pill border border-warning border-opacity-30 ms-0.5" style={{ fontSize: '0.78rem' }}>
                                        ₹{cartTotalPrice}
                                    </span>
                                )}
                            </button>

                            {/* Profile Dropdown Button */}
                            {isLoggedIn ? (
                                <div className="position-relative" ref={profileDropdownRef} style={{ zIndex: 1060 }}>
                                    <button 
                                        type="button"
                                        className="btn btn-dark border border-secondary border-opacity-70 text-white rounded-pill px-3 py-1.5 d-flex align-items-center gap-2 shadow-sm hover-border-warning"
                                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                    >
                                        <div className="bg-warning text-dark fw-bold rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '28px', height: '28px', fontSize: '0.85rem' }}>
                                            {userName.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="fw-semibold small d-none d-sm-inline text-truncate" style={{ maxWidth: '110px' }}>
                                            {userName}
                                        </span>
                                        <i className="bi bi-chevron-down extra-small text-white-50"></i>
                                    </button>

                                    {/* Dropdown Menu Modal Card */}
                                    {profileDropdownOpen && (
                                        <div 
                                            className="position-absolute end-0 mt-2 py-2 bg-dark rounded-3 border border-secondary shadow-lg text-start"
                                            style={{ width: '270px', background: '#0f172a', zIndex: 1070, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.75)' }}
                                        >
                                            <div className="px-3 py-2 border-bottom border-secondary border-opacity-50">
                                                <div className="fw-bold text-white small text-truncate">{userName}</div>
                                                <div className="text-white-50 extra-small text-truncate">{userProfile?.email || 'Registered User'}</div>
                                                {userProfile?.phone_number && (
                                                    <div className="text-warning extra-small mt-0.5"><i className="bi bi-telephone me-1"></i>+91 {userProfile.phone_number}</div>
                                                )}
                                            </div>

                                            <div className="px-3 py-2 border-bottom border-secondary border-opacity-30">
                                                <span className="extra-small text-white-50 d-block mb-1">DELIVERY ADDRESS:</span>
                                                <span className="extra-small text-white text-truncate d-block fw-medium">
                                                    <i className="bi bi-geo-alt text-warning me-1"></i>{userLocation}
                                                </span>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-link text-warning p-0 extra-small text-decoration-none mt-1 fw-semibold"
                                                    onClick={() => {
                                                        setProfileDropdownOpen(false);
                                                        setEditLocationInput(userLocation);
                                                        setShowLocationModal(true);
                                                    }}
                                                >
                                                    <i className="bi bi-pencil me-1"></i>Change Address
                                                </button>
                                            </div>

                                            <div className="py-1">
                                                <Link 
                                                    to="/myorders" 
                                                    className="dropdown-item px-3 py-2 text-white-50 hover-text-warning d-flex align-items-center gap-2.5 small"
                                                    onClick={() => setProfileDropdownOpen(false)}
                                                >
                                                    <i className="bi bi-box-seam text-warning"></i> Order History
                                                </Link>

                                                {activeOrder && (
                                                    <button 
                                                        type="button"
                                                        className="dropdown-item px-3 py-2 text-warning d-flex align-items-center gap-2.5 small bg-transparent border-0 w-100 text-start"
                                                        onClick={() => { setShowOrderTracker(true); setProfileDropdownOpen(false); }}
                                                    >
                                                        <i className="bi bi-bicycle text-warning"></i> Track Active Order
                                                    </button>
                                                )}

                                                <button 
                                                    type="button"
                                                    className="dropdown-item px-3 py-2 text-danger d-flex align-items-center gap-2.5 small bg-transparent border-0 w-100 text-start mt-1 border-top border-secondary border-opacity-40"
                                                    onClick={handleLogout}
                                                >
                                                    <i className="bi bi-box-arrow-right"></i> Log Out Account
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="d-flex align-items-center gap-2">
                                    <Link className="btn btn-outline-warning fw-semibold px-3 py-1.5 rounded-pill small" to="/login">
                                        Log In
                                    </Link>
                                    <Link className="btn btn-brand fw-bold px-3.5 py-1.5 rounded-pill small shadow-sm" to="/signup">
                                        Sign Up
                                    </Link>
                                </div>
                            )}

                        </div>

                        {/* MOBILE QUICK ACTION BUTTONS (Visible on < 992px) */}
                        <div className="d-flex align-items-center gap-2 d-lg-none">
                            {/* Mobile Cart Icon */}
                            <button 
                                type="button"
                                className="mobile-icon-btn position-relative"
                                onClick={() => setCartView(true)}
                                aria-label="View Cart"
                                title="My Cart"
                            >
                                <i className="bi bi-bag-fill text-warning fs-6"></i>
                                {cartItemCount > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark extra-small fw-bold border border-dark px-1.5 py-0.5">
                                        {cartItemCount}
                                    </span>
                                )}
                            </button>

                            {/* Mobile Hamburger Menu Toggle Button */}
                            <button 
                                className="mobile-icon-btn border-0 text-white"
                                type="button" 
                                onClick={() => setIsNavExpanded(!isNavExpanded)}
                                aria-expanded={isNavExpanded}
                                aria-label="Toggle navigation"
                            >
                                <i className={`bi ${isNavExpanded ? 'bi-x-lg text-danger' : 'bi-list text-warning'} fs-5`}></i>
                            </button>
                        </div>

                    </div>
                </div>
            </nav>

            {/* POLISHED MOBILE NAVIGATION DRAWER (Slide-down Menu Overlay) */}
            {isNavExpanded && (
                <>
                    <div className="mobile-nav-backdrop d-lg-none" onClick={() => setIsNavExpanded(false)} />
                    <div className="mobile-nav-drawer d-lg-none" onClick={(e) => e.stopPropagation()}>
                        
                        {/* User Profile Header in Mobile Drawer */}
                        <div className="d-flex align-items-center justify-content-between p-3 mb-3 bg-dark bg-opacity-75 rounded-3 border border-secondary border-opacity-50">
                            {isLoggedIn ? (
                                <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                                    <div className="bg-warning text-dark fw-bold rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="d-flex flex-column text-truncate">
                                        <span className="fw-bold text-white small text-truncate">{userName}</span>
                                        <span className="extra-small text-white-50 text-truncate">{userProfile?.email || 'Logged in user'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="d-flex align-items-center gap-2">
                                    <div className="brand-logo-badge d-flex align-items-center justify-content-center rounded-circle shadow-sm" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #fd5631 0%, #d9381e 100%)' }}>
                                        <i className="bi bi-fire text-white fs-6"></i>
                                    </div>
                                    <div className="d-flex flex-column">
                                        <span className="fw-bold text-white small">Welcome to Mern Dine</span>
                                        <span className="extra-small text-white-50">Sign in to order food</span>
                                    </div>
                                </div>
                            )}
                            <button type="button" className="btn-close btn-close-white ms-2" onClick={() => setIsNavExpanded(false)}></button>
                        </div>

                        {/* Location Row inside Drawer */}
                        <div className="p-2.5 mb-3 bg-dark bg-opacity-50 rounded-3 border border-secondary border-opacity-30 d-flex align-items-center justify-content-between gap-2">
                            <div className="d-flex align-items-center gap-2 text-truncate">
                                <i className="bi bi-geo-alt-fill text-warning flex-shrink-0"></i>
                                <div className="d-flex flex-column text-truncate">
                                    <span className="extra-small text-white-50" style={{ fontSize: '0.65rem' }}>DELIVERING TO</span>
                                    <span className="extra-small text-white text-truncate fw-semibold">{userLocation}</span>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                className="btn btn-outline-warning btn-sm extra-small py-1 px-2 rounded-pill flex-shrink-0 fw-semibold"
                                onClick={() => {
                                    setIsNavExpanded(false);
                                    setEditLocationInput(userLocation);
                                    setShowLocationModal(true);
                                }}
                            >
                                Change
                            </button>
                        </div>

                        {/* Drawer Navigation Links */}
                        <div className="d-flex flex-column gap-2 mb-3">
                            <Link 
                                to="/" 
                                className={`mobile-drawer-item ${location.pathname === '/' ? 'active' : ''}`}
                                onClick={() => setIsNavExpanded(false)}
                            >
                                <i className="bi bi-house-door-fill text-warning fs-5"></i>
                                <span>Home Menu</span>
                            </Link>

                            {isLoggedIn && (
                                <Link 
                                    to="/myorders" 
                                    className={`mobile-drawer-item ${location.pathname === '/myorders' ? 'active' : ''}`}
                                    onClick={() => setIsNavExpanded(false)}
                                >
                                    <i className="bi bi-receipt-cutoff text-warning fs-5"></i>
                                    <span>Order History</span>
                                </Link>
                            )}

                            {isLoggedIn && activeOrder && (
                                <button 
                                    type="button"
                                    className="mobile-drawer-item text-warning border-warning border-opacity-40 animate-pulse"
                                    onClick={() => { setShowOrderTracker(true); setIsNavExpanded(false); }}
                                >
                                    <i className="bi bi-bicycle text-warning fs-5"></i>
                                    <div className="d-flex align-items-center justify-content-between w-100">
                                        <span>Track Live Delivery</span>
                                        <span className="badge bg-warning text-dark extra-small rounded-pill">Active Order</span>
                                    </div>
                                </button>
                            )}

                            <button 
                                type="button"
                                className="mobile-drawer-item"
                                onClick={() => { setCartView(true); setIsNavExpanded(false); }}
                            >
                                <i className="bi bi-bag-check-fill text-warning fs-5"></i>
                                <div className="d-flex align-items-center justify-content-between w-100">
                                    <span>My Cart</span>
                                    {cartItemCount > 0 ? (
                                        <span className="badge bg-warning text-dark extra-small rounded-pill fw-bold">
                                            {cartItemCount} items (₹{cartTotalPrice})
                                        </span>
                                    ) : (
                                        <span className="extra-small text-white-50">Empty</span>
                                    )}
                                </div>
                            </button>
                        </div>

                        {/* Auth & Logout Actions inside Drawer */}
                        <div className="pt-2 border-top border-secondary border-opacity-40">
                            {isLoggedIn ? (
                                <button 
                                    type="button" 
                                    className="btn btn-outline-danger w-100 py-2 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 small"
                                    onClick={handleLogout}
                                >
                                    <i className="bi bi-box-arrow-right fs-6"></i>
                                    <span>Log Out Account</span>
                                </button>
                            ) : (
                                <div className="d-flex gap-2">
                                    <Link 
                                        to="/login" 
                                        className="btn btn-outline-warning flex-fill py-2 rounded-3 fw-bold small text-center"
                                        onClick={() => setIsNavExpanded(false)}
                                    >
                                        Log In
                                    </Link>
                                    <Link 
                                        to="/signup" 
                                        className="btn btn-brand flex-fill py-2 rounded-3 fw-bold small text-center shadow-sm"
                                        onClick={() => setIsNavExpanded(false)}
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>

                    </div>
                </>
            )}

            {/* Interactive Delivery Location Modal (When user clicks 'Deliver to') */}
            {showLocationModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-content p-4 text-white shadow-lg" style={{ maxWidth: '520px', width: '92%', zIndex: 1080 }}>
                        <div className="d-flex align-items-center justify-content-between border-bottom border-secondary pb-3 mb-3">
                            <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-geo-alt-fill text-warning fs-4"></i>
                                <h5 className="fw-bold mb-0 text-white">Select Delivery Location</h5>
                            </div>
                            <button type="button" className="btn-close btn-close-white" onClick={() => setShowLocationModal(false)}></button>
                        </div>

                        {locationUpdateMsg && (
                            <div className="alert auth-success-alert p-2.5 mb-3 small d-flex align-items-center gap-2">
                                <i className="bi bi-check-circle-fill"></i>
                                <span>{locationUpdateMsg}</span>
                            </div>
                        )}

                        {locationUpdateError && (
                            <div className="alert auth-error-alert p-2.5 mb-3 small d-flex align-items-center gap-2">
                                <i className="bi bi-exclamation-triangle-fill"></i>
                                <span>{locationUpdateError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveLocation}>
                            <div className="mb-3">
                                <label htmlFor="deliveryAddressInput" className="form-label text-white-50 small fw-semibold">
                                    Delivery Address
                                </label>
                                <div className="input-group auth-input-group">
                                    <span className="input-group-text"><i className="bi bi-geo-alt"></i></span>
                                    <input
                                        type="text"
                                        id="deliveryAddressInput"
                                        className="form-control"
                                        placeholder="Type your address or click Detect GPS..."
                                        value={editLocationInput}
                                        onChange={(e) => setEditLocationInput(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Detect GPS Location Button */}
                            <div className="mb-4">
                                <button
                                    type="button"
                                    className="btn btn-outline-warning w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 small"
                                    onClick={handleDetectGPSInModal}
                                    disabled={locatingGPS}
                                >
                                    {locatingGPS ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            <span>Detecting Live GPS...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-crosshair fs-6"></i>
                                            <span>Detect Current Location via GPS</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="d-flex justify-content-end gap-2 border-top border-secondary pt-3">
                                <button type="button" className="btn btn-outline-light px-3 py-2 small" onClick={() => setShowLocationModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-brand px-4 py-2 small fw-bold">
                                    Save Delivery Address
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Cart Modal Container */}
            {cartView && (
                <Modal onClose={() => { setCartView(false); handleGetCartItems(); }}>
                    <Cart onCartChange={() => handleGetCartItems()} />
                </Modal>
            )}

            {/* Active Order Tracker Modal */}
            {showOrderTracker && activeOrder && (
                <OrderTrackerModal 
                    order={activeOrder} 
                    onClose={() => setShowOrderTracker(false)} 
                />
            )}

            {/* Floating Quick View Cart Button (Mobile & Desktop) */}
            {isLoggedIn && cartItemCount > 0 && !cartView && (
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
                            <i className="bi bi-bag-check-fill fs-4 text-white"></i>
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark fw-bold px-2 py-1 shadow-sm">
                                {cartItemCount}
                            </span>
                        </div>
                        <span className="fw-bold fs-6 text-white text-uppercase tracking-wider ms-1">View Cart</span>
                        <span className="badge bg-dark bg-opacity-50 text-warning px-2.5 py-1.5 rounded-pill small fw-semibold border border-warning opacity-90">
                            ₹{cartTotalPrice}/-
                        </span>
                    </button>
                </div>
            )}
        </header>
    );
}
