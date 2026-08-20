import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

export default function Cart() {
    const [getCartItems, setGetCartItems] = useState([]);
    const navigate = useNavigate();

    const handleGetCartItems = async () => {
        let cartItems = await fetch(`${process.env.REACT_APP_BASE_URL}/fetch/cart/items`, {
            method: 'GET',
            headers: {
                "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                'Content-Type': 'application/json',
            },
        })
        cartItems = await cartItems.json();
        setGetCartItems(cartItems.data || [])
    }

    useEffect(() => {
        handleGetCartItems()
    }, [])

    if (!getCartItems || getCartItems.length === 0) {
        return (
            <div className="text-center py-5">
                <div className="mb-3">
                    <i className="bi bi-cart-x text-muted" style={{ fontSize: '4rem' }}></i>
                </div>
                <h3 className="fw-bold text-white mb-2">Your Cart is Empty</h3>
                <p className="text-muted">Explore our delicious menu and add your favorite dishes!</p>
            </div>
        )
    }

    let totalPrice = getCartItems.reduce((total, food) => total + food.total_amount, 0)

    const handleDeleteCartItem = async (name) => {
        let cartItemDeleted = await fetch(`${process.env.REACT_APP_BASE_URL}/delete/cart/item`, {
            method: 'DELETE',
            headers: {
                "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: name })
        })
        cartItemDeleted = await cartItemDeleted.json();
        handleGetCartItems()
    }

    const handleOrderCreate = async (getCartItems) => {
        let requestBody = []
        for (const cartItem of getCartItems) {
            requestBody.push(
                {
                    userId: cartItem.user_id,
                    email: '@gmail.com',
                    name: cartItem.product_name,
                    qty: cartItem.quantity,
                    size: cartItem.size
                })
        }

        let orderCreated = await fetch(`${process.env.REACT_APP_BASE_URL}/order/create`, {
            method: 'POST',
            headers: {
                "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        })
        orderCreated = await orderCreated.json();
        navigate('/cashfree-payment', { state: { amount: totalPrice } });
        handleGetCartItems()
    }

    return (
        <div className="py-3">
            <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary pb-3">
                <h4 className="fw-bold text-white mb-0 d-flex align-items-center">
                    <i className="bi bi-cart-check me-2 text-warning"></i> Your Cart Items
                </h4>
                <span className="badge bg-secondary rounded-pill px-3 py-2 fs-6">
                    {getCartItems.length} {getCartItems.length === 1 ? 'Item' : 'Items'}
                </span>
            </div>

            <div className="table-responsive rounded-3 border border-secondary overflow-hidden mb-4">
                <table className="table table-dark table-hover mb-0 align-middle">
                    <thead className="table-secondary text-uppercase small fw-bold">
                        <tr>
                            <th scope="col" className="py-3 px-3">#</th>
                            <th scope="col" className="py-3">Item Name</th>
                            <th scope="col" className="py-3 text-center">Quantity</th>
                            <th scope="col" className="py-3 text-center">Option</th>
                            <th scope="col" className="py-3 text-end">Amount</th>
                            <th scope="col" className="py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            getCartItems.map((food, index) => (
                                <tr key={index}>
                                    <th scope="row" className="px-3 text-muted">{index + 1}</th>
                                    <td className="fw-semibold text-white">{food.product_name}</td>
                                    <td className="text-center">
                                        <span className="badge bg-dark border border-secondary px-3 py-1">
                                            {food.quantity}
                                        </span>
                                    </td>
                                    <td className="text-center text-info font-monospace">{food.size}</td>
                                    <td className="text-end fw-bold text-warning">₹{food.total_amount}/-</td>
                                    <td className="text-center">
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-danger btn-sm rounded-circle p-2 d-inline-flex align-items-center justify-content-center"
                                            title="Delete item"
                                            onClick={() => {handleDeleteCartItem(food.product_name);}}
                                            style={{ width: '36px', height: '36px' }}
                                        >
                                            <i className="bi bi-trash3-fill"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>

            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between pt-2 gap-3">
                <div>
                    <span className="text-muted fs-6 me-2">Total Amount:</span>
                    <span className="fs-2 fw-extrabold text-warning">₹{totalPrice}/-</span>
                </div>
                <button 
                    className="btn btn-brand btn-lg px-5 py-2 fw-bold d-flex align-items-center gap-2 shadow" 
                    onClick={()=>handleOrderCreate(getCartItems)}
                >
                    <i className="bi bi-credit-card-fill"></i> Place Order
                </button>
            </div>
        </div>
    )
}

