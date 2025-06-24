import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar';

export default function MyOrders() {
    const [getAllOrders, setGetAllOrders] = useState([]);

    const handleGetAllOrders = async () => {
        let allOrders = await fetch('http://localhost:5000/api/order/fetch', {
            method: 'GET',
            headers: {
                // "authorization": `bearer ${localStorage.getItem("authToken")}`,
                "authorization": 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODU2M2U3NmYyZTljMTk4NjIzZjVhZjkiLCJpYXQiOjE3NTA0ODI1NTB9.D3piMaGxxrhCmY2pogTc-FTAhOju4k-4vmtTHqHsNHE',
                'Content-Type': 'application/json',
            },
        })
        allOrders = await allOrders.json();

        setGetAllOrders(allOrders.data)
    }

    useEffect(() => {
        handleGetAllOrders();
    }, []);

    return (
        <div>
            <div><Navbar /></div>
            <h5 className='d-flex'>My Orders</h5>
            <hr />
            <table className="table table-dark">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Product Name</th>
                        <th scope="col">Quantity</th>
                        <th scope="col">Size</th>
                        <th scope="col">Total Price</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        getAllOrders.map((food, index) => (
                            <tr>
                                <th scope='row'>{index + 1}</th>
                                <td>{food.product_name}</td>
                                <td>{food.quantity}</td>
                                <td>{food.size}</td>
                                <td>{food.total_amount}</td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    )
}
