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

    // Calculate remaining delivery time formatted (e.g. ⏱ 26:40)
    const getRemainingTimerDisplay = (deliveryDeadline) => {
        if (!deliveryDeadline) return null;
        const deadlineMs = new Date(deliveryDeadline).getTime();
        const diffMs = deadlineMs - nowTime;

        if (diffMs <= 0) {
            return <span className="badge bg-danger text-white px-2 py-1 extra-small fw-bold">Delivery Time Exceeded</span>;
        }

        const totalSec = Math.floor(diffMs / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        return (
            <span className="badge bg-warning text-dark font-monospace px-2.5 py-1 extra-small fw-bold shadow-sm">
                <i className="bi bi-stopwatch-fill me-1"></i> ⏱ {formatted}
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
            <main className="container-fluid px-2.5 px-md-4 py-3 flex-grow-1">
                
                {/* Header Row */}
                <div className="d-flex align-items-center justify-content-between gap-2 mb-3 bg-dark rounded-3 px-3 py-2.5 border border-secondary border-opacity-40 shadow-sm">
                    <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-speedometer2 text-warning fs-5"></i>
                        <h4 className="fw-bold text-white mb-0 fs-5">Order Management</h4>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        {newOrderAlert && (
                            <div className="badge bg-warning text-dark px-2.5 py-1.5 animate-bounce cursor-pointer extra-small fw-bold" onClick={() => { setActiveTab('PENDING'); setNewOrderAlert(false); }}>
                                <i className="bi bi-bell-fill me-1"></i> New Order!
                            </div>
                        )}
                        <button
                            onClick={() => fetchAdminOrders(false)}
                            className="btn btn-outline-secondary btn-sm text-light border-secondary border-opacity-50 extra-small py-1 px-2.5 d-flex align-items-center gap-1"
                            title="Refresh Orders"
                        >
                            <i className="bi bi-arrow-repeat"></i> Refresh
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {successMsg && (
                    <div className="alert alert-success alert-dismissible fade show rounded-3 extra-small py-2 px-3 mb-2.5" role="alert">
                        <i className="bi bi-check-circle-fill me-1.5"></i>
                        {successMsg}
                        <button type="button" className="btn-close btn-close-white py-1.5" onClick={() => setSuccessMsg(null)}></button>
                    </div>
                )}
                {errorMsg && (
                    <div className="alert alert-danger alert-dismissible fade show rounded-3 extra-small py-2 px-3 mb-2.5" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-1.5"></i>
                        {errorMsg}
                        <button type="button" className="btn-close btn-close-white py-1.5" onClick={() => setErrorMsg(null)}></button>
                    </div>
                )}

                {/* Sleek Compact KPI Summary Grid */}
                <div className="row row-cols-2 row-cols-md-5 g-2 mb-3">
                    <div className="col" onClick={() => setActiveTab('ALL')} style={{ cursor: 'pointer' }}>
                        <div className={`card bg-dark border-${activeTab === 'ALL' ? 'warning' : 'secondary'} border-opacity-40 rounded-3 p-2.5 px-3 text-center shadow-sm`}>
                            <div className="fs-4 fw-extrabold text-white mb-0" style={{ lineHeight: '1.1' }}>{metrics.total}</div>
                            <div className="extra-small text-muted text-uppercase fw-semibold mt-1">Total Orders</div>
                        </div>
                    </div>

                    <div className="col" onClick={() => setActiveTab('PENDING')} style={{ cursor: 'pointer' }}>
                        <div className={`card bg-dark border-${activeTab === 'PENDING' ? 'warning' : 'secondary'} border-opacity-40 rounded-3 p-2.5 px-3 text-center shadow-sm`}>
                            <div className="fs-4 fw-extrabold text-warning mb-0" style={{ lineHeight: '1.1' }}>{metrics.pending}</div>
                            <div className="extra-small text-warning text-uppercase fw-semibold mt-1">Pending</div>
                        </div>
                    </div>

                    <div className="col" onClick={() => setActiveTab('ACCEPTED')} style={{ cursor: 'pointer' }}>
                        <div className={`card bg-dark border-${activeTab === 'ACCEPTED' ? 'info' : 'secondary'} border-opacity-40 rounded-3 p-2.5 px-3 text-center shadow-sm`}>
                            <div className="fs-4 fw-extrabold text-info mb-0" style={{ lineHeight: '1.1' }}>{metrics.accepted}</div>
                            <div className="extra-small text-info text-uppercase fw-semibold mt-1">Active Clock</div>
                        </div>
                    </div>

                    <div className="col" onClick={() => setActiveTab('DELIVERED')} style={{ cursor: 'pointer' }}>
                        <div className={`card bg-dark border-${activeTab === 'DELIVERED' ? 'success' : 'secondary'} border-opacity-40 rounded-3 p-2.5 px-3 text-center shadow-sm`}>
                            <div className="fs-4 fw-extrabold text-success mb-0" style={{ lineHeight: '1.1' }}>{metrics.delivered}</div>
                            <div className="extra-small text-success text-uppercase fw-semibold mt-1">Delivered</div>
                        </div>
                    </div>

                    <div className="col" onClick={() => setActiveTab('REJECTED')} style={{ cursor: 'pointer' }}>
                        <div className={`card bg-dark border-${activeTab === 'REJECTED' ? 'danger' : 'secondary'} border-opacity-40 rounded-3 p-2.5 px-3 text-center shadow-sm`}>
                            <div className="fs-4 fw-extrabold text-danger mb-0" style={{ lineHeight: '1.1' }}>{metrics.rejected}</div>
                            <div className="extra-small text-danger text-uppercase fw-semibold mt-1">Rejected</div>
                        </div>
                    </div>
                </div>

                {/* Filter Navigation Tabs */}
                <div className="d-flex flex-wrap gap-1.5 mb-3 border-bottom border-secondary border-opacity-40 pb-2">
                    <button
                        onClick={() => setActiveTab('ALL')}
                        className={`btn btn-sm py-1 px-3 extra-small ${activeTab === 'ALL' ? 'btn-warning fw-bold text-dark' : 'btn-outline-secondary text-light'}`}
                    >
                        All Orders ({metrics.total})
                    </button>
                    <button
                        onClick={() => setActiveTab('PENDING')}
                        className={`btn btn-sm py-1 px-3 extra-small ${activeTab === 'PENDING' ? 'btn-warning fw-bold text-dark' : 'btn-outline-secondary text-light'}`}
                    >
                        <i className="bi bi-exclamation-circle me-1"></i> Pending ({metrics.pending})
                    </button>
                    <button
                        onClick={() => setActiveTab('ACCEPTED')}
                        className={`btn btn-sm py-1 px-3 extra-small ${activeTab === 'ACCEPTED' ? 'btn-info fw-bold text-dark' : 'btn-outline-secondary text-light'}`}
                    >
                        Active Delivery Clock ({metrics.accepted})
                    </button>
                    <button
                        onClick={() => setActiveTab('DELIVERED')}
                        className={`btn btn-sm py-1 px-3 extra-small ${activeTab === 'DELIVERED' ? 'btn-success fw-bold text-white' : 'btn-outline-secondary text-light'}`}
                    >
                        Delivered ({metrics.delivered})
                    </button>
                    <button
                        onClick={() => setActiveTab('REJECTED')}
                        className={`btn btn-sm py-1 px-3 extra-small ${activeTab === 'REJECTED' ? 'btn-danger fw-bold text-white' : 'btn-outline-secondary text-light'}`}
                    >
                        Rejected ({metrics.rejected})
                    </button>
                </div>

                {/* Orders Content View */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-warning" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <span className="visually-hidden">Loading orders...</span>
                        </div>
                        <p className="text-light small mt-2.5">Fetching live customer orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-5 bg-dark rounded-3 border border-secondary border-opacity-40 p-4">
                        <i className="bi bi-inbox text-warning opacity-75" style={{ fontSize: '3rem' }}></i>
                        <h5 className="fw-bold text-white mt-2 mb-1">No {activeTab.toLowerCase()} orders found</h5>
                        <p className="text-muted small">Orders placed by customers will automatically appear here.</p>
                    </div>
                ) : (
                    <div className="row g-2.5">
                        {filteredOrders.map((order) => {
                            const status = (order.order_status || 'PENDING').toUpperCase();
                            const isPending = status === 'PENDING' || status === 'PLACED';
                            const isAccepted = status === 'ACCEPTED' || status === 'PREPARING' || status === 'OUT_FOR_DELIVERY';
                            const isDelivered = status === 'DELIVERED';
                            const isRejected = status === 'REJECTED';

                            const createdDateStr = order.created_at
                                ? new Date(order.created_at).toLocaleString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                  })
                                : 'Recent';

                            const customerName = order.email ? order.email.split('@')[0] : 'Customer';

                            return (
                                <div key={order._id} className="col-12 col-md-6">
                                    <div
                                        className="card bg-dark border-secondary border-opacity-40 rounded-3 shadow-sm overflow-hidden h-100"
                                        style={{
                                            borderLeft: isPending
                                                ? '4px solid #ffc107'
                                                : isAccepted
                                                ? '4px solid #0dcaf0'
                                                : isDelivered
                                                ? '4px solid #198754'
                                                : '4px solid #dc3545'
                                        }}
                                    >
                                        {/* Card Top Row: Order ID & Status Pill */}
                                        <div className="card-header bg-dark border-bottom border-secondary border-opacity-30 d-flex align-items-center justify-content-between py-2 px-3">
                                            <span className="font-monospace fw-bold text-warning extra-small">
                                                #{order._id ? order._id.substring(order._id.length - 8).toUpperCase() : 'ORDER'}
                                            </span>

                                            <div className="d-flex align-items-center gap-1.5">
                                                {isPending && <span className="badge bg-warning text-dark extra-small fw-bold px-2 py-1">PENDING</span>}
                                                {isAccepted && getRemainingTimerDisplay(order.delivery_deadline)}
                                                {isDelivered && <span className="badge bg-success text-white extra-small fw-bold px-2 py-1"><i className="bi bi-check-lg me-1"></i>✓ DELIVERED</span>}
                                                {isRejected && <span className="badge bg-danger text-white extra-small fw-bold px-2 py-1"><i className="bi bi-x-lg me-1"></i>✕ REJECTED</span>}
                                            </div>
                                        </div>

                                        {/* Card Body: Compact Layout */}
                                        <div className="card-body p-3 d-flex flex-column justify-content-between">
                                            
                                            {/* Customer & Time Row (Clean, lighter box) */}
                                            <div className="mb-2.5 pb-2 border-bottom border-secondary border-opacity-30">
                                                <div className="d-flex align-items-center justify-content-between text-truncate">
                                                    <div className="d-flex align-items-center gap-1.5 text-truncate">
                                                        <i className="bi bi-person-fill text-warning extra-small"></i>
                                                        <span className="fw-bold text-white small text-truncate">{customerName}</span>
                                                    </div>
                                                    <div className="text-muted extra-small font-monospace flex-shrink-0 ms-2">
                                                        <i className="bi bi-clock me-1 text-warning opacity-75"></i>
                                                        {createdDateStr}
                                                    </div>
                                                </div>
                                                <div className="extra-small text-warning-emphasis text-truncate mt-0.5" style={{ fontSize: '0.725rem' }}>
                                                    📧 {order.email || 'N/A'}
                                                </div>
                                            </div>

                                            {/* Order Item & Price Details */}
                                            <div className="mb-2.5">
                                                <div className="d-flex align-items-baseline justify-content-between gap-2">
                                                    <div className="fw-bold text-white small mb-0 text-truncate">
                                                        {order.product_name}
                                                    </div>
                                                    <div className="fs-6 fw-extrabold text-warning text-nowrap">
                                                        ₹{order.total_amount}/-
                                                    </div>
                                                </div>
                                                <div className="text-muted extra-small">
                                                    {order.size || 'Standard'} · Qty <span className="text-white fw-bold">{order.quantity || 1}</span>
                                                </div>
                                            </div>

                                            {/* Order Actions */}
                                            {isPending && (
                                                <div className="d-flex align-items-center gap-2 mt-2 pt-2 border-top border-secondary border-opacity-30">
                                                    <button
                                                        onClick={() => handleAcceptOrder(order._id)}
                                                        disabled={actionLoadingId === order._id}
                                                        className="btn btn-success btn-sm fw-bold flex-grow-1 py-1.5 text-white extra-small shadow-sm"
                                                    >
                                                        {actionLoadingId === order._id ? (
                                                            <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                                        ) : (
                                                            <i className="bi bi-check-circle-fill me-1"></i>
                                                        )}
                                                        Accept Order (Start 30m)
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectingOrder(order)}
                                                        disabled={actionLoadingId === order._id}
                                                        className="btn btn-outline-danger btn-sm fw-semibold px-2.5 py-1.5 extra-small"
                                                    >
                                                        <i className="bi bi-x-circle me-1"></i> Reject
                                                    </button>
                                                </div>
                                            )}

                                            {isAccepted && (
                                                <div className="mt-2 pt-2 border-top border-secondary border-opacity-30 d-flex align-items-center justify-content-between flex-wrap gap-1.5">
                                                    <span className="extra-small text-muted fw-bold">STATUS:</span>
                                                    <div className="d-flex align-items-center gap-1.5 ms-auto">
                                                        <button
                                                            onClick={() => handleUpdateStatus(order._id, 'PREPARING')}
                                                            disabled={actionLoadingId === order._id || status === 'PREPARING'}
                                                            className={`btn btn-sm py-0.5 px-2 extra-small ${status === 'PREPARING' ? 'btn-info fw-bold text-dark' : 'btn-outline-info text-light'}`}
                                                        >
                                                            Preparing
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(order._id, 'OUT_FOR_DELIVERY')}
                                                            disabled={actionLoadingId === order._id || status === 'OUT_FOR_DELIVERY'}
                                                            className={`btn btn-sm py-0.5 px-2 extra-small ${status === 'OUT_FOR_DELIVERY' ? 'btn-primary fw-bold text-white' : 'btn-outline-primary text-light'}`}
                                                        >
                                                            Out For Delivery
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(order._id, 'DELIVERED')}
                                                            disabled={actionLoadingId === order._id}
                                                            className="btn btn-sm btn-success fw-bold text-white py-0.5 px-2 extra-small ms-1"
                                                        >
                                                            Mark Delivered
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
                        <div className="modal-content bg-dark text-white border-secondary rounded-3 p-2">
                            <div className="modal-header border-secondary border-opacity-40 py-2">
                                <h6 className="modal-header-title text-danger fw-bold m-0">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i> Reject Order #{rejectingOrder._id?.substring(rejectingOrder._id.length - 6)}
                                </h6>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setRejectingOrder(null)}></button>
                            </div>
                            <div className="modal-body py-2.5">
                                <p className="text-light small mb-2">
                                    Are you sure you want to reject order for <span className="text-warning fw-semibold">{rejectingOrder.product_name}</span>?
                                </p>
                                <label className="form-label text-muted extra-small">Optional Reason for Customer:</label>
                                <textarea
                                    className="form-control bg-dark text-white border-secondary border-opacity-50 small"
                                    rows="2"
                                    placeholder="e.g. Item out of stock"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="modal-footer border-secondary border-opacity-40 py-2">
                                <button type="button" className="btn btn-secondary btn-sm px-3 extra-small" onClick={() => setRejectingOrder(null)}>Cancel</button>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm fw-bold px-3 extra-small"
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
