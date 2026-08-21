import React from 'react'
import ReactDom from 'react-dom'

export default function Modal({ children, onClose }) {
    return ReactDom.createPortal(
        <div className="custom-modal-overlay p-2 p-sm-3">
            <div className="custom-modal-content p-3 p-sm-4 position-relative text-white">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
                    <h5 className="fw-bold mb-0 text-warning d-flex align-items-center fs-5">
                        <i className="bi bi-cart-check-fill me-2"></i> Your Shopping Cart
                    </h5>
                    <button 
                        type="button" 
                        className="btn-close btn-close-white p-2" 
                        aria-label="Close" 
                        onClick={onClose}
                    />
                </div>
                {children}
            </div>
        </div>,
        document.getElementById('cart-root')
    )
}

