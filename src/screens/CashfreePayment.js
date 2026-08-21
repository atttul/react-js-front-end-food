import { load } from '@cashfreepayments/cashfree-js';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CashfreePaymentForm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Pre-fill user data from localStorage if available
    let initialUserData = {};
    try {
        initialUserData = JSON.parse(localStorage.getItem("userData") || "{}");
    } catch (err) {
        console.error("Failed to parse userData", err);
    }

    // Amount calculation with fallbacks
    const initialAmount = location.state?.amount && Number(location.state.amount) > 0
        ? Number(location.state.amount)
        : Number(localStorage.getItem("lastCartTotal")) || 250;

    const [form, setForm] = useState({
        amount: initialAmount,
        name: initialUserData.name || localStorage.getItem("loggedInUserName") || '',
        address: initialUserData.location || '',
        phone: initialUserData.phone_number ? String(initialUserData.phone_number) : ''
    });

    const envMode = process.env.REACT_APP_CASHFREE_ENVIRONMENT || 'sandbox';
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [cashfreeObj, setCashfreeObj] = useState(null);

    // Pre-load Cashfree SDK on component mount
    useEffect(() => {
        let isMounted = true;
        const initSdk = async () => {
            try {
                const cf = await load({ mode: envMode });
                if (isMounted) {
                    setCashfreeObj(cf);
                }
            } catch (e) {
                console.warn("Cashfree SDK pre-loader info:", e);
            }
        };
        initSdk();
        return () => { isMounted = false; };
    }, [envMode]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handlePay = async (e) => {
        if (e) e.preventDefault();
        setErrorMsg('');

        const cleanPhone = String(form.phone || '').replace(/\D/g, '');
        const cleanName = String(form.name || '').trim();
        const cleanAddress = String(form.address || '').trim();

        if (!cleanName) {
            setErrorMsg('Please enter your full name for delivery.');
            return;
        }

        if (!cleanAddress) {
            setErrorMsg('Please enter your complete delivery address.');
            return;
        }

        if (!cleanPhone || cleanPhone.length !== 10) {
            setErrorMsg('Please enter a valid 10-digit mobile number.');
            return;
        }

        setLoading(true);

        try {
            const userId = initialUserData._id || `user_${Math.floor(100000 + Math.random() * 900000)}`;
            const userEmail = initialUserData.email || `${cleanPhone}@gmail.com`;
            const baseUrl = (process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api').replace(/\/$/, '');

            console.log("Initiating payment request to:", `${baseUrl}/create/cashfree/order`);

            // Step 1: Create Cashfree Order Session on Backend
            const res = await fetch(`${baseUrl}/create/cashfree/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    orderAmount: Number(form.amount) || 250,
                    customerName: cleanName,
                    customerId: `cust_mern${Math.floor(100000 + Math.random() * 900000)}`,
                    customerEmail: userEmail,
                    customerPhone: cleanPhone,
                    orderAddress: cleanAddress
                })
            });

            const data = await res.json();
            console.log("Cashfree Order API Response:", data);

            if (!res.ok || !data || !data.sessionId) {
                setErrorMsg(data?.message || "Failed to generate Cashfree payment session. Please check details.");
                setLoading(false);
                return;
            }

            // Sync cart items to backend if pending
            const pendingCartItemsStr = localStorage.getItem("pendingCartItems");
            if (pendingCartItemsStr) {
                try {
                    const cartItems = JSON.parse(pendingCartItemsStr);
                    const requestBody = cartItems.map(item => ({
                        userId: item.user_id,
                        email: userEmail,
                        name: item.product_name,
                        qty: item.quantity,
                        size: item.size
                    }));
                    await fetch(`${baseUrl}/order/create`, {
                        method: 'POST',
                        headers: {
                            "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody)
                    });
                    localStorage.removeItem("pendingCartItems");
                } catch (e) {
                    console.error("Order creation sync info:", e);
                }
            }

            // Step 2: Launch Cashfree Payment SDK Checkout Modal
            const cf = cashfreeObj || await load({ mode: envMode });
            await cf.checkout({
                paymentSessionId: data.sessionId,
                redirectTarget: '_self'
            });

        } catch (err) {
            console.error("Cashfree Payment Checkout Error:", err);
            setErrorMsg(`Gateway launch error: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToCart = () => {
        navigate('/', { state: { openCart: true } });
    };

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            
            <div className="container px-2 px-sm-3 d-flex justify-content-center align-items-center flex-grow-1 py-4 py-md-5">
                <div className="card auth-wrapper w-100 border-0 overflow-hidden shadow-lg" style={{ maxWidth: '880px' }}>
                    <div className="row g-0">
                        
                        {/* Left Panel - Order Summary & Trust Badges */}
                        <div className="col-md-5 d-none d-md-flex flex-column p-4 p-lg-5 text-white bg-dark bg-opacity-60 border-end border-secondary border-opacity-40">
                            <div className="mb-4">
                                <span className="auth-badge mb-3">
                                    <i className="bi bi-shield-check"></i> Secure Checkout
                                </span>
                                <h3 className="fw-extrabold text-white mb-2">Order Summary</h3>
                                <p className="text-white-50 small leading-relaxed">
                                    Review your order total and delivery details before completing payment.
                                </p>
                            </div>

                            {/* Order Details Breakdown */}
                            <div className="bg-dark p-3 rounded-3 border border-secondary mb-4">
                                <div className="d-flex justify-content-between text-white-50 small mb-2">
                                    <span>Items Subtotal</span>
                                    <span className="fw-semibold text-white">₹{form.amount}/-</span>
                                </div>
                                <div className="d-flex justify-content-between text-white-50 small mb-2">
                                    <span>Delivery Charges</span>
                                    <span className="text-success fw-bold">FREE</span>
                                </div>
                                <div className="d-flex justify-content-between text-white-50 small mb-3">
                                    <span>Taxes & Packaging</span>
                                    <span className="text-muted">Included</span>
                                </div>
                                <div className="pt-2 border-top border-secondary d-flex justify-content-between align-items-center">
                                    <span className="fw-bold text-white fs-6">Total Amount Payable</span>
                                    <span className="fs-4 fw-extrabold text-warning">₹{form.amount}/-</span>
                                </div>
                            </div>

                            {/* Trust & Guarantee Badges */}
                            <div className="mt-auto pt-3 border-top border-secondary border-opacity-50">
                                <div className="d-flex flex-column gap-2 text-white-50 small">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-lock-fill text-warning fs-6"></i>
                                        <span>256-Bit SSL Encrypted Payment</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-credit-card-2-front-fill text-warning fs-6"></i>
                                        <span>Supports UPI, Debit/Credit Cards & NetBanking</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-arrow-counterclockwise text-warning fs-6"></i>
                                        <span>Instant Refund Guarantee on Order Cancel</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Header Banner (< 768px) */}
                        <div className="d-md-none text-center p-4 bg-dark bg-opacity-60 border-bottom border-secondary border-opacity-40">
                            <span className="auth-badge mb-2">
                                <i className="bi bi-shield-check"></i> Secure Checkout
                            </span>
                            <h4 className="fw-bold text-white mb-1">Confirm Delivery & Pay</h4>
                            <div className="d-inline-flex align-items-center gap-2 mt-2 px-3 py-1.5 rounded-pill bg-dark border border-warning-subtle">
                                <span className="text-muted small">Total Payable:</span>
                                <span className="fw-extrabold text-warning fs-5">₹{form.amount}/-</span>
                            </div>
                        </div>

                        {/* Right Panel - Delivery Form */}
                        <div className="col-md-7 p-3 p-sm-4 p-lg-5 d-flex flex-column justify-content-center">
                            
                            <div className="mb-4 text-center text-md-start">
                                <h3 className="fw-bold text-white mb-1">Delivery Information</h3>
                                <p className="text-muted small mb-0">Where should we deliver your delicious food?</p>
                            </div>

                            {/* Error Alert */}
                            {errorMsg && (
                                <div className="alert auth-error-alert alert-dismissible fade show p-3 mb-4 text-start w-100" role="alert">
                                    <div className="d-flex align-items-start gap-2">
                                        <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0 mt-0.5"></i>
                                        <div className="small fw-medium">{errorMsg}</div>
                                    </div>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setErrorMsg('')}></button>
                                </div>
                            )}

                            <form onSubmit={handlePay}>
                                
                                {/* Full Name */}
                                <div className="mb-3">
                                    <label htmlFor="name" className="form-label text-white-50 fw-semibold small">
                                        Full Name
                                    </label>
                                    <div className="input-group auth-input-group">
                                        <span className="input-group-text"><i className="bi bi-person-fill text-warning"></i></span>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            name='name' 
                                            id='name'
                                            placeholder="Enter your full name" 
                                            value={form.name} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                </div>

                                {/* Delivery Address */}
                                <div className="mb-3">
                                    <label htmlFor="address" className="form-label text-white-50 fw-semibold small">
                                        Delivery Address
                                    </label>
                                    <div className="input-group auth-input-group">
                                        <span className="input-group-text"><i className="bi bi-geo-alt-fill text-warning"></i></span>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            name='address' 
                                            id='address'
                                            placeholder="House No., Street Name, Area, City" 
                                            value={form.address} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                </div>

                                {/* Phone Number */}
                                <div className="mb-4">
                                    <label htmlFor="phone" className="form-label text-white-50 fw-semibold small">
                                        Contact Phone Number
                                    </label>
                                    <div className="input-group auth-input-group">
                                        <span className="input-group-text"><i className="bi bi-telephone-fill text-warning"></i></span>
                                        <input 
                                            type="tel" 
                                            className="form-control" 
                                            name='phone' 
                                            id='phone'
                                            placeholder="10-digit mobile number" 
                                            value={form.phone} 
                                            onChange={handleChange} 
                                            maxLength="10"
                                        />
                                    </div>
                                </div>

                                {/* Mobile Only Summary Card */}
                                <div className="d-md-none bg-dark p-3 rounded-3 border border-secondary mb-4 d-flex align-items-center justify-content-between">
                                    <span className="text-white-50 small fw-semibold">Grand Total:</span>
                                    <span className="fs-4 fw-bold text-warning">₹{form.amount}/-</span>
                                </div>

                                {/* Submit Payment Button */}
                                <button 
                                    type="button"
                                    onClick={handlePay}
                                    disabled={loading} 
                                    className="btn btn-brand w-100 py-3 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 shadow mb-3"
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            <span>Opening Cashfree Payment Gateway...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-lock-fill fs-5"></i>
                                            <span>Proceed to Pay ₹{form.amount}/-</span>
                                        </>
                                    )}
                                </button>

                                {/* Back Buttons */}
                                <div className="d-flex align-items-center justify-content-between pt-2 border-top border-secondary border-opacity-50">
                                    <button
                                        type="button"
                                        className="btn btn-link text-white-50 p-0 text-decoration-none extra-small"
                                        onClick={handleBackToCart}
                                    >
                                        <i className="bi bi-arrow-left"></i> Back to Cart
                                    </button>
                                    <Link
                                        to="/"
                                        className="text-warning text-decoration-none extra-small"
                                    >
                                        <i className="bi bi-house me-1"></i> Home Menu
                                    </Link>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default CashfreePaymentForm;
