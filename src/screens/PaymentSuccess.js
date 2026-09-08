import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import OrderTrackerModal from "../components/OrderTrackerModal";

const PaymentSuccess = () => {
    const [showTrackModal, setShowTrackModal] = useState(false);
    const [activeOrder, setActiveOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [createdItemNames, setCreatedItemNames] = useState('');

    useEffect(() => {
        let isMounted = true;
        const processOrderCreation = async () => {
            const baseUrl = (process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api').replace(/\/$/, '');
            const token = localStorage.getItem("authToken");
            const pendingCartItemsStr = localStorage.getItem("pendingCartItems");

            if (pendingCartItemsStr && token) {
                try {
                    const cartItems = JSON.parse(pendingCartItemsStr);
                    const names = cartItems.map(i => i.product_name).join(', ');
                    if (isMounted) setCreatedItemNames(names);

                    const requestBody = cartItems.map(item => ({
                        userId: item.user_id,
                        email: item.email || localStorage.getItem("userEmail"),
                        name: item.product_name,
                        qty: item.quantity,
                        size: item.size
                    }));

                    const res = await fetch(`${baseUrl}/order/create`, {
                        method: 'POST',
                        headers: {
                            "authorization": `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody)
                    });

                    const json = await res.json();
                    if (res.ok && json.success && json.data) {
                        const created = Array.isArray(json.data) ? json.data[0] : json.data;
                        if (isMounted) setActiveOrder(created);
                        localStorage.removeItem("pendingCartItems");
                        window.dispatchEvent(new Event('cartUpdated'));
                    }
                } catch (e) {
                    console.error("Order creation on payment success error:", e);
                }
            } else if (token) {
                // Fetch active order if already created
                try {
                    const res = await fetch(`${baseUrl}/user/active-order`, {
                        headers: { "authorization": `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.data && isMounted) {
                            setActiveOrder(data.data);
                        }
                    }
                } catch (e) {
                    console.warn("Active order fetch warning:", e);
                }
            }
            if (isMounted) setLoading(false);
        };

        processOrderCreation();
        return () => { isMounted = false; };
    }, []);

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <div className="container d-flex justify-content-center align-items-center flex-grow-1 py-4 py-md-5">
                <div className="card food-card p-4 p-sm-5 text-center shadow-lg border-0" style={{ maxWidth: '540px', width: '100%' }}>
                    <div className="d-inline-block p-3 p-sm-4 rounded-circle bg-success bg-opacity-25 border border-success mb-3 text-success mx-auto" style={{ width: 'fit-content' }}>
                        <i className="bi bi-check-circle-fill display-4"></i>
                    </div>
                    <h2 className="fw-bold text-white mb-2">Payment Successful!</h2>
                    <h5 className="fw-semibold text-warning mb-3">Order Confirmed & Placed</h5>

                    {loading ? (
                        <div className="py-3 text-muted small">
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Finalizing order details...
                        </div>
                    ) : (
                        <>
                            <p className="text-white-50 small mb-3">
                                {createdItemNames ? `Your order for (${createdItemNames}) has been received.` : 'Your order has been placed successfully.'}
                            </p>

                            {/* 3-Minute Auto Acceptance Notice */}
                            <div className="p-3 rounded-3 border border-warning border-opacity-40 bg-warning bg-opacity-10 mb-4 text-start shadow-sm">
                                <div className="d-flex align-items-center gap-1.5 text-warning fw-bold mb-1" style={{ fontSize: '0.8rem' }}>
                                    <i className="bi bi-clock-history fs-6"></i>
                                    <span>3-MINUTE AUTO-ACCEPTANCE NOTE</span>
                                </div>
                                <p className="text-white-50 mb-0 extra-small" style={{ lineHeight: '1.45' }}>
                                    The restaurant admin has <strong>3 minutes</strong> to manually accept or prepare your order. If not reviewed within 3 minutes, your order will be <strong className="text-warning">automatically accepted</strong> by the system and your 30-minute delivery clock will begin!
                                </p>
                            </div>

                            <div className="d-flex flex-column gap-2.5 mb-2">
                                <button 
                                    className="btn btn-warning py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                                    onClick={() => setShowTrackModal(true)}
                                >
                                    <i className="bi bi-geo-alt-fill fs-5"></i> Track Live GPS (Awaiting Acceptance)
                                </button>

                                <Link to="/myorders" className="btn btn-brand py-2.5 fw-semibold">
                                    <i className="bi bi-receipt me-2"></i> View Order History
                                </Link>
                                <Link to="/" className="btn btn-outline-secondary text-white py-2 fw-semibold">
                                    Back to Home Menu
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {showTrackModal && (
                <OrderTrackerModal 
                    order={activeOrder || { product_name: createdItemNames || 'Recent Food Order' }}
                    onClose={() => setShowTrackModal(false)}
                />
            )}

            <Footer />
        </div>
    );
};

export default PaymentSuccess;