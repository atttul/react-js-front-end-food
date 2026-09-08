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
                        
                        {/* Left Panel - Order Summary, Sandbox Testing Guide & Auto-Accept Note */}
                        <div className="col-md-5 d-none d-md-flex flex-column p-4 p-lg-5 text-white bg-dark bg-opacity-60 border-end border-secondary border-opacity-40">
                            <div className="mb-3">
                                <span className="auth-badge mb-2">
                                    <i className="bi bi-shield-check"></i> Sandbox Test Gateway
                                </span>
                                <h3 className="fw-extrabold text-white mb-1">Order Summary</h3>
                                <p className="text-white-50 extra-small leading-relaxed mb-0">
                                    Review your order total and delivery details before completing test payment.
                                </p>
                            </div>

                            {/* Order Details Breakdown */}
                            <div className="bg-dark p-3 rounded-3 border border-secondary mb-3">
                                <div className="d-flex justify-content-between text-white-50 small mb-1.5">
                                    <span>Items Subtotal</span>
                                    <span className="fw-semibold text-white">₹{form.amount}/-</span>
                                </div>
                                <div className="d-flex justify-content-between text-white-50 small mb-1.5">
                                    <span>Delivery Charges</span>
                                    <span className="text-success fw-bold">FREE</span>
                                </div>
                                <div className="d-flex justify-content-between text-white-50 small mb-2">
                                    <span>Taxes & Packaging</span>
                                    <span className="text-muted">Included</span>
                                </div>
                                <div className="pt-2 border-top border-secondary d-flex justify-content-between align-items-center">
                                    <span className="fw-bold text-white fs-6">Total Payable</span>
                                    <span className="fs-4 fw-extrabold text-warning">₹{form.amount}/-</span>
                                </div>
                            </div>

                            {/* Sandbox Testing Guide Card & No Real Money Deducted Warning */}
                            <div className="p-3 rounded-3 border border-warning border-opacity-40 bg-warning bg-opacity-10 mb-3 text-start">
                                <div className="d-flex align-items-center gap-1.5 text-warning fw-bold extra-small mb-1">
                                    <i className="bi bi-exclamation-triangle-fill fs-6"></i>
                                    <span>TEST / SANDBOX PAYMENT MODE</span>
                                </div>
                                <p className="text-white-50 extra-small mb-2" style={{ lineHeight: '1.3' }}>
                                    This is a demo payment. <strong className="text-warning">NO ACTUAL MONEY WILL BE DEDUCTED</strong> from your real bank account or card.
                                </p>
                                <div className="fw-bold text-white extra-small mb-1">How to place order in Sandbox:</div>
                                <ol className="text-white-50 extra-small ps-3 mb-0 d-flex flex-column gap-1" style={{ fontSize: '0.75rem' }}>
                                    <li>Enter your Delivery Name, Address & Phone.</li>
                                    <li>Click <strong className="text-white">Proceed to Pay</strong> button.</li>
                                    <li>On Cashfree popup, select <strong className="text-white">Netbanking / Card / UPI (Test)</strong>.</li>
                                    <li>Click <strong className="text-success">Success</strong> or enter demo OTP <code>123456</code>.</li>
                                </ol>
                            </div>

                            {/* 3-Minute Auto-Acceptance Guarantee Note */}
                            <div className="p-2.5 rounded-3 border border-info border-opacity-40 bg-info bg-opacity-10 mb-3 text-start">
                                <div className="d-flex align-items-center gap-1.5 text-info fw-bold extra-small">
                                    <i className="bi bi-clock-history fs-6"></i>
                                    <span>3-MINUTE AUTO-ACCEPTANCE NOTE</span>
                                </div>
                                <p className="text-white-50 extra-small mb-0 mt-1" style={{ fontSize: '0.74rem', lineHeight: '1.3' }}>
                                    Once your order is placed, if the restaurant admin does not manually accept or reject it within <strong>3 minutes</strong>, it will be <strong className="text-info">automatically accepted</strong> by the system!
                                </p>
                            </div>

                            {/* Trust & Guarantee Badges */}
                            <div className="mt-auto pt-2 border-top border-secondary border-opacity-50">
                                <div className="d-flex flex-column gap-1.5 text-white-50 extra-small">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-lock-fill text-warning"></i>
                                        <span>256-Bit SSL Encrypted Test Environment</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-credit-card-2-front-fill text-warning"></i>
                                        <span>Supports UPI, Cards & NetBanking (Test)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Header Banner (< 768px) */}
                        <div className="d-md-none text-center p-3 bg-dark bg-opacity-60 border-bottom border-secondary border-opacity-40">
                            <span className="auth-badge mb-1.5 extra-small">
                                <i className="bi bi-shield-check"></i> Sandbox Test Mode
                            </span>
                            <h5 className="fw-bold text-white mb-1">Confirm Delivery & Pay</h5>
                            <div className="d-inline-flex align-items-center gap-2 mt-1 px-3 py-1 rounded-pill bg-dark border border-warning-subtle">
                                <span className="text-muted extra-small">Total Payable:</span>
                                <span className="fw-extrabold text-warning fs-6">₹{form.amount}/-</span>
                            </div>
                            <div className="alert bg-warning bg-opacity-10 border border-warning border-opacity-30 p-2 rounded-3 mt-2 mb-0 text-start extra-small text-white-50">
                                <i className="bi bi-info-circle-fill text-warning me-1"></i>
                                <strong className="text-warning">Testing Mode:</strong> No actual money is deducted. Orders are auto-accepted after 3 mins!
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
