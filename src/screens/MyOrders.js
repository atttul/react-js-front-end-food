import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import OrderTrackerModal from '../components/OrderTrackerModal';

export default function MyOrders() {
    const [getAllOrders, setGetAllOrders] = useState([]);
    const [foodItemsMap, setFoodItemsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedTrackOrder, setSelectedTrackOrder] = useState(null);
    const [reorderingBatchId, setReorderingBatchId] = useState(null);
    const [reorderToast, setReorderToast] = useState(null);
    const [expandedOrderIds, setExpandedOrderIds] = useState({});

    const navigate = useNavigate();

    const fetchFoodData = async () => {
        try {
            const baseUrl = process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api';
            const cleanBase = baseUrl.replace(/\/$/, '');
            let res = await fetch(`${cleanBase}/food/data`);
            if (res.ok) {
                let data = await res.json();
                let foodList = data.data || [];
                let map = {};
                foodList.forEach(item => {
                    if (item.name) {
                        map[item.name.toLowerCase().trim()] = item.img;
                    }
                });
                setFoodItemsMap(map);
            }
        } catch (err) {
            console.warn("Food data lookup warning:", err);
        }
    };

    const handleGetAllOrders = async () => {
        setLoading(true);
        try {
            const baseUrl = process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api';
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
        fetchFoodData();
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

    const handleReorder = async (groupItems, batchId) => {
        if (!localStorage.getItem("authToken")) return;
        setReorderingBatchId(batchId);
        try {
            const baseUrl = process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api';
            const cleanBase = baseUrl.replace(/\/$/, '');
            for (const item of groupItems) {
                await fetch(`${cleanBase}/add/cart/item`, {
                    method: 'POST',
                    headers: {
                        "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: item.product_name,
                        qty: item.quantity || 1,
                        size: item.size || 'Standard'
                    })
                });
            }
            window.dispatchEvent(new Event('cartUpdated'));
            setReorderToast("Items added to your cart!");
            setTimeout(() => {
                setReorderToast(null);
                navigate('/', { state: { openCart: true } });
            }, 600);
        } catch (err) {
            console.error("Reorder failed:", err);
        } finally {
            setReorderingBatchId(null);
        }
    };

    const toggleExpandOrder = (batchId) => {
        setExpandedOrderIds(prev => {
            const currentlyExpanded = prev[batchId] !== false;
            return {
                ...prev,
                [batchId]: !currentlyExpanded
            };
        });
    };

    const groupedOrders = groupOrdersByBatch(getAllOrders);

    return (
        <div className="d-flex flex-column min-vh-100 bg-dark text-white">
            <Navbar />

            {/* Main Content Container with max-width 840px for ideal spacing */}
            <div className="container py-4 py-md-5 flex-grow-1 my-orders-container px-3 px-sm-4">
                
                {/* Reorder Notification Toast */}
                {reorderToast && (
                    <div className="alert auth-success-alert p-3 mb-3 shadow-lg d-flex align-items-center justify-content-between animate-pulse">
                        <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-bag-check-fill fs-5"></i>
                            <span className="fw-semibold">{reorderToast}</span>
                        </div>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                    </div>
                )}

                {/* 1. Page Header */}
                <div className="card my-orders-header-card border-0 p-3 p-sm-4 mb-4 shadow">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center justify-content-center rounded-circle shadow-sm" 
                                style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #fd5631 0%, #d9381e 100%)' }}>
                                <i className="bi bi-bag-check-fill text-white fs-4"></i>
                            </div>
                            <div>
                                <h3 className="fw-extrabold text-white mb-0 fs-4">My Orders</h3>
                                <p className="text-white-50 small mb-0 mt-0.5">
                                    View your food orders and track your deliveries
                                </p>
                            </div>
                        </div>

                        <div>
                            <span className="badge bg-dark bg-opacity-80 border border-secondary border-opacity-50 text-warning px-3 py-2 fs-6 rounded-pill fw-bold shadow-sm">
                                <i className="bi bi-receipt me-1.5"></i> 
                                {groupedOrders.length} {groupedOrders.length === 1 ? 'Order' : 'Orders'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Loading State */}
                {loading ? (
                    <div className="text-center py-5 my-4">
                        <div className="spinner-border text-warning" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <span className="visually-hidden">Loading Orders...</span>
                        </div>
                        <p className="text-white-50 mt-3 small fw-medium">Fetching your order history...</p>
                    </div>
                ) : groupedOrders.length === 0 ? (
                    /* 3. Empty State */
                    <div className="card my-orders-card border-0 text-center py-5 px-3 my-3 shadow">
                        <div className="d-inline-flex align-items-center justify-content-center p-3.5 rounded-circle bg-dark border border-secondary border-opacity-50 mb-3 text-warning shadow-sm mx-auto" 
                             style={{ width: '68px', height: '68px' }}>
                            <i className="bi bi-bag-x fs-1 text-warning"></i>
                        </div>
                        <h4 className="text-white fw-bold mb-1">No orders yet</h4>
                        <p className="text-white-50 small mb-4" style={{ maxWidth: '360px', margin: '0 auto' }}>
                            Your delicious journey starts here. Explore our menu and treat yourself!
                        </p>
                        <div>
                            <Link to="/" className="btn btn-brand px-4 py-2.5 fw-bold rounded-pill shadow">
                                <i className="bi bi-shop me-2"></i> Browse Food
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* 4. Orders Card Stack */
                    <div className="d-flex flex-column gap-4">
                        {groupedOrders.map((group, groupIdx) => {
                            const isLiveTrackable = isTrackableWithin30Mins(group.date);
                            const isExpanded = expandedOrderIds[group.id] !== false; // default open
                            
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

                            const orderNum = groupedOrders.length - groupIdx;
                            const isCancelled = group.firstItem?.order_status === 'CANCELLED';

                            return (
                                <div key={group.id || groupIdx} className="card my-orders-card border-0 shadow">
                                    
                                    {/* Card Top Section: Order #, Date/Time & Status Badge */}
                                    <div className="my-orders-card-header p-3.5 p-sm-4 d-flex align-items-center justify-content-between flex-wrap gap-2.5">
                                        <div>
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                <h5 className="fw-bold text-white mb-0 fs-6">
                                                    Order #{orderNum}
                                                </h5>
                                                <span className="text-white-50 extra-small">•</span>
                                                <span className="text-white-50 extra-small font-monospace">
                                                    ID: {String(group.id).substring(0, 10)}
                                                </span>
                                            </div>
                                            <div className="text-white-50 extra-small d-flex align-items-center gap-1.5">
                                                <i className="bi bi-clock text-warning opacity-75"></i>
                                                <span>{formattedDate}, {formattedTime}</span>
                                            </div>
                                        </div>

                                        {/* Status Badge Pill */}
                                        <div>
                                            {isCancelled ? (
                                                <span className="order-status-badge order-status-cancelled">
                                                    <i className="bi bi-x-circle-fill"></i> Cancelled
                                                </span>
                                            ) : isLiveTrackable ? (
                                                <span className="order-status-badge order-status-live">
                                                    <i className="bi bi-record-circle-fill text-danger animate-pulse"></i> Out for Delivery
                                                </span>
                                            ) : (
                                                <span className="order-status-badge order-status-delivered">
                                                    <i className="bi bi-check-circle-fill"></i> Delivered
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Body: Order Items */}
                                    {isExpanded && (
                                        <div className="p-3.5 p-sm-4 d-flex flex-column gap-2.5">
                                            {group.items.map((item, itemIdx) => {
                                                const foodImg = foodItemsMap[item.product_name?.toLowerCase().trim()];

                                                return (
                                                    <div key={itemIdx} className="order-item-row d-flex align-items-center justify-content-between gap-3">
                                                        
                                                        {/* Thumbnail & Food Name */}
                                                        <div className="d-flex align-items-center gap-3 text-truncate">
                                                            {foodImg ? (
                                                                <img 
                                                                    src={foodImg} 
                                                                    alt={item.product_name} 
                                                                    className="order-item-thumb shadow-sm" 
                                                                />
                                                            ) : (
                                                                <div className="order-item-placeholder shadow-sm">
                                                                    <i className="bi bi-egg-fried fs-5"></i>
                                                                </div>
                                                            )}

                                                            <div className="text-truncate">
                                                                <div className="fw-bold text-white small text-truncate mb-0.5">
                                                                    {item.product_name}
                                                                </div>
                                                                <div className="extra-small text-white-50">
                                                                    Option: <span className="text-info fw-medium">{item.size || 'Standard'}</span> 
                                                                    <span className="mx-1.5">•</span> 
                                                                    Qty: <span className="text-warning fw-bold">{item.quantity || 1}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Item Price */}
                                                        <div className="text-end flex-shrink-0">
                                                            <span className="fw-bold text-white small">
                                                                ₹{item.total_amount}/-
                                                            </span>
                                                        </div>

                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Card Bottom Section: Total Summary & Actions */}
                                    <div className="my-orders-card-footer p-3.5 p-sm-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                                        {/* Total Summary */}
                                        <div className="d-flex align-items-baseline gap-2">
                                            <span className="text-white-50 small">Total ({group.items.length} {group.items.length === 1 ? 'item' : 'items'}):</span>
                                            <span className="fw-extrabold text-warning fs-5">₹{group.totalAmount}/-</span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
                                            {/* Details Toggle Button */}
                                            <button
                                                type="button"
                                                className="btn btn-outline-light btn-sm rounded-pill px-3 py-1.5 extra-small fw-semibold border-secondary border-opacity-50"
                                                onClick={() => toggleExpandOrder(group.id)}
                                            >
                                                <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                                                {isExpanded ? 'Hide Details' : 'View Details'}
                                            </button>

                                            {/* Track Order Button (if live trackable) */}
                                            {isLiveTrackable && (
                                                <button 
                                                    type="button"
                                                    className="btn btn-warning btn-sm fw-bold rounded-pill px-3.5 py-1.5 shadow extra-small d-flex align-items-center gap-1.5"
                                                    onClick={() => setSelectedTrackOrder(group.firstItem)}
                                                >
                                                    <i className="bi bi-geo-alt-fill"></i> Track Delivery
                                                </button>
                                            )}

                                            {/* Reorder Button */}
                                            <button 
                                                type="button"
                                                className="btn btn-brand btn-sm fw-bold rounded-pill px-3.5 py-1.5 shadow extra-small d-flex align-items-center gap-1.5"
                                                onClick={() => handleReorder(group.items, group.id)}
                                                disabled={reorderingBatchId === group.id}
                                            >
                                                {reorderingBatchId === group.id ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                        <span>Adding...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-arrow-repeat"></i> Reorder
                                                    </>
                                                )}
                                            </button>
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
