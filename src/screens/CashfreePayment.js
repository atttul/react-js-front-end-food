import { load } from '@cashfreepayments/cashfree-js';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

const CashfreePaymentForm = () => {
    const location = useLocation();
    const [form, setForm] = useState({
        amount: location.state.amount,
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
        <div>
            <Navbar />
            {/* <div style={{ padding: "2rem" }}>
                <h2>Place Your Order</h2>
                <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} /><br />
                <input type="text" name="address" placeholder="Address" value={form.address} onChange={handleChange} /><br />
                <input type="text" name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} /><br />
                <br />
                <p>Total Amount = {location.state.amount}</p>
                <button className="btn btn-danger m-2" onClick={handlePay}>Pay Now</button> 
            </div> */}
            <div className='container'>
                <div className="mb-3">
                    <label htmlFor="name" className="form-label">Name</label>
                    <input type="text" className="form-control" name='name' value={form.name} onChange={handleChange} />
                </div>
                <div className="mb-3">
                    <label htmlFor="address" className="form-label">Address</label>
                    <input type="text" className="form-control" name='address' value={form.address} onChange={handleChange} />
                </div>
                <div className="mb-3">
                    <label htmlFor="phone" className="form-label">Phone Number</label>
                    <input type="text" className="form-control" name='phone' value={form.phone} onChange={handleChange} />
                </div>
                <h4>Total Amount = {form.amount}</h4>
                <button className="btn btn-danger m-2" onClick={handlePay}>Pay Now</button>
            </div>
        </div>
    );
};

export default CashfreePaymentForm;
