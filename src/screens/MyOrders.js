import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import OrderTrackerModal from '../components/OrderTrackerModal';

export default function MyOrders() {
    const [getAllOrders, setGetAllOrders] = useState([]);
    const [selectedTrackOrder, setSelectedTrackOrder] = useState(null);

    const handleGetAllOrders = async () => {
        let allOrders = await fetch(`${process.env.REACT_APP_BASE_URL}/order/fetch`, {
            method: 'GET',
            headers: {
                "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                'Content-Type': 'application/json',
            },
        })
        allOrders = await allOrders.json();
        setGetAllOrders(allOrders.data || [])
    }

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
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <div className="container my-5 flex-grow-1">
                <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary pb-3">
                    <div>
                        <h3 className="fw-bold text-white mb-1 d-flex align-items-center">
                            <i className="bi bi-receipt-cutoff me-2 text-warning"></i> Order History
                        </h3>
                        <p className="text-muted small mb-0">View all your placed food orders & live tracking status</p>
                    </div>
                    <span className="badge bg-dark border border-secondary px-3 py-2 fs-6 rounded-pill">
                        Total Placed Orders: {groupedOrders.length}
                    </span>
                </div>

                {groupedOrders.length === 0 ? (
                    <div className="text-center py-5 my-4">
                        <i className="bi bi-box2 text-muted display-3 mb-3"></i>
                        <h4 className="text-white fw-bold mb-2">No Past Orders Found</h4>
                        <p className="text-muted">Once you place orders, they will show up here.</p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-4">
                        {groupedOrders.map((group, groupIdx) => {
                            const isLiveTrackable = isTrackableWithin30Mins(group.date);
                            const formattedDate = group.date.toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            });

                            return (
                                <div key={groupIdx} className="card food-card border-0 shadow-lg overflow-hidden">
                                    {/* Order Card Header */}
                                    <div className="card-header bg-dark bg-opacity-75 border-bottom border-secondary p-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                                        <div>
                                            <span className="badge bg-secondary me-2">Order #{groupedOrders.length - groupIdx}</span>
                                            <span className="text-muted small">
                                                <i className="bi bi-calendar3 me-1"></i> {formattedDate}
                                            </span>
                                        </div>
                                        <div>
                                            {isLiveTrackable ? (
                                                <span className="badge bg-warning bg-opacity-25 text-warning border border-warning px-3 py-2 rounded-pill small fw-bold">
                                                    <i className="bi bi-record-circle-fill text-danger me-1 animate-pulse"></i> Live Order Active (30 Mins Window)
                                                </span>
                                            ) : (
                                                <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-2 rounded-pill small">
                                                    <i className="bi bi-check-circle-fill me-1"></i> Delivered
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Card Body / Items Table */}
                                    <div className="card-body p-0">
                                        <div className="table-responsive">
                                            <table className="table table-dark table-hover mb-0 align-middle">
                                                <thead className="table-secondary text-uppercase extra-small fw-bold opacity-75">
                                                    <tr>
                                                        <th scope="col" className="py-2 px-3">#</th>
                                                        <th scope="col" className="py-2">Item Name</th>
                                                        <th scope="col" className="py-2 text-center">Quantity</th>
                                                        <th scope="col" className="py-2 text-center">Size / Option</th>
                                                        <th scope="col" className="py-2 text-end px-3">Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.items.map((item, itemIdx) => (
                                                        <tr key={itemIdx}>
                                                            <td className="px-3 text-muted small">{itemIdx + 1}</td>
                                                            <td className="fw-semibold text-white">{item.product_name}</td>
                                                            <td className="text-center">
                                                                <span className="badge bg-dark border border-secondary px-3 py-1">
                                                                    {item.quantity}
                                                                </span>
                                                            </td>
                                                            <td className="text-center text-info font-monospace small">{item.size}</td>
                                                            <td className="text-end fw-bold text-warning px-3">₹{item.total_amount}/-</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Order Card Footer */}
                                    <div className="card-footer bg-dark bg-opacity-50 border-top border-secondary p-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                                        <div>
                                            <span className="text-muted small me-2">Grand Total ({group.items.length} {group.items.length === 1 ? 'Item' : 'Items'}):</span>
                                            <span className="fs-5 fw-bold text-warning">₹{group.totalAmount}/-</span>
                                        </div>

                                        <div>
                                            {isLiveTrackable ? (
                                                <button 
                                                    className="btn btn-warning btn-sm fw-bold d-inline-flex align-items-center px-4 py-2 rounded-pill shadow"
                                                    onClick={() => setSelectedTrackOrder(group.firstItem)}
                                                >
                                                    <i className="bi bi-geo-alt-fill me-2 fs-6"></i> Track Live GPS (30 Mins ETA)
                                                </button>
                                            ) : (
                                                <button className="btn btn-outline-secondary btn-sm text-muted rounded-pill px-3" disabled>
                                                    <i className="bi bi-check-all me-1"></i> Order Completed & Delivered
                                                </button>
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
    )
}



