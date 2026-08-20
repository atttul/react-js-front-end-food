import { load } from '@cashfreepayments/cashfree-js';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CashfreePaymentForm = () => {
    const location = useLocation();
    const [form, setForm] = useState({
        amount: location.state?.amount || 0,
        name: '',
        address: '',
        phone: ''
    });
    const [envMode, setEnvMode] = useState(process.env.REACT_APP_CASHFREE_ENVIRONMENT || 'sandbox');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handlePay = async (e) => {
        if (e) e.preventDefault();
        setErrorMsg('');

        if (!form.name.trim() || !form.address.trim() || !form.phone.trim()) {
            setErrorMsg('Please fill in all delivery details before proceeding.');
            return;
        }

        if (form.phone.trim().length !== 10) {
            setErrorMsg('Please enter a valid 10-digit phone number.');
            return;
        }

        setLoading(true);

        try {
            let userData = {};
            try {
                userData = JSON.parse(localStorage.getItem("userData") || "{}");
            } catch (err) {
                console.error("Failed to parse userData", err);
            }

            const userId = userData._id || `user_${Math.floor(100000 + Math.random() * 900000)}`;
            const userEmail = userData.email || `${form.phone}@gmail.com`;

            const res = await fetch(`${process.env.REACT_APP_BASE_URL}/create/cashfree/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    orderAmount: form.amount,
                    customerName: form.name.trim(),
                    customerId: `cust_mern${Math.floor(100000 + Math.random() * 900000)}`,
                    customerEmail: userEmail,
                    customerPhone: form.phone.trim(),
                    orderAddress: form.address.trim()
                })
            });

            const data = await res.json();

            if (!res.ok || !data || !data.sessionId) {
                setErrorMsg(data?.message || "Failed to generate Cashfree payment session. Please try again.");
                setLoading(false);
                return;
            }

            const cashfree = await load({
                mode: envMode
            });

            await cashfree.checkout({
                paymentSessionId: data.sessionId,
                redirectTarget: '_self'
            });
        } catch (err) {
            console.error("Payment error:", err);
            setErrorMsg("Something went wrong initializing Cashfree Checkout. Try toggling SDK mode (Sandbox / Production).");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <div className="container d-flex justify-content-center align-items-center flex-grow-1 py-5">
                <div className="card food-card p-4 p-sm-5 shadow-lg border-0" style={{ maxWidth: '540px', width: '100%' }}>
                    <div className="text-center mb-4">
                        <div className="d-inline-block p-3 rounded-circle bg-dark border border-secondary mb-3 text-warning">
                            <i className="bi bi-credit-card-2-front fs-2"></i>
                        </div>
                        <h3 className="fw-bold text-white mb-1">Checkout & Payment</h3>
                        <p className="text-muted small">Enter delivery details to initiate Cashfree payment</p>
                    </div>

                    {errorMsg && (
                        <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}
                        </div>
                    )}

                    <form onSubmit={handlePay}>
                        <div className="mb-3">
                            <label htmlFor="name" className="form-label text-white-50 fw-semibold small">Customer Name</label>
                            <input 
                                type="text" 
                                className="form-control bg-dark text-white border-secondary" 
                                name='name' 
                                placeholder="Full Name" 
                                value={form.name} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="address" className="form-label text-white-50 fw-semibold small">Delivery Address</label>
                            <input 
                                type="text" 
                                className="form-control bg-dark text-white border-secondary" 
                                name='address' 
                                placeholder="Full Street Address" 
                                value={form.address} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="phone" className="form-label text-white-50 fw-semibold small">Phone Number</label>
                            <input 
                                type="tel" 
                                className="form-control bg-dark text-white border-secondary" 
                                name='phone' 
                                placeholder="10 Digit Phone Number" 
                                value={form.phone} 
                                onChange={handleChange} 
                                pattern="[0-9]{10}"
                                maxLength="10"
                                required 
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label text-white-50 fw-semibold small">Gateway Environment Mode</label>
                            <div className="d-flex gap-3 bg-dark p-2 rounded-3 border border-secondary">
                                <div className="form-check me-3">
                                    <input 
                                        className="form-check-input" 
                                        type="radio" 
                                        name="envMode" 
                                        id="modeSandbox" 
                                        value="sandbox" 
                                        checked={envMode === 'sandbox'} 
                                        onChange={(e) => setEnvMode(e.target.value)} 
                                    />
                                    <label className="form-check-label text-white small" htmlFor="modeSandbox">
                                        Sandbox (Test)
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input 
                                        className="form-check-input" 
                                        type="radio" 
                                        name="envMode" 
                                        id="modeProduction" 
                                        value="production" 
                                        checked={envMode === 'production'} 
                                        onChange={(e) => setEnvMode(e.target.value)} 
                                    />
                                    <label className="form-check-label text-white small" htmlFor="modeProduction">
                                        Production (Live)
                                    </label>
                                </div>
                            </div>
                            <span className="text-muted extra-small mt-1 d-block" style={{ fontSize: '0.75rem' }}>
                                Match this with your Cashfree Backend Keys environment on Vercel.
                            </span>
                        </div>

                        <div className="bg-dark p-3 rounded-3 border border-secondary mb-4 d-flex align-items-center justify-content-between">
                            <span className="text-muted font-semibold">Total Amount Payable:</span>
                            <span className="fs-3 fw-bold text-warning">₹{form.amount}/-</span>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading} 
                            className="btn btn-brand w-100 py-3 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 shadow"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Initiating Cashfree ({envMode})...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-lock-fill"></i> Pay Now with Cashfree ({envMode})
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default CashfreePaymentForm;



