import React, { useEffect, useRef, useState } from 'react'

export default function Card(props) {
    const options = Object.keys(props.options);
    const [size, setSize] = useState();
    const [successMessage, setSuccessMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const priceRef = useRef();

    useEffect(() => {
        if (priceRef.current && priceRef.current.value) {
            setSize(priceRef.current.value);
        } else if (options.length > 0) {
            setSize(options[0]);
        }
    }, [options]);

    const handleAddCart = async () => {
        if (localStorage.getItem("authToken") === null) {
            setMessageType('warning');
            setSuccessMessage('Please login to add items to cart!');
            setTimeout(() => setSuccessMessage(''), 4000);
            return;
        }
        const baseUrl = (process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api').replace(/\/$/, '');
        try {
            let res = await fetch(`${baseUrl}/add/cart/item`, {
                method: 'POST',
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: props.foodItem.name, qty: 1, size: size || options[0] })
            });
            let data = await res.json();
            if (!data.success) {
                alert(data.message);
                return;
            }
            window.dispatchEvent(new Event('cartUpdated'));
            setMessageType('success');
            setSuccessMessage('Item added to cart!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Add to cart error:", err);
        }
    };

    const handleRemoveCart = async () => {
        if (localStorage.getItem("authToken") === null) return;
        const baseUrl = (process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api').replace(/\/$/, '');
        try {
            let res = await fetch(`${baseUrl}/delete/cart/item`, {
                method: 'DELETE',
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: props.foodItem.name })
            });
            let data = await res.json();
            if (data.success) {
                window.dispatchEvent(new Event('cartUpdated'));
                setMessageType('danger');
                setSuccessMessage('Item removed from cart!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            console.error("Remove from cart error:", err);
        }
    };

    const unitPrice = size && props.options[size] ? +props.options[size] : (options[0] ? +props.options[options[0]] : 0);
    const isInCart = props.isInCart || false;

    return (
        <div className="card food-card w-100 h-100 border-0 shadow-sm d-flex flex-column justify-content-between">
            <div className="food-card-img-wrapper position-relative">
                <img
                    src={props.foodItem.img}
                    alt={props.foodItem.name}
                    className="food-card-img"
                    loading="lazy"
                    decoding="async"
                />
                {isInCart && (
                    <span className="position-absolute top-0 end-0 m-2 badge bg-success shadow-sm d-flex align-items-center gap-1 extra-small px-2 py-1" style={{ zIndex: 2 }}>
                        <i className="bi bi-bag-check-fill"></i> In Cart
                    </span>
                )}
            </div>
            <div className="card-body d-flex flex-column justify-content-between p-3 flex-grow-1">
                <div>
                    <h6 className="card-title food-card-title fw-bold text-white mb-2 fs-6">{props.foodItem.name}</h6>
                    {successMessage && (
                        <div className={`alert ${messageType === 'success' ? 'alert-success' : messageType === 'danger' ? 'alert-danger' : 'alert-warning'} py-1 px-2 extra-small rounded-3 mb-2`} role="alert">
                            {successMessage}
                        </div>
                    )}

                    {/* Option / Size Control */}
                    <div className="d-flex align-items-center gap-2 my-2">
                        <label className="text-white-50 extra-small fw-semibold mb-0 flex-shrink-0">Option:</label>
                        <select className="custom-select form-select-sm w-100 text-capitalize cursor-pointer" ref={priceRef} value={size} onChange={(e) => setSize(e.target.value)}>
                            {options.map(data => (
                                <option key={data} value={data}>{data.replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Price Section & Action Buttons (Add / Remove) */}
                <div className="border-top border-secondary border-opacity-30 pt-2.5 mt-2">
                    <div className="d-flex align-items-center justify-content-between mb-2.5">
                        <span className="text-white-50 extra-small fw-semibold">Price</span>
                        <span className="fw-bold text-warning fs-6">₹{unitPrice}/-</span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        {/* Add Button */}
                        {!isInCart ? (
                            <button className="btn btn-brand py-2 px-2.5 fw-bold d-flex align-items-center justify-content-center gap-1 flex-grow-1 small shadow-sm" onClick={handleAddCart}>
                                <i className="bi bi-bag-plus fs-6"></i> Add To Cart
                            </button>
                        ) : (
                            <button className="btn btn-success py-2 px-2.5 fw-bold d-flex align-items-center justify-content-center gap-1 flex-grow-1 small opacity-90 disabled" disabled>
                                <i className="bi bi-check-circle-fill fs-6"></i> Added
                            </button>
                        )}

                        {/* Remove Button: Highlighted when in cart, Un-highlighted / disabled when not in cart */}
                        {isInCart ? (
                            <button className="btn btn-outline-danger py-2 px-2.5 fw-bold d-flex align-items-center justify-content-center gap-1 small shadow-sm" onClick={handleRemoveCart} title="Remove item from cart">
                                <i className="bi bi-trash3-fill fs-6"></i> Remove
                            </button>
                        ) : (
                            <button className="btn btn-outline-secondary opacity-40 py-2 px-2.5 fw-bold d-flex align-items-center justify-content-center gap-1 small text-white-50 disabled" disabled title="Item not in cart">
                                <i className="bi bi-trash fs-6"></i> Remove
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
