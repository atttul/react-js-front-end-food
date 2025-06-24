import React, { useState } from 'react'
// import { useCart, useDispatchCart } from '../components/ContextReducer'

export default function Cart() {

    const [getCartItems, setGetCartItems] = useState([]);
    // const [deleteCartItem, setDeleteCartItem] = useState({ name: '' });
    // const [createOrder, setCreateOrder] = useState([]);

    const handleGetCartItems = async () => {
        let cartItems = await fetch('http://localhost:5000/api/fetch/cart/items', {
            method: 'GET',
            headers: {
                // "authorization": `bearer ${localStorage.getItem("authToken")}`,
                "authorization": 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODU2M2U3NmYyZTljMTk4NjIzZjVhZjkiLCJpYXQiOjE3NTA0ODI1NTB9.D3piMaGxxrhCmY2pogTc-FTAhOju4k-4vmtTHqHsNHE',
                'Content-Type': 'application/json',
            },
        })
        cartItems = await cartItems.json();

        if (!cartItems.success) {
            alert(cartItems.message)
        }
        if (cartItems.success) {
            localStorage.setItem("authToken", cartItems.data.access_token)
        }
        setGetCartItems(cartItems.data)
    }
    handleGetCartItems()

    if (getCartItems.length === 0) {
        return (
            <div>
                <div className='m-5 w-100 text-center fs-3'>The Cart is Empty</div>
            </div>
        )
    }
    let totalPrice = getCartItems.reduce((total, food) => total + food.total_amount, 0)

    const handleDeleteCartItem = async (name) => {
        let cartItemDeleted = await fetch('http://localhost:5000/api/delete/cart/item', {
            method: 'DELETE',
            headers: {
                "authorization": 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODU2M2U3NmYyZTljMTk4NjIzZjVhZjkiLCJpYXQiOjE3NTA0ODI1NTB9.D3piMaGxxrhCmY2pogTc-FTAhOju4k-4vmtTHqHsNHE',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: name })
        })
        cartItemDeleted = await cartItemDeleted.json();
        // setDeleteCartItem(cartItemDeleted.data)
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

        let orderCreated = await fetch('http://localhost:5000/api/order/create', {
            method: 'POST',
            headers: {
                "authorization": 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODU2M2U3NmYyZTljMTk4NjIzZjVhZjkiLCJpYXQiOjE3NTA0ODI1NTB9.D3piMaGxxrhCmY2pogTc-FTAhOju4k-4vmtTHqHsNHE',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        })
        orderCreated = await orderCreated.json();
        // setCreateOrder(orderCreated.data)
    }

    return (
        <div>
            <div className='container m-auto mt-5 table-responsive  table-responsive-sm table-responsive-md' >
                <table className='table table-dark table-hover '>
                    <thead className=' text fs-4'>
                        <tr>
                            <th scope='col' >#</th>
                            <th scope='col' >Name</th>
                            <th scope='col' >Quantity</th>
                            <th scope='col' >Option</th>
                            <th scope='col' >Amount</th>
                            <th scope='col' ></th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            getCartItems.map((food, index) => (
                                <tr>
                                    <th scope='row' >{index + 1}</th>
                                    <td>{food.product_name}</td>
                                    <td>{food.quantity}</td>
                                    <td>{food.size}</td>
                                    <td>{food.total_amount}</td>
                                    <td ><button type="button" className="btn btn-success"><img src='../trash.jpg' alt='delete' onClick={() => {handleDeleteCartItem(food.product_name);}} /></button> </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
                <div><h1 className='fs-2'>Total Price: {totalPrice}/-</h1></div>
                <div>
                    <button className='btn bg-success mt-5' onClick={()=>handleOrderCreate(getCartItems)}> Check Out </button>
                </div>
            </div>
        </div>
    )
}
