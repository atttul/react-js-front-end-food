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
            <nav className="navbar navbar-expand-lg glass-navbar border-bottom border-secondary border-opacity-25 py-2.5 px-3 px-md-4 shadow">
                <div className="container-fluid px-1 px-sm-2">
                    
                    {/* 1. Brand Logo: Clear Spacing from adjacent elements */}
                    <Link className="navbar-brand d-flex align-items-center gap-2.5 me-3 me-lg-4" to="/">
                        <div className="brand-logo-badge d-flex align-items-center justify-content-center rounded-circle shadow-sm" style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #fd5631 0%, #d9381e 100%)' }}>
                            <i className="bi bi-fire text-white fs-5"></i>
                        </div>
                        <div className="d-flex flex-column justify-content-center">
                            <span className="fs-4 fw-extrabold text-white tracking-tight" style={{ lineHeight: '1.15' }}>
                                Mern <span style={{ color: 'var(--primary-color)' }}>Dine</span>
                            </span>
                            <span className="extra-small text-warning fw-bold tracking-wider pt-0.5" style={{ fontSize: '0.625rem', letterSpacing: '0.08em' }}>
                                FOOD EXPRESS
                            </span>
                        </div>
                    </Link>

                    {/* 2. Delivery Location Pill: Clear Right Margin from Home Link */}
                    <button 
                        type="button"
                        className="btn d-none d-md-flex align-items-center gap-2.5 px-3.5 py-1.5 rounded-pill bg-dark bg-opacity-80 border border-secondary border-opacity-60 text-white-50 small cursor-pointer hover-border-warning transition-all shadow-sm ms-2 me-md-3 me-lg-4"
                        title={`Current Address: ${userLocation}. Click to edit address.`}
                        onClick={() => {
                            setEditLocationInput(userLocation);
                            setShowLocationModal(true);
                            setLocationUpdateMsg(null);
                            setLocationUpdateError(null);
                        }}
                    >
                        <i className="bi bi-geo-alt-fill text-warning fs-6"></i>
                        <div className="d-flex flex-column text-start" style={{ maxWidth: '220px' }}>
                            <span className="extra-small text-white-50" style={{ fontSize: '0.65rem', lineHeight: '1' }}>DELIVER TO</span>
                            <span className="fw-semibold text-white text-truncate small" style={{ lineHeight: '1.2' }}>{shortLocation}</span>
                        </div>
                        <i className="bi bi-chevron-down extra-small text-warning ms-1 opacity-75"></i>
                    </button>

                    {/* Mobile Quick Action Buttons with Proper Spacing */}
                    <div className="d-flex align-items-center gap-2.5 d-lg-none ms-auto me-1">
                        {/* Mobile Location Quick Button */}
                        <button 
                            type="button"
                            className="btn btn-dark border border-secondary p-2 rounded-circle d-flex align-items-center justify-content-center text-warning"
                            onClick={() => {
                                setEditLocationInput(userLocation);
                                setShowLocationModal(true);
                            }}
                            title="Location"
                            style={{ width: '40px', height: '40px' }}
                        >
                            <i className="bi bi-geo-alt-fill fs-6"></i>
                        </button>

                        {/* Mobile Cart Quick Icon */}
                        {isLoggedIn && (
                            <button 
                                type="button"
                                className="btn btn-brand rounded-circle p-2 d-flex align-items-center justify-content-center position-relative shadow-sm"
                                onClick={() => setCartView(true)}
                                style={{ width: '40px', height: '40px' }}
                            >
                                <i className="bi bi-bag-fill fs-6"></i>
                                {cartItemCount > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark extra-small fw-bold border border-dark">
                                        {cartItemCount}
                                    </span>
                                )}
                            </button>
                        )}

                        <button 
                            className="navbar-toggler border-0 p-2 text-white bg-dark rounded-3 shadow-none ms-1"
                            type="button" 
                            onClick={() => setIsNavExpanded(!isNavExpanded)}
                            aria-expanded={isNavExpanded}
                            aria-label="Toggle navigation"
                        >
                            <i className={`bi ${isNavExpanded ? 'bi-x-lg' : 'bi-list'} fs-4 text-warning`}></i>
                        </button>
                    </div>

                    {/* Navbar Navigation Items */}
                    <div className={`collapse navbar-collapse ${isNavExpanded ? 'show mt-3 p-3 bg-dark bg-opacity-95 rounded-3 border border-secondary border-opacity-50 shadow-lg' : ''}`} id="navbarNav">
                        
                        {/* Navigation Links with Generous Left Margin from Address Selector */}
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0 fw-semibold gap-2 gap-lg-3 ms-lg-4 ms-xl-5">
                            <li className="nav-item">
                                <Link 
                                    className={`nav-link px-3.5 py-2 rounded-3 d-flex align-items-center gap-2 ${location.pathname === '/' ? 'text-warning active bg-dark bg-opacity-60 fw-bold border border-secondary border-opacity-40' : 'text-white-50'}`} 
                                    to="/"
                                >
                                    <i className="bi bi-house-door-fill text-warning"></i> <span>Home</span>
                                </Link>
                            </li>

                            {isLoggedIn && (
                                <li className="nav-item">
                                    <Link 
                                        className={`nav-link px-3.5 py-2 rounded-3 d-flex align-items-center gap-2 ${location.pathname === '/myorders' ? 'text-warning active bg-dark bg-opacity-60 fw-bold border border-secondary border-opacity-40' : 'text-white-50'}`} 
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
                                        className="nav-link btn btn-link text-warning active bg-warning bg-opacity-10 px-3.5 py-2 rounded-pill d-flex align-items-center gap-2 border border-warning border-opacity-40 animate-pulse text-decoration-none ms-lg-1"
                                        onClick={() => setShowOrderTracker(true)}
                                    >
                                        <i className="bi bi-bicycle text-warning fs-6"></i>
                                        <span className="small fw-bold">Live Delivery</span>
                                        <span className="badge bg-warning text-dark extra-small rounded-pill">Track</span>
                                    </button>
                                </li>
                            )}
                        </ul>

                        {/* Right Actions Container */}
                        <div className={`d-flex align-items-center flex-wrap gap-3 ${isNavExpanded ? 'pt-3 border-top border-secondary border-opacity-40 mt-2' : ''}`}>
                            {isLoggedIn ? (
                                <div className="d-flex align-items-center gap-3 w-100 w-lg-auto justify-content-between justify-content-lg-end">
                                    
                                    {/* Cart Button */}
                                    <button 
                                        type="button"
                                        className="btn btn-brand d-inline-flex align-items-center gap-2.5 px-4 py-2 shadow-sm rounded-pill font-weight-semibold" 
                                        onClick={() => setCartView(true)}
                                    >
                                        <i className="bi bi-bag-check-fill fs-5"></i>
                                        <span>My Cart</span>
                                        {cartItemCount > 0 && (
                                            <span className="badge bg-warning text-dark rounded-pill fw-bold ms-1">
                                                {cartItemCount}
                                            </span>
                                        )}
                                        {cartTotalPrice > 0 && (
                                            <span className="extra-small text-white-50 bg-dark bg-opacity-40 px-2 py-0.5 rounded-pill border border-warning border-opacity-30 ms-1" style={{ fontSize: '0.78rem' }}>
                                                ₹{cartTotalPrice}
                                            </span>
                                        )}
                                    </button>

                                    {/* Profile Dropdown Button */}
                                    <div className="position-relative" ref={profileDropdownRef} style={{ zIndex: 1060 }}>
                                        <button 
                                            type="button"
                                            className="btn btn-dark border border-secondary border-opacity-70 text-white rounded-pill px-3.5 py-1.5 d-flex align-items-center gap-2.5 shadow-sm hover-border-warning"
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

                                </div>
                            ) : (
                                <div className="d-flex align-items-center gap-3 w-100 w-lg-auto justify-content-end">
                                    <Link className="btn btn-outline-warning fw-semibold px-3.5 py-2 rounded-pill small" to="/login">
                                        Log In
                                    </Link>
                                    <Link className="btn btn-brand fw-bold px-4 py-2 rounded-pill small shadow-sm" to="/signup">
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </nav>

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
