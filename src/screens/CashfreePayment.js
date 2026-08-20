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

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handlePay = async () => {
        const res = await fetch(`${process.env.REACT_APP_BASE_URL}/create/cashfree/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: JSON.parse(localStorage.getItem("userData"))._id,
                orderAmount: form.amount,
                customerName: form.name,
                customerId: `cust_mern${Math.floor(100000 + Math.random() * 900000)}`,
                customerEmail: JSON.parse(localStorage.getItem("userData")).email,
                customerPhone: form.phone,
                orderAddress: form.address
            })
        });

        const data = await res.json();
        const cashfree = await load({
            mode: process.env.REACT_APP_CASHFREE_ENVIRONMENT || 'sandbox'
        });

        cashfree.checkout({
            paymentSessionId: data.sessionId,
            redirectTarget: '_self'
        }).then(() => {
        });
    };

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <div className="container d-flex justify-content-center align-items-center flex-grow-1 py-5">
                <div className="card food-card p-4 p-sm-5 shadow-lg border-0" style={{ maxWidth: '520px', width: '100%' }}>
                    <div className="text-center mb-4">
                        <div className="d-inline-block p-3 rounded-circle bg-dark border border-secondary mb-3 text-warning">
                            <i className="bi bi-credit-card-2-front fs-2"></i>
                        </div>
                        <h3 className="fw-bold text-white mb-1">Checkout & Payment</h3>
                        <p className="text-muted small">Enter your delivery details to proceed with payment</p>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="name" className="form-label text-white-50 fw-semibold small">Customer Name</label>
                        <input type="text" className="form-control bg-dark text-white border-secondary" name='name' placeholder="Full Name" value={form.name} onChange={handleChange} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="address" className="form-label text-white-50 fw-semibold small">Delivery Address</label>
                        <input type="text" className="form-control bg-dark text-white border-secondary" name='address' placeholder="Full Street Address" value={form.address} onChange={handleChange} required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="phone" className="form-label text-white-50 fw-semibold small">Phone Number</label>
                        <input type="text" className="form-control bg-dark text-white border-secondary" name='phone' placeholder="10 Digit Phone Number" value={form.phone} onChange={handleChange} required />
                    </div>

                    <div className="bg-dark p-3 rounded-3 border border-secondary mb-4 d-flex align-items-center justify-content-between">
                        <span className="text-muted font-semibold">Total Amount Payable:</span>
                        <span className="fs-3 fw-bold text-warning">₹{form.amount}/-</span>
                    </div>

                    <button className="btn btn-brand w-100 py-3 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 shadow" onClick={handlePay}>
                        <i className="bi bi-lock-fill"></i> Pay Now with Cashfree
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default CashfreePaymentForm;

