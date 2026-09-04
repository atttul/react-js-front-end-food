import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [metrics, setMetrics] = useState({ total: 0, pending: 0, accepted: 0, delivered: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [activeTab, setActiveTab] = useState('ALL');
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [rejectingOrder, setRejectingOrder] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [nowTime, setNowTime] = useState(Date.now());

    const prevPendingCountRef = useRef(0);
    const [newOrderAlert, setNewOrderAlert] = useState(false);

    // Verify Admin authentication on mount
    useEffect(() => {
        const token = localStorage.getItem('adminAuthToken');
        const userDataStr = localStorage.getItem('adminUserData');
        let adminUser = null;
        try {
            adminUser = userDataStr ? JSON.parse(userDataStr) : null;
        } catch (e) {}

        if (!token || !adminUser || adminUser.role !== 'admin') {
            navigate('/admin/login');
        }
    }, [navigate]);

    // Live clock ticker for deadline countdown timer (every 1 sec)
    useEffect(() => {
        const interval = setInterval(() => {
            setNowTime(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // API Helper
    const fetchAdminOrders = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        const token = localStorage.getItem('adminAuthToken');
        if (!token) return;

        try {
            const localUrl = 'http://localhost:5000/api';
            const remoteUrl = (process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api').replace(/\/$/, '');
            const urlsToTry = [localUrl, remoteUrl];

            let data = null;

            for (const baseUrl of urlsToTry) {
                try {
                    const res = await fetch(`${baseUrl}/admin/orders`, {
                        method: 'GET',
                        headers: {
                            'authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (res.status === 401 || res.status === 403) {
                        localStorage.removeItem('adminAuthToken');
                        localStorage.removeItem('adminUserData');
                        navigate('/admin/login');
                        return;
                    }

                    if (res.ok) {
                        data = await res.json();
                        if (data && data.success) break;
                    }
                } catch (e) {
                    console.warn(`Connection attempt to ${baseUrl} failed:`, e);
                }
            }

            if (data && data.success) {
                const fetchedOrders = data.data || [];
                setOrders(fetchedOrders);

                if (data.metrics) {
                    setMetrics(data.metrics);
                    if (prevPendingCountRef.current !== 0 && data.metrics.pending > prevPendingCountRef.current) {
                        setNewOrderAlert(true);
                    }
                    prevPendingCountRef.current = data.metrics.pending;
                }
                setErrorMsg(null);
            } else if (!isSilent) {
                setErrorMsg(data?.message || "Failed to load dashboard orders. Please refresh.");
            }
        } catch (err) {
            console.error("Admin dashboard fetch error:", err);
            if (!isSilent) setErrorMsg("Server connection error while fetching orders.");
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [navigate]);

    // Initial load & lightweight polling every 10 seconds
    useEffect(() => {
        fetchAdminOrders();
        const pollInterval = setInterval(() => {
            fetchAdminOrders(true);
        }, 10000);
        return () => clearInterval(pollInterval);
    }, [fetchAdminOrders]);

    // Accept Order API
    const handleAcceptOrder = async (orderId) => {
        setActionLoadingId(orderId);
        setErrorMsg(null);
        setSuccessMsg(null);
        const token = localStorage.getItem('adminAuthToken');

        try {
            const localUrl = 'http://localhost:5000/api';
            const remoteUrl = (process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api').replace(/\/$/, '');
            const urlsToTry = [localUrl, remoteUrl];

            let resData = null;

            for (const baseUrl of urlsToTry) {
                try {
                    const res = await fetch(`${baseUrl}/admin/orders/${orderId}/accept`, {
                        method: 'PATCH',
                        headers: {
                            'authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    resData = await res.json();
                    if (res.ok && resData.success) break;
                } catch (e) {}
            }

            if (resData && resData.success) {
                setSuccessMsg(resData.message || "Order accepted! 30-minute delivery clock started.");
                fetchAdminOrders(true);
            } else {
                setErrorMsg(resData?.message || "Failed to accept order.");
            }
        } catch (err) {
            setErrorMsg("Network error when accepting order.");
        } finally {
            setActionLoadingId(null);
        }
    };

    // Confirm Reject Order API
    const handleConfirmRejectOrder = async () => {
        if (!rejectingOrder) return;
        const orderId = rejectingOrder._id;
        setActionLoadingId(orderId);
        setErrorMsg(null);
        setSuccessMsg(null);
        const token = localStorage.getItem('adminAuthToken');

        try {
            const localUrl = 'http://localhost:5000/api';
            const remoteUrl = (process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api').replace(/\/$/, '');
            const urlsToTry = [localUrl, remoteUrl];

            let resData = null;

            for (const baseUrl of urlsToTry) {
                try {
                    const res = await fetch(`${baseUrl}/admin/orders/${orderId}/reject`, {
                        method: 'PATCH',
                        headers: {
                            'authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ reason: rejectionReason })
                    });
                    resData = await res.json();
                    if (res.ok && resData.success) break;
                } catch (e) {}
            }

            if (resData && resData.success) {
                setSuccessMsg(resData.message || "Order rejected.");
                setRejectingOrder(null);
                setRejectionReason('');
                fetchAdminOrders(true);
            } else {
                setErrorMsg(resData?.message || "Failed to reject order.");
            }
        } catch (err) {
            setErrorMsg("Network error when rejecting order.");
        } finally {
            setActionLoadingId(null);
        }
    };

    // Update Status API (PREPARING, OUT_FOR_DELIVERY, DELIVERED)
    const handleUpdateStatus = async (orderId, newStatus) => {
        setActionLoadingId(orderId);
        setErrorMsg(null);
        setSuccessMsg(null);
        const token = localStorage.getItem('adminAuthToken');

        try {
            const localUrl = 'http://localhost:5000/api';
            const remoteUrl = (process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api').replace(/\/$/, '');
            const urlsToTry = [localUrl, remoteUrl];

            let resData = null;

            for (const baseUrl of urlsToTry) {
                try {
                    const res = await fetch(`${baseUrl}/admin/orders/${orderId}/status`, {
                        method: 'PATCH',
                        headers: {
                            'authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ status: newStatus })
                    });
                    resData = await res.json();
                    if (res.ok && resData.success) break;
                } catch (e) {}
            }

            if (resData && resData.success) {
                setSuccessMsg(`Order status updated to '${newStatus}'`);
                fetchAdminOrders(true);
            } else {
                setErrorMsg(resData?.message || "Failed to update order status.");
            }
        } catch (err) {
            setErrorMsg("Network error when updating status.");
        } finally {
            setActionLoadingId(null);
        }
    };

    // Calculate remaining delivery time formatted (e.g. 29:54)
    const getRemainingTimerDisplay = (deliveryDeadline) => {
        if (!deliveryDeadline) return null;
        const deadlineMs = new Date(deliveryDeadline).getTime();
        const diffMs = deadlineMs - nowTime;

        if (diffMs <= 0) {
            return <span className="badge bg-danger text-uppercase px-2.5 py-1 fs-7 fw-bold shadow-sm">Delivery Time Exceeded</span>;
        }

        const totalSec = Math.floor(diffMs / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        return (
            <span className="badge bg-warning text-dark font-monospace fs-6 px-3 py-1 fw-extrabold shadow-sm">
                <i className="bi bi-stopwatch-fill me-1"></i> {formatted}
            </span>
        );
    };

    // Filter orders by active tab
    const filteredOrders = orders.filter((o) => {
        const st = (o.order_status || 'PENDING').toUpperCase();
        if (activeTab === 'PENDING') return st === 'PENDING' || st === 'PLACED';
        if (activeTab === 'ACCEPTED') return st === 'ACCEPTED' || st === 'PREPARING' || st === 'OUT_FOR_DELIVERY';
        if (activeTab === 'DELIVERED') return st === 'DELIVERED';
        if (activeTab === 'REJECTED') return st === 'REJECTED';
        return true; // ALL
    });

    return (
        <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#ffffff' }} className="d-flex flex-column">
            {/* Unified Admin Navbar */}
            <AdminNavbar />

            {/* Main Content Area */}
            <main className="container-fluid px-3 px-md-4 py-4 flex-grow-1">
                
                {/* Header Banner & Live Status Bar */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 bg-dark rounded-4 p-3.5 p-md-4 border border-secondary shadow-sm">
                    <div>
                        <h2 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
                            <i className="bi bi-speedometer2 text-warning"></i> Order Operations Dashboard
                        </h2>
                        <p className="text-light small mb-0 opacity-90">
                            Monitor incoming food orders, manage acceptance, and track 30-minute delivery deadlines in real time.
                        </p>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        {newOrderAlert && (
                            <div className="badge bg-warning text-dark px-3 py-2 animate-bounce cursor-pointer shadow-sm" onClick={() => { setActiveTab('PENDING'); setNewOrderAlert(false); }}>
                                <i className="bi bi-bell-fill me-1"></i> New Order Received!
                            </div>
                        )}
                        <button
                            onClick={() => fetchAdminOrders(false)}
                            className="btn btn-outline-secondary btn-sm text-light border-secondary d-flex align-items-center gap-1.5"
                            title="Refresh Orders"
                        >
                            <i className="bi bi-arrow-repeat"></i> Refresh List
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {successMsg && (
                    <div className="alert alert-success alert-dismissible fade show rounded-3 small py-2.5 px-3 mb-3" role="alert">
                        <i className="bi bi-check-circle-fill me-2 fs-6"></i>
                        {successMsg}
                        <button type="button" className="btn-close btn-close-white py-2" onClick={() => setSuccessMsg(null)}></button>
                    </div>
                )}
                {errorMsg && (
                    <div className="alert alert-danger alert-dismissible fade show rounded-3 small py-2.5 px-3 mb-3" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2 fs-6"></i>
                        {errorMsg}
                        <button type="button" className="btn-close btn-close-white py-2" onClick={() => setErrorMsg(null)}></button>
                    </div>
                )}

                {/* Summary Metric Cards with High Contrast Typography */}
                <div className="row g-3 mb-4">
                    <div className="col-6 col-md-4 col-lg-2-4" onClick={() => setActiveTab('ALL')} style={{ cursor: 'pointer' }}>
                        <div className={`card text-white bg-dark border-${activeTab === 'ALL' ? 'warning' : 'secondary'} rounded-4 p-3 shadow-sm h-100`}>
                            <div className="d-flex align-items-center justify-content-between text-light small fw-semibold mb-1">
                                <span>Total Orders</span>
                                <i className="bi bi-receipt text-warning fs-5"></i>
                            </div>
                            <div className="fs-2 fw-bold text-white">{metrics.total}</div>
                        </div>
                    </div>

                    <div className="col-6 col-md-4 col-lg-2-4" onClick={() => setActiveTab('PENDING')} style={{ cursor: 'pointer' }}>
                        <div className={`card text-white bg-dark border-${activeTab === 'PENDING' ? 'warning' : 'secondary'} rounded-4 p-3 shadow-sm h-100`}>
                            <div className="d-flex align-items-center justify-content-between text-warning small fw-semibold mb-1">
                                <span>Pending Acceptance</span>
                                <i className="bi bi-hourglass-split text-warning fs-5"></i>
                            </div>
                            <div className="fs-2 fw-bold text-warning">{metrics.pending}</div>
                        </div>
                    </div>

                    <div className="col-6 col-md-4 col-lg-2-4" onClick={() => setActiveTab('ACCEPTED')} style={{ cursor: 'pointer' }}>
                        <div className={`card text-white bg-dark border-${activeTab === 'ACCEPTED' ? 'info' : 'secondary'} rounded-4 p-3 shadow-sm h-100`}>
                            <div className="d-flex align-items-center justify-content-between text-info small fw-semibold mb-1">
                                <span>Active Delivery Clock</span>
                                <i className="bi bi-clock-history text-info fs-5"></i>
                            </div>
                            <div className="fs-2 fw-bold text-info">{metrics.accepted}</div>
                        </div>
                    </div>

                    <div className="col-6 col-md-4 col-lg-2-4" onClick={() => setActiveTab('DELIVERED')} style={{ cursor: 'pointer' }}>
                        <div className={`card text-white bg-dark border-${activeTab === 'DELIVERED' ? 'success' : 'secondary'} rounded-4 p-3 shadow-sm h-100`}>
                            <div className="d-flex align-items-center justify-content-between text-success small fw-semibold mb-1">
                                <span>Delivered</span>
                                <i className="bi bi-check2-circle text-success fs-5"></i>
                            </div>
                            <div className="fs-2 fw-bold text-success">{metrics.delivered}</div>
                        </div>
                    </div>

                    <div className="col-6 col-md-4 col-lg-2-4" onClick={() => setActiveTab('REJECTED')} style={{ cursor: 'pointer' }}>
                        <div className={`card text-white bg-dark border-${activeTab === 'REJECTED' ? 'danger' : 'secondary'} rounded-4 p-3 shadow-sm h-100`}>
                            <div className="d-flex align-items-center justify-content-between text-danger small fw-semibold mb-1">
                                <span>Rejected</span>
                                <i className="bi bi-x-circle text-danger fs-5"></i>
                            </div>
                            <div className="fs-2 fw-bold text-danger">{metrics.rejected}</div>
                        </div>
                    </div>
                </div>

                {/* Filter Navigation Tabs */}
                <div className="d-flex flex-wrap gap-2 mb-4 border-bottom border-secondary pb-2">
                    <button
                        onClick={() => setActiveTab('ALL')}
                        className={`btn btn-sm ${activeTab === 'ALL' ? 'btn-warning fw-bold text-dark' : 'btn-outline-secondary text-light'}`}
                    >
                        All Orders ({metrics.total})
                    </button>
                    <button
                        onClick={() => setActiveTab('PENDING')}
                        className={`btn btn-sm ${activeTab === 'PENDING' ? 'btn-warning fw-bold text-dark' : 'btn-outline-secondary text-light'}`}
                    >
                        <i className="bi bi-exclamation-circle me-1"></i> Pending ({metrics.pending})
                    </button>
                    <button
                        onClick={() => setActiveTab('ACCEPTED')}
                        className={`btn btn-sm ${activeTab === 'ACCEPTED' ? 'btn-info fw-bold text-dark' : 'btn-outline-secondary text-light'}`}
                    >
                        Active Delivery Clock ({metrics.accepted})
                    </button>
                    <button
                        onClick={() => setActiveTab('DELIVERED')}
                        className={`btn btn-sm ${activeTab === 'DELIVERED' ? 'btn-success fw-bold' : 'btn-outline-secondary text-light'}`}
                    >
                        Delivered ({metrics.delivered})
                    </button>
                    <button
                        onClick={() => setActiveTab('REJECTED')}
                        className={`btn btn-sm ${activeTab === 'REJECTED' ? 'btn-danger fw-bold' : 'btn-outline-secondary text-light'}`}
                    >
                        Rejected ({metrics.rejected})
                    </button>
                </div>

                {/* Orders Content View */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading orders...</span>
                        </div>
                        <p className="text-light mt-3">Fetching live customer orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-5 bg-dark rounded-4 border border-secondary p-4">
                        <i className="bi bi-inbox text-warning opacity-75" style={{ fontSize: '3.5rem' }}></i>
                        <h4 className="fw-bold text-white mt-3 mb-2">No {activeTab.toLowerCase()} orders found</h4>
                        <p className="text-light small">Orders placed by customers will automatically appear here.</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {filteredOrders.map((order) => {
                            const status = (order.order_status || 'PENDING').toUpperCase();
                            const isPending = status === 'PENDING' || status === 'PLACED';
                            const isAccepted = status === 'ACCEPTED' || status === 'PREPARING' || status === 'OUT_FOR_DELIVERY';
                            const isDelivered = status === 'DELIVERED';
                            const isRejected = status === 'REJECTED';

                            const createdDateStr = order.created_at
                                ? new Date(order.created_at).toLocaleString('en-IN', {
                                      dateStyle: 'medium',
                                      timeStyle: 'short'
                                  })
                                : 'Recent';

                            return (
                                <div key={order._id} className="col-12 col-lg-6">
                                    <div
                                        className="card bg-dark border-secondary rounded-4 shadow-sm h-100 overflow-hidden"
                                        style={{
                                            borderLeft: isPending
                                                ? '5px solid #ffc107'
                                                : isAccepted
                                                ? '5px solid #0dcaf0'
                                                : isDelivered
                                                ? '5px solid #198754'
                                                : '5px solid #dc3545'
                                        }}
                                    >
                                        {/* Card Header */}
                                        <div className="card-header bg-dark border-bottom border-secondary d-flex flex-wrap align-items-center justify-content-between gap-2 py-3 px-3 px-md-4">
                                            <div>
                                                <span className="text-warning-emphasis extra-small fw-bold d-block">ORDER ID</span>
                                                <span className="font-monospace fw-bold text-warning fs-6">
                                                    #{order._id ? order._id.substring(order._id.length - 8).toUpperCase() : 'ORDER'}
                                                </span>
                                            </div>

                                            <div className="d-flex align-items-center gap-2">
                                                {isPending && <span className="badge bg-warning text-dark px-3 py-2 fw-bold"><i className="bi bi-clock me-1"></i> PENDING ACCEPTANCE</span>}
                                                {isAccepted && getRemainingTimerDisplay(order.delivery_deadline)}
                                                {isDelivered && <span className="badge bg-success text-white px-3 py-2 fw-bold"><i className="bi bi-check-lg me-1"></i> DELIVERED</span>}
                                                {isRejected && <span className="badge bg-danger text-white px-3 py-2 fw-bold"><i className="bi bi-x-lg me-1"></i> REJECTED</span>}
                                            </div>
                                        </div>

                                        {/* Card Body with High Contrast Text */}
                                        <div className="card-body p-3 p-md-4">
                                            {/* Customer Info Box */}
                                            <div className="row g-2 mb-3 bg-secondary bg-opacity-20 rounded-3 p-2.5 border border-secondary">
                                                <div className="col-12 col-sm-6">
                                                    <span className="text-warning-emphasis extra-small fw-bold d-block">CUSTOMER NAME</span>
                                                    <span className="fw-bold text-white small">
                                                        <i className="bi bi-person-fill text-warning me-1.5"></i>
                                                        {order.email ? order.email.split('@')[0] : 'Customer'}
                                                    </span>
                                                </div>
                                                <div className="col-12 col-sm-6 text-sm-end">
                                                    <span className="text-warning-emphasis extra-small fw-bold d-block">CUSTOMER CONTACT / EMAIL</span>
                                                    <span className="text-warning font-monospace fw-semibold small text-break">{order.email || 'N/A'}</span>
                                                </div>
                                                <div className="col-12 border-top border-secondary pt-1.5 mt-1 d-flex align-items-center justify-content-between">
                                                    <span className="text-light extra-small fw-bold me-2">ORDER PLACED AT:</span>
                                                    <span className="text-light small fw-medium">{createdDateStr}</span>
                                                </div>
                                            </div>

                                            {/* Item Details */}
                                            <div className="d-flex align-items-center justify-content-between border-bottom border-secondary pb-2.5 mb-3">
                                                <div>
                                                    <h5 className="fw-bold text-white mb-1">{order.product_name}</h5>
                                                    <div className="text-light small">
                                                        Variant/Size: <span className="text-warning fw-bold">{order.size || 'Standard'}</span> • Qty: <span className="text-warning fw-bold">{order.quantity || 1}</span>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <span className="text-light extra-small fw-bold d-block">TOTAL AMOUNT</span>
                                                    <span className="fs-4 fw-extrabold text-warning">₹{order.total_amount}/-</span>
                                                </div>
                                            </div>

                                            {/* Order Action Buttons */}
                                            {isPending && (
                                                <div className="d-flex flex-wrap gap-2 mt-3 pt-2">
                                                    <button
                                                        onClick={() => handleAcceptOrder(order._id)}
                                                        disabled={actionLoadingId === order._id}
                                                        className="btn btn-success fw-bold flex-grow-1 py-2 text-white shadow-sm"
                                                    >
                                                        {actionLoadingId === order._id ? (
                                                            <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                                        ) : (
                                                            <i className="bi bi-check-circle-fill me-1"></i>
                                                        )}
                                                        Accept Order (Start 30m Clock)
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectingOrder(order)}
                                                        disabled={actionLoadingId === order._id}
                                                        className="btn btn-outline-danger fw-semibold px-3 py-2"
                                                    >
                                                        <i className="bi bi-x-circle me-1"></i> Reject
                                                    </button>
                                                </div>
                                            )}

                                            {isAccepted && (
                                                <div className="mt-3 pt-2 border-top border-secondary">
                                                    <label className="text-light extra-small fw-bold d-block mb-1.5">UPDATE STATUS PROGRESS</label>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        <button
                                                            onClick={() => handleUpdateStatus(order._id, 'PREPARING')}
                                                            disabled={actionLoadingId === order._id || status === 'PREPARING'}
                                                            className={`btn btn-sm ${status === 'PREPARING' ? 'btn-info fw-bold text-dark' : 'btn-outline-info text-light'}`}
                                                        >
                                                            <i className="bi bi-fire me-1"></i> Preparing
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(order._id, 'OUT_FOR_DELIVERY')}
                                                            disabled={actionLoadingId === order._id || status === 'OUT_FOR_DELIVERY'}
                                                            className={`btn btn-sm ${status === 'OUT_FOR_DELIVERY' ? 'btn-primary fw-bold text-white' : 'btn-outline-primary text-light'}`}
                                                        >
                                                            <i className="bi bi-bicycle me-1"></i> Out For Delivery
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(order._id, 'DELIVERED')}
                                                            disabled={actionLoadingId === order._id}
                                                            className="btn btn-sm btn-success fw-bold text-white ms-auto"
                                                        >
                                                            <i className="bi bi-check2-all me-1"></i> Mark Delivered
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Rejection Modal */}
            {rejectingOrder && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content bg-dark text-white border-secondary rounded-4 p-2">
                            <div className="modal-header border-secondary">
                                <h5 className="modal-header-title text-danger fw-bold m-0">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i> Reject Order #{rejectingOrder._id?.substring(rejectingOrder._id.length - 6)}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setRejectingOrder(null)}></button>
                            </div>
                            <div className="modal-body py-3">
                                <p className="text-light small mb-3">
                                    Are you sure you want to reject this order for <span className="text-warning fw-semibold">{rejectingOrder.product_name}</span>?
                                </p>
                                <label className="form-label text-light small">Optional Reason for Customer:</label>
                                <textarea
                                    className="form-control bg-dark text-white border-secondary"
                                    rows="3"
                                    placeholder="e.g. Item out of stock / Kitchen overloaded"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="modal-footer border-secondary">
                                <button type="button" className="btn btn-secondary btn-sm px-3" onClick={() => setRejectingOrder(null)}>Cancel</button>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm fw-bold px-3"
                                    onClick={handleConfirmRejectOrder}
                                    disabled={actionLoadingId === rejectingOrder._id}
                                >
                                    {actionLoadingId === rejectingOrder._id ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
