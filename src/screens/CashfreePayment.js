import { load } from '@cashfreepayments/cashfree-js';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

const CashfreePaymentForm = () => {
    const location = useLocation();
    const [form, setForm] = useState({
        amount: location.state.amount,
        name: '',
        email: '',
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
                orderAmount: location.state.amount,
                customerName: form.name,
                customerId: "cust_atul123",
                customerEmail: form.email,
                customerPhone: form.phone
            })
        });

        const data = await res.json();
        const cashfree = await load({
            mode: process.env.REACT_APP_CASHFREE_ENVIRONMENT || 'sandbox'
        });

        cashfree.checkout({
            paymentSessionId: data.sessionId,
            redirectTarget: '_blank'
        }).then(() => {
        });
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h2>Payment</h2>
            <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} /><br />
            <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} /><br />
            <input type="text" name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} /><br />
            <button onClick={handlePay}>Pay Now</button>
        </div>
    );
};

export default CashfreePaymentForm;
