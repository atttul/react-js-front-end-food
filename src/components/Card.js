import React, { useEffect, useRef, useState } from 'react'

export default function Card(props) {
    const options = Object.keys(props.options);

    let [qty, setQty] = useState(1)
    let [size, setSize] = useState()
    const [successMessage, setSuccessMessage] = useState('');

    const handleAddCart = async () => {
        if (localStorage.getItem("authToken") === null) {
            setSuccessMessage('Please login to add items to the cart!');
            setTimeout(() => {
                setSuccessMessage('');
            }, 5000);
            return;
        }
        let addedCartItem = await fetch(`${process.env.REACT_APP_BASE_URL}/add/cart/item`, {
            method: 'POST',
            headers: {
                "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: props.foodItem.name, qty: qty, size: size })
        })
        addedCartItem = await addedCartItem.json();

        if (!addedCartItem.success) {
            alert(addedCartItem.message)
        }

        // ✅ Set success message
        setSuccessMessage('Item added to cart successfully!');

        // ✅ Clear it after 3 seconds
        setTimeout(() => {
            setSuccessMessage('');
        }, 3000);
    }

    let finalPrice = qty * +props.options[size]

    let priceRef = useRef();
    useEffect(() => {
        setSize(priceRef.current.value)
    }, [])

    return (
        <div>
            <div className="card food-card h-100 border-0 shadow-sm">
                <div className="overflow-hidden position-relative" style={{ height: "180px" }}>
                    <img
                        src={props.foodItem.img}
                        alt={props.foodItem.name}
                        className="w-100 h-100 food-card-img"
                        style={{ objectFit: "cover" }}
                    />
                </div>
                <div className="card-body d-flex flex-column justify-content-between p-3">
                    <div>
                        <h5 className="card-title fw-bold text-white mb-2 fs-5">{props.foodItem.name}</h5>
                        {successMessage && (
                            <div className={`alert ${localStorage.getItem("authToken") ? 'alert-success' : 'alert-warning'} py-2 px-3 small rounded-3 mb-2`} role="alert">
                                {successMessage}
                            </div>
                        )}
                        
                        <div className="d-flex align-items-center justify-content-between my-3 gap-2">
                            <div className="d-flex align-items-center gap-1">
                                <label className="text-muted small me-1">Qty:</label>
                                <select className="custom-select form-select-sm" onChange={(e) => setQty(e.target.value)}>
                                    {Array.from(Array(6), (e, i) => {
                                        return (
                                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                                        )
                                    })}
                                </select>
                            </div>

                            <div className="d-flex align-items-center gap-1">
                                <label className="text-muted small me-1">Option:</label>
                                <select className="custom-select form-select-sm" ref={priceRef} onChange={(e) => { setSize(e.target.value) }}>
                                    {options.map(data => {
                                        return (
                                            <option key={data} value={data}>{data}</option>
                                        )
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="border-top border-secondary pt-3 mt-1">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <span className="text-muted small">Total Price</span>
                            <span className="fs-5 fw-bold text-warning">₹{finalPrice}/-</span>
                        </div>
                        <button className="btn btn-brand w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2" onClick={handleAddCart}>
                            <i className="bi bi-bag-plus fs-6"></i> Add To Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

