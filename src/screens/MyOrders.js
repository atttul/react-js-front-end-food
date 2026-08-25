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
            // Format time key to minute precision to group items checked out together
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

        // Return sorted groups (newest order first)
        return Object.values(groups).sort((a, b) => b.date - a.date);
    };

    const groupedOrders = groupOrdersByBatch(getAllOrders);

    return (
        <div className="d-flex flex-column min-vh-100 bg-dark text-white">
            <Navbar />

            {/* Main Content Area - Max Width Constrained to Prevent Stretching */}
            <div className="container py-4 py-md-5 flex-grow-1" style={{ maxWidth: '960px' }}>
                
                {/* Page Title & Stats Header */}
                <div className="card auth-wrapper border-0 p-3 p-sm-4 mb-4 shadow-sm">
                    <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <div className="p-3 rounded-circle bg-warning bg-opacity-15 text-warning border border-warning border-opacity-30">
                                <i className="bi bi-receipt-cutoff fs-3"></i>
                            </div>
                            <div>
                                <h3 className="fw-bold text-white mb-1">My Orders</h3>
                                <p className="text-white-50 small mb-0">Track live food deliveries & view order history</p>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 align-self-start align-self-sm-center">
                            <span className="badge bg-dark bg-opacity-80 border border-secondary text-warning px-3 py-2 fs-6 rounded-pill">
                                <i className="bi bi-box-seam me-1.5"></i> {groupedOrders.length} {groupedOrders.length === 1 ? 'Order' : 'Orders'} Placed
                            </span>
                        </div>
                    </div>
                </div>

                {/* Loading Spinner */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading Orders...</span>
                        </div>
                        <p className="text-white-50 mt-3 small">Fetching your orders history...</p>
                    </div>
                ) : groupedOrders.length === 0 ? (
                    /* Empty Orders State */
                    <div className="card auth-wrapper border-0 text-center py-5 px-3 my-3">
                        <div className="d-inline-flex align-items-center justify-content-center p-4 rounded-circle bg-dark border border-secondary mb-3 text-warning">
                            <i className="bi bi-bag-x fs-1"></i>
                        </div>
                        <h4 className="text-white fw-bold mb-2">No Past Orders Found</h4>
                        <p className="text-white-50 small mb-4" style={{ maxWidth: '420px', margin: '0 auto' }}>
                            Looks like you haven't placed any food orders yet. Explore our delicious menu and place your first order today!
                        </p>
                        <div>
                            <Link to="/" className="btn btn-brand px-4 py-2.5 fw-bold rounded-pill shadow">
                                <i className="bi bi-shop me-2"></i> Explore Food Menu
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Orders List */
                    <div className="d-flex flex-column gap-4">
                        {groupedOrders.map((group, groupIdx) => {
                            const isLiveTrackable = isTrackableWithin30Mins(group.date);
                            
                            // Format Date & Time distinctly as requested
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
                                <div key={groupIdx} className="card auth-wrapper border-0 shadow-lg overflow-hidden">
                                    
                                    {/* Order Header: Order #, Date, Time & Live Status */}
                                    <div className="card-header bg-dark bg-opacity-60 border-bottom border-secondary p-3 px-sm-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                                        <div className="d-flex flex-wrap align-items-center gap-2">
                                            <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-30 px-3 py-1.5 rounded-pill fw-bold">
                                                Order #{groupedOrders.length - groupIdx}
                                            </span>

                                            {/* Order Date & Time Badges */}
                                            <div className="d-inline-flex align-items-center gap-2 px-2.5 py-1 rounded-pill bg-dark border border-secondary border-opacity-50 text-white-50 extra-small">
                                                <span className="text-white fw-semibold">
                                                    <i className="bi bi-calendar3 text-warning me-1"></i> {formattedDate}
                                                </span>
                                                <span className="text-white-50">|</span>
                                                <span className="text-warning fw-semibold">
                                                    <i className="bi bi-clock-history me-1"></i> {formattedTime}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status Pill */}
                                        <div>
                                            {isLiveTrackable ? (
                                                <span className="badge bg-warning bg-opacity-20 text-warning border border-warning px-3 py-1.5 rounded-pill small fw-bold d-inline-flex align-items-center gap-1.5">
                                                    <i className="bi bi-record-circle-fill text-danger animate-pulse"></i> Live Delivery Active (30m ETA)
                                                </span>
                                            ) : (
                                                <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-40 px-3 py-1.5 rounded-pill small d-inline-flex align-items-center gap-1">
                                                    <i className="bi bi-check-circle-fill text-success"></i> Order Delivered
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Items Section - Compact Desktop Table + Mobile List View */}
                                    <div className="card-body p-0">
                                        
                                        {/* Desktop & Tablet Table (>= 576px) */}
                                        <div className="d-none d-sm-block table-responsive">
                                            <table className="table table-dark table-hover mb-0 align-middle">
                                                <thead className="table-dark text-white-50 extra-small uppercase tracking-wider border-bottom border-secondary border-opacity-50">
                                                    <tr>
                                                        <th scope="col" className="py-2.5 px-3 px-md-4" style={{ width: '40%' }}>Item Description</th>
                                                        <th scope="col" className="py-2.5 text-center" style={{ width: '20%' }}>Size / Option</th>
                                                        <th scope="col" className="py-2.5 text-center" style={{ width: '20%' }}>Quantity</th>
                                                        <th scope="col" className="py-2.5 text-end px-3 px-md-4" style={{ width: '20%' }}>Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.items.map((item, itemIdx) => (
                                                        <tr key={itemIdx} className="border-bottom border-secondary border-opacity-20">
                                                            <td className="py-3 px-3 px-md-4">
                                                                <div className="d-flex align-items-center gap-2.5">
                                                                    <div className="p-2 rounded-circle bg-dark border border-secondary text-warning d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                                        <i className="bi bi-egg-fried"></i>
                                                                    </div>
                                                                    <span className="fw-semibold text-white">{item.product_name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="text-center">
                                                                <span className="badge bg-dark border border-info border-opacity-40 text-info font-monospace px-2.5 py-1">
                                                                    {item.size || 'Standard'}
                                                                </span>
                                                            </td>
                                                            <td className="text-center">
                                                                <span className="badge bg-secondary bg-opacity-30 border border-secondary text-white px-3 py-1 fw-bold">
                                                                    {item.quantity}x
                                                                </span>
                                                            </td>
                                                            <td className="text-end fw-bold text-warning px-3 px-md-4">
                                                                ₹{item.total_amount}/-
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile List View (< 576px) */}
                                        <div className="d-sm-none p-3 d-flex flex-column gap-2.5">
                                            {group.items.map((item, itemIdx) => (
                                                <div key={itemIdx} className="p-2.5 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-40 d-flex align-items-center justify-content-between gap-2">
                                                    <div className="d-flex align-items-center gap-2 text-truncate">
                                                        <div className="p-1.5 rounded-circle bg-dark text-warning border border-secondary flex-shrink-0" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <i className="bi bi-egg-fried extra-small"></i>
                                                        </div>
                                                        <div className="text-truncate">
                                                            <div className="fw-semibold text-white small text-truncate">{item.product_name}</div>
                                                            <div className="extra-small text-white-50">
                                                                Option: <span className="text-info">{item.size || 'Standard'}</span> • Qty: <span className="text-warning fw-bold">{item.quantity}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="fw-bold text-warning small flex-shrink-0">
                                                        ₹{item.total_amount}/-
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                    </div>

                                    {/* Order Footer: Total Summary & Track Order Action */}
                                    <div className="card-footer bg-dark bg-opacity-80 border-top border-secondary p-3 px-sm-4 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="text-white-50 small">Total ({group.items.length} {group.items.length === 1 ? 'item' : 'items'}):</span>
                                            <span className="fs-5 fw-bold text-warning">₹{group.totalAmount}/-</span>
                                        </div>

                                        <div className="w-100 w-sm-auto text-end">
                                            {isLiveTrackable ? (
                                                <button 
                                                    type="button"
                                                    className="btn btn-warning w-100 w-sm-auto fw-bold d-inline-flex align-items-center justify-content-center gap-2 px-4 py-2 rounded-pill shadow"
                                                    onClick={() => setSelectedTrackOrder(group.firstItem)}
                                                >
                                                    <i className="bi bi-geo-alt-fill fs-6"></i>
                                                    <span>Track Live Delivery (30m ETA)</span>
                                                </button>
                                            ) : (
                                                <span className="text-white-50 extra-small d-inline-flex align-items-center gap-1 bg-dark px-3 py-1.5 rounded-pill border border-secondary border-opacity-40">
                                                    <i className="bi bi-check-all text-success fs-6"></i> Delivered Successfully
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
