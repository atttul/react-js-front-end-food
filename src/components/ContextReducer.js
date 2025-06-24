import React, { createContext, useContext, useReducer, useState } from 'react'

const CartStateContext = createContext();
const CartDispatchContext = createContext();

const reducer = async(state, action) => {
    // const [cartProduct, setCartProduct] = useState({ name: '', qty: '', size: '' });

    if (action.type == 'ADD') {
        // return [...state, {
        //     id: action.id,
        //     name: action.name,
        //     price: action.price,
        //     qty: action.qty,
        //     size: action.size
        // }]
    } else if (action.type == 'REMOVE') {
        // let newArr = [...state]
        // newArr.splice(action.index, 1)
        // return newArr
    } else {
        return "ERROR IN CART Reducer"
    }
}

export const CartProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, []);

    return (
        <CartDispatchContext.Provider value={dispatch}>
            <CartStateContext.Provider value={state}>
                {children}
            </CartStateContext.Provider>
        </CartDispatchContext.Provider>
    )
}

export const useCart = () => useContext(CartStateContext);
export const useDispatchCart = () => useContext(CartDispatchContext);
