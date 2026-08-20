import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer className="mt-auto py-4 bg-dark border-top border-secondary opacity-90">
            <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                <div className="d-flex align-items-center">
                    <span className="fs-5 fw-bold text-white me-2">Mern <span style={{ color: 'var(--primary-color)' }}>Dine</span></span>
                    <span className="text-muted small">© {new Date().getFullYear()} MernDine, Inc. All rights reserved.</span>
                </div>

                <ul className="nav list-unstyled d-flex gap-3 mb-0">
                    <li><Link className="text-muted fs-5 hover-white" to="#"><i className="bi bi-twitter-x"></i></Link></li>
                    <li><Link className="text-muted fs-5 hover-white" to="#"><i className="bi bi-instagram"></i></Link></li>
                    <li><Link className="text-muted fs-5 hover-white" to="#"><i className="bi bi-facebook"></i></Link></li>
                </ul>
            </div>
        </footer>
    )
}

