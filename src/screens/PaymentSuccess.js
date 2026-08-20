import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PaymentSuccess = () => {
    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <div className="container d-flex justify-content-center align-items-center flex-grow-1 py-5">
                <div className="card food-card p-5 text-center shadow-lg border-0" style={{ maxWidth: '480px', width: '100%' }}>
                    <div className="d-inline-block p-4 rounded-circle bg-success bg-opacity-25 border border-success mb-4 text-success mx-auto" style={{ width: 'fit-content' }}>
                        <i className="bi bi-check-circle-fill display-3"></i>
                    </div>
                    <h2 className="fw-bold text-white mb-2">Order Confirmed!</h2>
                    <p className="text-muted mb-4">
                        Thank you for dining with us! Your order has been placed successfully and is being prepared.
                    </p>
                    <div className="d-flex flex-column gap-2">
                        <Link to="/myorders" className="btn btn-brand py-2 fw-semibold">
                            <i className="bi bi-receipt me-2"></i> View My Orders
                        </Link>
                        <Link to="/" className="btn btn-outline-secondary text-white py-2 fw-semibold">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default PaymentSuccess;