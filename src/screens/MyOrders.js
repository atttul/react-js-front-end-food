import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import OrderTrackerModal from '../components/OrderTrackerModal';

export default function MyOrders() {
    const [getAllOrders, setGetAllOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrackOrder, setSelectedTrackOrder] = useState(null);

    const handleGetAllOrders = async () => {
        setLoading(true);
        try {
            const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:5000/api';
            const cleanBase = baseUrl.replace(/\/$/, '');
            let res = await fetch(`${cleanBase}/order/fetch`, {
                method: 'GET',
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json',
                },
            });
            if (res.ok) {
                let allOrders = await res.json();
                setGetAllOrders(allOrders.data || []);
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleGetAllOrders();
    }, []);

    // Check if order was placed within the last 30 minutes (1800000 ms)
    const isTrackableWithin30Mins = (orderDateStr) => {
        if (!orderDateStr) return false;
        const orderDate = new Date(orderDateStr);
        const now = new Date();
        const diffMs = now - orderDate;
        const thirtyMinsMs = 30 * 60 * 1000;
        return diffMs >= 0 && diffMs <= thirtyMinsMs;
    };

    // Group items placed together in the same order batch
    const groupOrdersByBatch = (ordersList) => {
        if (!ordersList || ordersList.length === 0) return [];

        const groups = {};
        ordersList.forEach((item) => {
            const itemDate = item.created_at ? new Date(item.created_at) : new Date();
            const minuteKey = item.created_at
                ? `${itemDate.getFullYear()}-${itemDate.getMonth() + 1}-${itemDate.getDate()} ${itemDate.getHours()}:${itemDate.getMinutes()}`
                : (item._id ? item._id.substring(0, 18) : 'single_batch');

            if (!groups[minuteKey]) {
                groups[minuteKey] = {
                    id: item._id || minuteKey,
                    date: itemDate,
                    items: [],
                    totalAmount: 0,
                    firstItem: item
                };
            }
            groups[minuteKey].items.push(item);
            groups[minuteKey].totalAmount += (item.total_amount || 0);
        });

        return Object.values(groups).sort((a, b) => b.date - a.date);
    };

    const groupedOrders = groupOrdersByBatch(getAllOrders);

    return (
        <div className="d-flex flex-column min-vh-100 bg-dark text-white">
            <Navbar />

            {/* Compact Main Container (Max Width 760px to avoid stretched widescreen layout) */}
            <div className="container py-4 py-md-5 flex-grow-1" style={{ maxWidth: '760px' }}>
                
                {/* Header Title Banner */}
                <div className="card auth-wrapper border-0 p-3 p-sm-4 mb-4 shadow">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <div className="p-2.5 rounded-circle bg-dark border border-secondary text-warning d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                                <i className="bi bi-receipt-cutoff fs-4"></i>
                            </div>
                            <div>
                                <h4 className="fw-bold text-white mb-0.5">My Orders</h4>
                                <p className="text-white-50 extra-small mb-0" style={{ fontSize: '0.82rem' }}>
                                    View your food order history & track ongoing deliveries
                                </p>
                            </div>
                        </div>

                        <div className="d-flex align-items-center">
                            <span className="badge bg-dark border border-secondary text-warning px-3 py-1.5 fs-6 rounded-pill">
                                <i className="bi bi-box-seam me-1"></i> {groupedOrders.length} {groupedOrders.length === 1 ? 'Order' : 'Orders'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-warning" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <span className="visually-hidden">Loading Orders...</span>
                        </div>
                        <p className="text-white-50 mt-3 small">Fetching your orders history...</p>
                    </div>
                ) : groupedOrders.length === 0 ? (
                    /* Empty State */
                    <div className="card auth-wrapper border-0 text-center py-5 px-3 my-3 shadow">
                        <div className="d-inline-flex align-items-center justify-content-center p-3.5 rounded-circle bg-dark border border-secondary mb-3 text-warning">
                            <i className="bi bi-bag-x fs-2"></i>
                        </div>
                        <h5 className="text-white fw-bold mb-1.5">No Past Orders Found</h5>
                        <p className="text-white-50 small mb-4" style={{ maxWidth: '380px', margin: '0 auto' }}>
                            You haven't placed any food orders yet. Browse our menu and treat yourself to something delicious!
                        </p>
                        <div>
                            <Link to="/" className="btn btn-brand px-4 py-2 fw-bold rounded-pill shadow-sm">
                                <i className="bi bi-shop me-2"></i> Explore Menu
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Orders Card Stack */
                    <div className="d-flex flex-column gap-3.5">
                        {groupedOrders.map((group, groupIdx) => {
                            const isLiveTrackable = isTrackableWithin30Mins(group.date);
                            
                            // Format Date & Time cleanly
                            const formattedDate = group.date.toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            });
                            const formattedTime = group.date.toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            });

                            return (
                                <div key={groupIdx} className="card auth-wrapper border-0 shadow overflow-hidden">
                                    
                                    {/* Clean Sleek Dark Header - NO Loud Yellow/Green Bars */}
                                    <div className="card-header bg-dark bg-opacity-90 border-bottom border-secondary border-opacity-40 p-3 px-sm-3.5 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="fw-bold text-white fs-6">
                                                Order #{groupedOrders.length - groupIdx}
                                            </span>
                                            <span className="text-white-50 extra-small">•</span>
                                            <span className="text-white-50 small" style={{ fontSize: '0.83rem' }}>
                                                <i className="bi bi-calendar3 text-warning me-1"></i> {formattedDate}, {formattedTime}
                                            </span>
                                        </div>

                                        {/* Status Text (Soft & Clean) */}
                                        <div>
                                            {isLiveTrackable ? (
                                                <span className="text-warning small fw-bold d-inline-flex align-items-center gap-1.5">
                                                    <i className="bi bi-record-circle-fill text-danger animate-pulse"></i> Live Delivery (30m ETA)
                                                </span>
                                            ) : (
                                                <span className="text-success small fw-semibold d-inline-flex align-items-center gap-1">
                                                    <i className="bi bi-check-circle-fill text-success"></i> Order Delivered
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Responsive Item List Rows (Mobile & Desktop Compatible) */}
                                    <div className="card-body p-3 px-sm-3.5">
                                        <div className="d-flex flex-column gap-2">
                                            {group.items.map((item, itemIdx) => (
                                                <div key={itemIdx} className="d-flex align-items-center justify-content-between p-2.5 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-30 gap-2">
                                                    
                                                    {/* Food Name & Portion Option */}
                                                    <div className="d-flex align-items-center gap-2.5 text-truncate">
                                                        <div className="p-2 rounded-circle bg-dark text-warning border border-secondary border-opacity-40 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '34px', height: '34px' }}>
                                                            <i className="bi bi-egg-fried"></i>
                                                        </div>
                                                        <div className="text-truncate">
                                                            <div className="fw-bold text-white small text-truncate">{item.product_name}</div>
                                                            <div className="extra-small text-white-50">
                                                                Option: <span className="text-info">{item.size || 'Standard'}</span> • Qty: <span className="text-warning fw-bold">{item.quantity}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="text-end flex-shrink-0">
                                                        <div className="fw-bold text-warning small">₹{item.total_amount}/-</div>
                                                    </div>

                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Summary Footer */}
                                    <div className="card-footer bg-dark bg-opacity-70 border-top border-secondary border-opacity-40 p-3 px-sm-3.5 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="text-white-50 small">Total ({group.items.length} {group.items.length === 1 ? 'item' : 'items'}):</span>
                                            <span className="fw-extrabold text-warning fs-5">₹{group.totalAmount}/-</span>
                                        </div>

                                        <div>
                                            {isLiveTrackable ? (
                                                <button 
                                                    type="button"
                                                    className="btn btn-warning btn-sm fw-bold rounded-pill px-3.5 py-1.5 shadow"
                                                    onClick={() => setSelectedTrackOrder(group.firstItem)}
                                                >
                                                    <i className="bi bi-geo-alt-fill me-1"></i> Track Live Delivery
                                                </button>
                                            ) : (
                                                <span className="text-success extra-small fw-semibold">
                                                    <i className="bi bi-check-all fs-6 me-1"></i> Delivered Successfully
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Render GPS Tracker Modal if a trackable order is selected */}
                {selectedTrackOrder && (
                    <OrderTrackerModal 
                        order={selectedTrackOrder} 
                        onClose={() => setSelectedTrackOrder(null)} 
                    />
                )}
            </div>

            <Footer />
        </div>
    );
}
