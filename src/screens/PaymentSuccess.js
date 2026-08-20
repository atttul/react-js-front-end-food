import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import OrderTrackerModal from "../components/OrderTrackerModal";

const PaymentSuccess = () => {
    const [showTrackModal, setShowTrackModal] = useState(false);

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <div className="container d-flex justify-content-center align-items-center flex-grow-1 py-5">
                <div className="card food-card p-4 p-sm-5 text-center shadow-lg border-0" style={{ maxWidth: '500px', width: '100%' }}>
                    <div className="d-inline-block p-3 p-sm-4 rounded-circle bg-success bg-opacity-25 border border-success mb-3 text-success mx-auto" style={{ width: 'fit-content' }}>
                        <i className="bi bi-check-circle-fill display-4"></i>
                    </div>
                    <h2 className="fw-bold text-white mb-2">Order Confirmed!</h2>
                    <p className="text-muted small mb-4">
                        Your order has been sent to the kitchen! Estimated delivery time is <strong className="text-warning">30 Minutes</strong>.
                    </p>

                    <div className="d-flex flex-column gap-2 mb-3">
                        <button 
                            className="btn btn-warning py-3 fw-bold shadow d-flex align-items-center justify-content-center gap-2"
                            onClick={() => setShowTrackModal(true)}
                        >
                            <i className="bi bi-geo-alt-fill fs-5"></i> Track Live GPS (30 Mins ETA)
                        </button>

                        <Link to="/myorders" className="btn btn-brand py-2 fw-semibold">
                            <i className="bi bi-receipt me-2"></i> View Order History
                        </Link>
                        <Link to="/" className="btn btn-outline-secondary text-white py-2 fw-semibold">
                            Back to Menu
                        </Link>
                    </div>
                </div>
            </div>

            {showTrackModal && (
                <OrderTrackerModal 
                    order={{ product_name: 'Recent Food Order' }}
                    onClose={() => setShowTrackModal(false)}
                />
            )}

            <Footer />
        </div>
    )
}

export default PaymentSuccess;