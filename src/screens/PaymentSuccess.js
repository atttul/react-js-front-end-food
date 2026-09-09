import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import OrderTrackerModal from "../components/OrderTrackerModal";

const PaymentSuccess = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlOrderId = searchParams.get('order_id') || searchParams.get('orderId') || '';

    const [showTrackModal, setShowTrackModal] = useState(false);
    const [activeOrder, setActiveOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [createdItemNames, setCreatedItemNames] = useState('');
    const [orderId, setOrderId] = useState(urlOrderId);
    const [orderAmount, setOrderAmount] = useState(Number(localStorage.getItem("lastCartTotal")) || 0);

    useEffect(() => {
        let isMounted = true;
        const processOrderCreation = async () => {
            const baseUrl = (process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api').replace(/\/$/, '');
            const token = localStorage.getItem("authToken");

            // Extract email properly
            let userEmail = localStorage.getItem("userEmail") || "";
            if (!userEmail) {
                try {
                    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
                    userEmail = userData.email || "";
                } catch (e) {}
            }

            // Retrieve pending cart items from localStorage or fallback to backend cart
            const pendingCartItemsStr = localStorage.getItem("pendingCartItems");
            let cartItems = [];
            if (pendingCartItemsStr) {
                try {
                    cartItems = JSON.parse(pendingCartItemsStr);
                } catch (e) {
                    console.error("Failed to parse pendingCartItems:", e);
                }
            }

            if ((!cartItems || cartItems.length === 0) && token) {
                try {
                    const cartRes = await fetch(`${baseUrl}/fetch/cart/items`, {
                        method: 'GET',
                        headers: {
                            "authorization": `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        }
                    });
                    if (cartRes.ok) {
                        const cartJson = await cartRes.json();
                        if (cartJson.success && Array.isArray(cartJson.data) && cartJson.data.length > 0) {
                            cartItems = cartJson.data;
                        }
                    }
                } catch (err) {
                    console.warn("Fallback cart fetch warning:", err);
                }
            }

            if (cartItems && cartItems.length > 0 && token) {
                try {
                    const names = cartItems.map(i => i.product_name).join(', ');
                    const calculatedTotal = cartItems.reduce((acc, it) => acc + (Number(it.total_amount) || 0), 0);
                    if (isMounted) {
                        setCreatedItemNames(names);
                        if (calculatedTotal > 0) setOrderAmount(calculatedTotal);
                    }

                    const requestBody = cartItems.map(item => ({
                        userId: item.user_id,
                        email: item.email || userEmail || '',
                        name: item.product_name,
                        qty: Number(item.quantity) || 1,
                        size: item.size || 'regular',
                        total_amount: item.total_amount,
                        order_id: urlOrderId || undefined
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
                        if (isMounted) {
                            setActiveOrder(created);
                            if (created.order_id) setOrderId(created.order_id);
                            if (created.total_amount && !calculatedTotal) setOrderAmount(created.total_amount);
                        }
                    }
                } catch (e) {
                    console.error("Order creation on payment success error:", e);
                } finally {
                    // Explicitly call clear/cart on backend to guarantee active cart is emptied
                    try {
                        await fetch(`${baseUrl}/clear/cart`, {
                            method: 'DELETE',
                            headers: {
                                "authorization": `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            }
                        });
                    } catch (clearErr) {
                        console.warn("Clear cart API warning:", clearErr);
                    }

                    // Remove pending items and total from localStorage
                    localStorage.removeItem("pendingCartItems");
                    localStorage.removeItem("lastCartTotal");

                    // Notify Navbar and other components
                    window.dispatchEvent(new Event('cartUpdated'));
                }
            } else if (token) {
                // Fetch active order if already created (e.g. on page refresh or created by webhook)
                try {
                    const res = await fetch(`${baseUrl}/user/active-order`, {
                        headers: { "authorization": `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.data && isMounted) {
                            setActiveOrder(data.data);
                            if (data.data.order_id) setOrderId(data.data.order_id);
                            if (data.data.total_amount) setOrderAmount(data.data.total_amount);
                            if (data.data.product_name) {
                                setCreatedItemNames(data.data.product_name);
                            }
                        }
                    }
                } catch (e) {
                    console.warn("Active order fetch warning:", e);
                }

                // Ensure cart state and localStorage are cleared
                try {
                    await fetch(`${baseUrl}/clear/cart`, {
                        method: 'DELETE',
                        headers: {
                            "authorization": `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        }
                    });
                } catch (e) {}
                localStorage.removeItem("pendingCartItems");
                localStorage.removeItem("lastCartTotal");
                window.dispatchEvent(new Event('cartUpdated'));
            }

            // Fallback: If urlOrderId is present and details are still missing, query order tracking endpoint directly
            if (urlOrderId && isMounted) {
                try {
                    const trackRes = await fetch(`${baseUrl}/order/track/${urlOrderId}`);
                    if (trackRes.ok) {
                        const trackJson = await trackRes.json();
                        if (trackJson.success && trackJson.data) {
                            if (isMounted) {
                                setOrderId(trackJson.data.order_id || trackJson.data.orderId || urlOrderId);
                                if (trackJson.data.total_amount || trackJson.data.order_amount) {
                                    setOrderAmount(trackJson.data.total_amount || trackJson.data.order_amount);
                                }
                                if (trackJson.data.product_name) {
                                    setCreatedItemNames(prev => prev || trackJson.data.product_name);
                                }
                                setActiveOrder(prev => prev || trackJson.data);
                            }
                        }
                    }
                } catch (trackErr) {
                    console.warn("Direct track lookup warning:", trackErr);
                }
            }

            if (isMounted) setLoading(false);
        };

        processOrderCreation();
        return () => { isMounted = false; };
    }, [urlOrderId]);

    const displayOrderId = orderId || activeOrder?.order_id || activeOrder?._id || urlOrderId || 'Order Placed';
    const displayAmount = orderAmount || activeOrder?.total_amount || activeOrder?.order_amount || 0;

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
                            {/* Order Summary Highlight Card */}
                            <div className="bg-dark p-3 rounded-3 border border-secondary mb-3 text-start shadow-sm">
                                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-50">
                                    <span className="text-muted extra-small text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>Order Reference</span>
                                    <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 px-2.5 py-1 extra-small">
                                        <i className="bi bi-shield-check me-1"></i> Payment Verified
                                    </span>
                                </div>
                                <div className="row g-2 align-items-center">
                                    <div className="col-12 col-sm-7">
                                        <small className="text-muted extra-small d-block text-uppercase fw-semibold">Order ID</small>
                                        <span className="fw-bold text-white small text-truncate d-block font-monospace" title={displayOrderId}>
                                            #{displayOrderId}
                                        </span>
                                    </div>
                                    <div className="col-12 col-sm-5 text-sm-end">
                                        <small className="text-muted extra-small d-block text-uppercase fw-semibold">Amount Paid</small>
                                        <span className="fw-bold text-success fs-5">
                                            {displayAmount > 0 ? `₹${displayAmount}/-` : 'Confirmed'}
                                        </span>
                                    </div>
                                </div>
                            </div>

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
                    order={{
                        ...(activeOrder || {}),
                        order_id: displayOrderId,
                        _id: activeOrder?._id || displayOrderId,
                        total_amount: displayAmount,
                        product_name: createdItemNames || activeOrder?.product_name || 'Food Order'
                    }}
                    onClose={() => setShowTrackModal(false)}
                />
            )}

            <Footer />
        </div>
    );
};

export default PaymentSuccess;