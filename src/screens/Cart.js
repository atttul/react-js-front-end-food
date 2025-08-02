import React, { useEffect, useState } from 'react'
// import { useCart, useDispatchCart } from '../components/ContextReducer'
import {
    useNavigate
} from 'react-router-dom';
export default function Cart() {

    const [getCartItems, setGetCartItems] = useState([]);
    const navigate = useNavigate();
    // const [deleteCartItem, setDeleteCartItem] = useState({ name: '' });
    // const [createOrder, setCreateOrder] = useState([]);

    const handleGetCartItems = async () => {
        let cartItems = await fetch(`${process.env.REACT_APP_BASE_URL}/fetch/cart/items`, {
            method: 'GET',
            headers: {
                "authorization": `Bearer ${localStorage.getItem("authToken")}`,
                'Content-Type': 'application/json',
            },
        })
        cartItems = await cartItems.json();

        setGetCartItems(cartItems.data)
    }

    useEffect(()=> {
        handleGetCartItems()
    },[])

    if (getCartItems.length === 0) {
        return (
            <div>
                <div className='m-5 w-100 text-center fs-3'>The Cart is Empty</div>
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
        console.log("getCartItems", getCartItems)
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
                                    <td ><button type="button" className="btn btn-success">
                                        <img src='https://imgs.search.brave.com/xhSVqFdFF5tNJnLpRQHIyVFYSbTzkYEGajrqt-phJXo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91eHdp/bmcuY29tL3dwLWNv/bnRlbnQvdGhlbWVz/L3V4d2luZy9kb3du/bG9hZC91c2VyLWlu/dGVyZmFjZS90cmFz/aC1kZWxldGUtd2hp/dGUtaWNvbi5wbmc'
                                        alt='delete' onClick={() => {handleDeleteCartItem(food.product_name);}} 
                                        style={{ width: "20px", height: "20px", objectFit: "contain" }}/></button> </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
                <div><h1 className='fs-2'>Total Price: {totalPrice}/-</h1></div>
                <div>
                    <button className='btn bg-success mt-5' onClick={()=>handleOrderCreate(getCartItems)}> Place Order </button>
                </div>
            </div>
        </div>
    )
}
