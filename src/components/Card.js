import React, { useEffect, useRef, useState } from 'react'
import { useDispatchCart } from './ContextReducer';

export default function Card(props) {
    const options = Object.keys(props.options);

    // let dispatch = useDispatchCart()
    let [qty, setQty] = useState(1)
    let [size, setSize] = useState()
    const [successMessage, setSuccessMessage] = useState('');

    const handleAddCart = async () => {
        let addedCartItem = await fetch(`${process.env.REACT_APP_BASE_URL}/add/cart/item`, {
            method: 'POST',
            headers: {
                "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                // "authorization": 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODU2M2U3NmYyZTljMTk4NjIzZjVhZjkiLCJpYXQiOjE3NTA0ODI1NTB9.D3piMaGxxrhCmY2pogTc-FTAhOju4k-4vmtTHqHsNHE',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: props.foodItem.name, qty: qty, size: size })
        })
        addedCartItem = await addedCartItem.json();

        if (!addedCartItem.success) {
            alert(addedCartItem.message)
        }
        // if (addedCartItem.success) {
        //     alert(addedCartItem.message)
        // }
        // ✅ Set success message
        setSuccessMessage('Item added to cart successfully!');

        // ✅ Clear it after 5 seconds
        setTimeout(() => {
            setSuccessMessage('');
        }, 3000);

        // await dispatch({
        //     type: 'ADD',
        //     id: props.foodItem._id,
        //     name: props.foodItem.name,
        //     price: finalPrice,
        //     qty: qty,
        //     size: size
        // })
    }

    let finalPrice = qty * +props.options[size]

    let priceRef = useRef();
    useEffect(() => {
        setSize(priceRef.current.value)
    }, [])

    return (
        <div id='cart-root'>
            <div className="card m-3" >
                <div className="card-body">
                    <h5 className="card-title mb-1">{props.foodItem.name}</h5>
                    {successMessage && (
                        <div className="alert alert-success" role="alert">
                            {successMessage}
                        </div>
                    )}
                    <img
                        src={props.foodItem.img}
                        alt="food"
                        className="w-100"
                        style={{ height: "150px", objectFit: "cover", borderRadius: "8px" }}
                    />

                    {/* this is first loop DROPDOWN */}
                    <select className='bg-info rounded' onChange={(e) => setQty(e.target.value)}>
                        {Array.from(Array(6), (e, i) => {
                            return (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                            )
                        })}
                    </select>
                    {/* this is second loop DROPDOWN */}
                    <select className='m-2 h-100 bg-warning rounded' ref={priceRef} onChange={(e) => { setSize(e.target.value) }}>
                        {options.map(data => {
                            return (
                                <option key={data} value={data}>{data}</option>
                            )
                        })
                        }
                    </select>
                    <div className='d-inline fs-5' >Price = {finalPrice}/-</div>
                    <hr />
                    <div>
                        <button className='btn btn-light' onClick={handleAddCart}>Add To Cart</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
