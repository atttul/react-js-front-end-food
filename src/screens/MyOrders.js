import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar';

export default function MyOrders() {
    const [getAllOrders, setGetAllOrders] = useState([]);

    const handleGetAllOrders = async () => {
        let allOrders = await fetch(`${process.env.REACT_APP_BASE_URL}/order/fetch`, {
            method: 'GET',
            headers: {
                "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                // "authorization": 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODU2M2U3NmYyZTljMTk4NjIzZjVhZjkiLCJpYXQiOjE3NTA0ODI1NTB9.D3piMaGxxrhCmY2pogTc-FTAhOju4k-4vmtTHqHsNHE',
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
            <button className='btn btn-info m-2' disabled='true'>All My Orders History</button>
            <hr />
            <table className="table table-dark">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Product Name</th>
                        <th scope="col">Quantity</th>
                        <th scope="col">Size</th>
                        <th scope="col">Total Price</th>
                        <th scope="col">Order Status</th>
                        {/* <th scope="col">Order Date</th> */}
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
                                <td>Placed</td>
                                {/* <td>{food?.order_date}</td> */}
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    )
}
