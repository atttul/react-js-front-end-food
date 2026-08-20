import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function MyOrders() {
    const [getAllOrders, setGetAllOrders] = useState([]);

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

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <div className="container my-5 flex-grow-1">
                <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary pb-3">
                    <h3 className="fw-bold text-white mb-0 d-flex align-items-center">
                        <i className="bi bi-clock-history me-2 text-warning"></i> Order History
                    </h3>
                    <span className="badge bg-dark border border-secondary px-3 py-2 fs-6">
                        Total Orders: {getAllOrders.length}
                    </span>
                </div>

                {getAllOrders.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="bi bi-box2 text-muted display-3 mb-3"></i>
                        <h4 className="text-white fw-bold mb-2">No Past Orders Found</h4>
                        <p className="text-muted">Once you place orders, they will show up here.</p>
                    </div>
                ) : (
                    <div className="table-responsive rounded-3 border border-secondary overflow-hidden shadow">
                        <table className="table table-dark table-hover mb-0 align-middle">
                            <thead className="table-secondary text-uppercase small fw-bold">
                                <tr>
                                    <th scope="col" className="py-3 px-3">#</th>
                                    <th scope="col" className="py-3">Product Name</th>
                                    <th scope="col" className="py-3 text-center">Quantity</th>
                                    <th scope="col" className="py-3 text-center">Size / Option</th>
                                    <th scope="col" className="py-3 text-end">Total Price</th>
                                    <th scope="col" className="py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    getAllOrders.map((food, index) => (
                                        <tr key={index}>
                                            <th scope='row' className="px-3 text-muted">{index + 1}</th>
                                            <td className="fw-semibold text-white">{food.product_name}</td>
                                            <td className="text-center">
                                                <span className="badge bg-dark border border-secondary px-3 py-1">
                                                    {food.quantity}
                                                </span>
                                            </td>
                                            <td className="text-center text-info font-monospace">{food.size}</td>
                                            <td className="text-end fw-bold text-warning">₹{food.total_amount}/-</td>
                                            <td className="text-center">
                                                <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-1 rounded-pill">
                                                    <i className="bi bi-check-circle-fill me-1"></i> Placed
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    )
}

