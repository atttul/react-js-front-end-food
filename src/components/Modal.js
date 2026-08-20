import React from 'react'
import ReactDom from 'react-dom'

export default function Modal({ children, onClose }) {
    return ReactDom.createPortal(
        <div className="custom-modal-overlay">
            <div className="custom-modal-content p-4 position-relative text-white">
                <div className="d-flex justify-content-end mb-2">
                    <button 
                        type="button" 
                        className="btn-close btn-close-white fs-5 p-2" 
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

