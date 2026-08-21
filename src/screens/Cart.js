import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

export default function Cart(props) {
    const [getCartItems, setGetCartItems] = useState([]);
    const [foodData, setFoodData] = useState([]);
    const navigate = useNavigate();

    const handleGetCartItems = async () => {
        try {
            let res = await fetch(`${process.env.REACT_APP_BASE_URL}/fetch/cart/items`, {
                method: 'GET',
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json',
                },
            });
            let cartItems = await res.json();
            const items = cartItems.data || [];
            setGetCartItems(items);
            if (props.onCartChange) {
                props.onCartChange(items);
            }
        } catch (error) {
            console.error("Error fetching cart items:", error);
        }
    };

    const loadFoodData = async () => {
        try {
            let res = await fetch(`${process.env.REACT_APP_BASE_URL}/food/data`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            let json = await res.json();
            setFoodData(json.data || []);
        } catch (err) {
            console.error("Error fetching food data in Cart:", err);
        }
    };

    useEffect(() => {
        handleGetCartItems();
        loadFoodData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!getCartItems || getCartItems.length === 0) {
        return (
            <div className="text-center py-4 py-sm-5">
                <div className="mb-3">
                    <i className="bi bi-cart-x text-muted" style={{ fontSize: '3.5rem' }}></i>
                </div>
                <h4 className="fw-bold text-white mb-2">Your Cart is Empty</h4>
                <p className="text-muted small">Explore our delicious menu and add your favorite dishes!</p>
            </div>
        );
    }

    let totalPrice = getCartItems.reduce((total, food) => total + food.total_amount, 0);

    const getFoodOptions = (productName) => {
        const found = foodData.find(item => item.name === productName);
        if (found && found.options && found.options[0]) {
            return Object.keys(found.options[0]);
        }
        return [];
    };

    const getOptionUnitPrice = (productName, sizeName) => {
        const found = foodData.find(item => item.name === productName);
        if (found && found.options && found.options[0] && found.options[0][sizeName]) {
            return +found.options[0][sizeName];
        }
        return 0;
    };

    const syncQuantityWithBackend = async (name, newQty, size) => {
        try {
            await fetch(`${process.env.REACT_APP_BASE_URL}/delete/cart/item`, {
                method: 'DELETE',
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name })
            });

            await fetch(`${process.env.REACT_APP_BASE_URL}/add/cart/item`, {
                method: 'POST',
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, qty: newQty, size })
            });
        } catch (err) {
            console.error("Error syncing quantity with backend:", err);
        }
    };

    const handleDeleteCartItem = async (name) => {
        setGetCartItems(prevItems => {
            const filtered = prevItems.filter(item => item.product_name !== name);
            if (props.onCartChange) {
                props.onCartChange(filtered);
            }
            return filtered;
        });

        try {
            await fetch(`${process.env.REACT_APP_BASE_URL}/delete/cart/item`, {
                method: 'DELETE',
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name })
            });
        } catch (error) {
            console.error("Error deleting cart item:", error);
        }
    };

    const handleIncreaseQuantity = (food) => {
        const newQty = food.quantity + 1;
        const unitPrice = food.quantity > 0 ? (food.total_amount / food.quantity) : food.total_amount;

        setGetCartItems(prevItems => {
            const updated = prevItems.map(item =>
                (item.product_name === food.product_name && item.size === food.size)
                    ? { ...item, quantity: newQty, total_amount: unitPrice * newQty }
                    : item
            );
            if (props.onCartChange) {
                props.onCartChange(updated);
            }
            return updated;
        });

        syncQuantityWithBackend(food.product_name, newQty, food.size);
    };

    const handleDecreaseQuantity = (food) => {
        if (food.quantity <= 1) {
            handleDeleteCartItem(food.product_name);
            return;
        }

        const newQty = food.quantity - 1;
        const unitPrice = food.quantity > 0 ? (food.total_amount / food.quantity) : food.total_amount;

        setGetCartItems(prevItems => {
            const updated = prevItems.map(item =>
                (item.product_name === food.product_name && item.size === food.size)
                    ? { ...item, quantity: newQty, total_amount: unitPrice * newQty }
                    : item
            );
            if (props.onCartChange) {
                props.onCartChange(updated);
            }
            return updated;
        });

        syncQuantityWithBackend(food.product_name, newQty, food.size);
    };

    const handleOptionChange = (food, newSize) => {
        const newUnitPrice = getOptionUnitPrice(food.product_name, newSize);
        const newTotalAmount = newUnitPrice > 0
            ? (food.quantity * newUnitPrice)
            : food.total_amount;

        setGetCartItems(prevItems => {
            const updated = prevItems.map(item =>
                (item.product_name === food.product_name)
                    ? { ...item, size: newSize, total_amount: newTotalAmount }
                    : item
            );
            if (props.onCartChange) {
                props.onCartChange(updated);
            }
            return updated;
        });

        syncQuantityWithBackend(food.product_name, food.quantity, newSize);
    };

    const handleOrderCreate = async (getCartItems) => {
        if (!getCartItems || getCartItems.length === 0) return;
        
        localStorage.setItem("lastCartTotal", totalPrice);
        localStorage.setItem("pendingCartItems", JSON.stringify(getCartItems));

        if (props.onClose) {
            props.onClose();
        }

        navigate('/cashfree-payment', { state: { amount: totalPrice, cartItems: getCartItems } });
    };



    return (
        <div className="py-2">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary pb-2">
                <span className="badge bg-secondary rounded-pill px-3 py-2 fs-6">
                    {getCartItems.length} {getCartItems.length === 1 ? 'Item' : 'Items'} in Cart
                </span>
                <span className="fs-5 fw-bold text-warning">
                    Total: ₹{totalPrice}/-
                </span>
            </div>

            {/* Desktop Table View (visible on md and larger) */}
            <div className="d-none d-md-block table-responsive rounded-3 border border-secondary overflow-hidden mb-4">
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
                        {getCartItems.map((food, index) => {
                            const availableOpts = getFoodOptions(food.product_name);
                            return (
                                <tr key={food._id || `${food.product_name}_${food.size}_${index}`}>
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
                                    <td className="text-center">
                                        {availableOpts.length > 0 ? (
                                            <select 
                                                className="custom-select form-select-sm text-info font-monospace text-center py-1 px-2"
                                                value={food.size}
                                                onChange={(e) => handleOptionChange(food, e.target.value)}
                                            >
                                                {availableOpts.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="text-info font-monospace">{food.size}</span>
                                        )}
                                    </td>
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
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card List View (visible on screens smaller than md) */}
            <div className="d-block d-md-none d-flex flex-column gap-3 mb-4">
                {getCartItems.map((food, index) => {
                    const availableOpts = getFoodOptions(food.product_name);
                    return (
                        <div key={food._id || `${food.product_name}_${food.size}_${index}`} className="card bg-dark border border-secondary p-3 rounded-3 shadow-sm">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h6 className="fw-bold text-white mb-1 fs-6">{food.product_name}</h6>
                                    <div className="d-flex align-items-center gap-1 mt-1">
                                        <label className="text-muted extra-small me-1">Option:</label>
                                        {availableOpts.length > 0 ? (
                                            <select 
                                                className="custom-select form-select-sm text-info font-monospace py-1 px-2 extra-small"
                                                value={food.size}
                                                onChange={(e) => handleOptionChange(food, e.target.value)}
                                            >
                                                {availableOpts.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="badge bg-secondary text-info font-monospace extra-small">{food.size}</span>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn btn-outline-danger btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center"
                                    title="Delete item"
                                    onClick={() => handleDeleteCartItem(food.product_name)}
                                    style={{ width: '32px', height: '32px' }}
                                >
                                    <i className="bi bi-trash3-fill"></i>
                                </button>
                            </div>
                            <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary opacity-90 mt-1">
                                <div className="d-inline-flex align-items-center border border-secondary rounded-pill p-1 bg-dark gap-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-outline-danger rounded-circle p-0 d-flex align-items-center justify-content-center"
                                        style={{ width: '26px', height: '26px' }}
                                        title="Decrease quantity"
                                        onClick={() => handleDecreaseQuantity(food)}
                                    >
                                        <i className="bi bi-dash-lg"></i>
                                    </button>
                                    <span className="fw-bold px-2 text-white small">
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
                                <span className="fw-bold text-warning fs-5">₹{food.total_amount}/-</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Summary & Checkout Button */}
            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between pt-2 gap-3 border-top border-secondary mt-2">
                <div className="text-center text-sm-start">
                    <span className="text-muted small me-2">Grand Total Amount:</span>
                    <span className="fs-3 fw-extrabold text-warning">₹{totalPrice}/-</span>
                </div>
                <button 
                    className="btn btn-brand btn-lg w-100 w-sm-auto px-5 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow" 
                    onClick={() => handleOrderCreate(getCartItems)}
                >
                    <i className="bi bi-credit-card-fill"></i> Place Order
                </button>
            </div>
        </div>
    );
}

