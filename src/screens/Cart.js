import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

export default function Cart(props) {
    const [getCartItems, setGetCartItems] = useState([]);
    const navigate = useNavigate();

    // Helper to preserve exact item positions across backend re-fetches
    const preserveItemOrder = (newFetchedItems, currentItems) => {
        if (!currentItems || currentItems.length === 0) return newFetchedItems;

        const indexMap = new Map();
        currentItems.forEach((item, idx) => {
            const key = `${item.product_name}_${item.size}`;
            if (!indexMap.has(key)) {
                indexMap.set(key, idx);
            }
        });

        return [...newFetchedItems].sort((a, b) => {
            const keyA = `${a.product_name}_${a.size}`;
            const keyB = `${b.product_name}_${b.size}`;
            const posA = indexMap.has(keyA) ? indexMap.get(keyA) : 9999;
            const posB = indexMap.has(keyB) ? indexMap.get(keyB) : 9999;
            return posA - posB;
        });
    };

    const handleGetCartItems = async () => {
        try {
            let res = await fetch(`${process.env.REACT_APP_BASE_URL}/fetch/cart/items`, {
                method: 'GET',
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json',
                },
            })
            let cartItems = await res.json();
            const rawItems = cartItems.data || [];

            setGetCartItems(prevItems => {
                const orderedItems = preserveItemOrder(rawItems, prevItems);
                if (props.onCartChange) {
                    props.onCartChange(orderedItems);
                }
                return orderedItems;
            });
        } catch (error) {
            console.error("Error fetching cart items:", error);
        }
    }

    useEffect(() => {
        handleGetCartItems()
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Optimistic local state update
        setGetCartItems(prevItems => prevItems.filter(item => item.product_name !== name));

        try {
            await fetch(`${process.env.REACT_APP_BASE_URL}/delete/cart/item`, {
                method: 'DELETE',
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name })
            })
            await handleGetCartItems()
        } catch (error) {
            console.error("Error deleting cart item:", error);
            handleGetCartItems()
        }
    }

    const handleIncreaseQuantity = async (food) => {
        const newQty = food.quantity + 1;
        const unitPrice = food.quantity > 0 ? (food.total_amount / food.quantity) : food.total_amount;

        // Optimistic local state update in exact position
        setGetCartItems(prevItems =>
            prevItems.map(item =>
                (item.product_name === food.product_name && item.size === food.size)
                    ? { ...item, quantity: newQty, total_amount: unitPrice * newQty }
                    : item
            )
        );

        try {
            await fetch(`${process.env.REACT_APP_BASE_URL}/delete/cart/item`, {
                method: 'DELETE',
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: food.product_name })
            });

            await fetch(`${process.env.REACT_APP_BASE_URL}/add/cart/item`, {
                method: 'POST',
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: food.product_name, qty: newQty, size: food.size })
            });

            await handleGetCartItems();
        } catch (error) {
            console.error("Error increasing cart item quantity:", error);
            handleGetCartItems();
        }
    };

    const handleDecreaseQuantity = async (food) => {
        if (food.quantity <= 1) {
            handleDeleteCartItem(food.product_name);
            return;
        }

        const newQty = food.quantity - 1;
        const unitPrice = food.quantity > 0 ? (food.total_amount / food.quantity) : food.total_amount;

        // Optimistic local state update in exact position
        setGetCartItems(prevItems =>
            prevItems.map(item =>
                (item.product_name === food.product_name && item.size === food.size)
                    ? { ...item, quantity: newQty, total_amount: unitPrice * newQty }
                    : item
            )
        );

        try {
            await fetch(`${process.env.REACT_APP_BASE_URL}/delete/cart/item`, {
                method: 'DELETE',
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: food.product_name })
            });

            await fetch(`${process.env.REACT_APP_BASE_URL}/add/cart/item`, {
                method: 'POST',
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: food.product_name, qty: newQty, size: food.size })
            });

            await handleGetCartItems();
        } catch (error) {
            console.error("Error decreasing cart item quantity:", error);
            handleGetCartItems();
        }
    };

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

        await fetch(`${process.env.REACT_APP_BASE_URL}/order/create`, {
            method: 'POST',
            headers: {
                "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        })
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
                                <tr key={food._id || `${food.product_name}_${food.size}`}>
                                    <th scope="row" className="px-3 text-muted">{index + 1}</th>
                                    <td className="fw-semibold text-white">{food.product_name}</td>
                                    <td className="text-center">
                                        <div className="d-inline-flex align-items-center justify-content-center border border-secondary rounded-pill p-1 bg-dark gap-2">
                                            <button 
                                                type="button" 
                                                className="btn btn-sm btn-outline-danger rounded-circle p-0 d-flex align-items-center justify-content-center"
                                                style={{ width: '26px', height: '26px' }}
                                                title="Decrease quantity"
                                                onClick={() => handleDecreaseQuantity(food)}
                                            >
                                                <i className="bi bi-dash-lg"></i>
                                            </button>
                                            <span className="fw-bold px-2 text-white" style={{ minWidth: '24px', textAlign: 'center' }}>
                                                {food.quantity}
                                            </span>
                                            <button 
                                                type="button" 
                                                className="btn btn-sm btn-outline-success rounded-circle p-0 d-flex align-items-center justify-content-center"
                                                style={{ width: '26px', height: '26px' }}
                                                title="Increase quantity"
                                                onClick={() => handleIncreaseQuantity(food)}
                                            >
                                                <i className="bi bi-plus-lg"></i>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="text-center text-info font-monospace">{food.size}</td>
                                    <td className="text-end fw-bold text-warning">₹{food.total_amount}/-</td>
                                    <td className="text-center">
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-danger btn-sm rounded-circle p-2 d-inline-flex align-items-center justify-content-center"
                                            title="Delete item"
                                            onClick={() => handleDeleteCartItem(food.product_name)}
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

