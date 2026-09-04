import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function AdminNavbar() {
    const [isNavExpanded, setIsNavExpanded] = useState(false);
    const [adminProfileOpen, setAdminProfileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);

    const adminUserDataStr = localStorage.getItem('adminUserData');
    let adminUser = null;
    try {
        adminUser = adminUserDataStr ? JSON.parse(adminUserDataStr) : null;
    } catch (e) {}

    const adminName = adminUser?.name || "Admin User";
    const adminEmail = adminUser?.email || "admin@merndine.com";

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setAdminProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close mobile nav on route change
    useEffect(() => {
        setIsNavExpanded(false);
        setAdminProfileOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('adminAuthToken');
        localStorage.removeItem('adminUserData');
        navigate('/admin/login');
    };

    return (
        <header className="sticky-top" style={{ zIndex: 1050 }}>
            <nav className="navbar glass-navbar border-bottom border-secondary border-opacity-25 py-2 px-2.5 px-md-4 shadow-sm">
                <div className="container-fluid px-0 px-sm-2 d-flex align-items-center justify-content-between">
                    
                    {/* Brand Logo & Admin Badge */}
                    <div className="d-flex align-items-center gap-2">
                        <Link className="navbar-brand d-flex align-items-center gap-2 m-0 p-0" to="/admin/dashboard">
                            <div className="brand-logo-badge d-flex align-items-center justify-content-center rounded-circle shadow-sm" style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #fd5631 0%, #d9381e 100%)' }}>
                                <i className="bi bi-shield-lock-fill text-white fs-6"></i>
                            </div>
                            <div className="d-flex flex-column justify-content-center">
                                <span className="fs-5 fw-extrabold text-white tracking-tight" style={{ lineHeight: '1.1' }}>
                                    Mern <span style={{ color: 'var(--primary-color, #fd5631)' }}>Dine</span>
                                </span>
                                <span className="extra-small text-warning fw-bold tracking-wider" style={{ fontSize: '0.625rem', letterSpacing: '0.08em' }}>
                                    ADMIN CONTROL PANEL
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Right Side Controls */}
                    <div className="d-flex align-items-center gap-2">
                        
                        {/* Desktop Navigation Links */}
                        <div className="d-none d-md-flex align-items-center gap-3">
                            <ul className="navbar-nav d-flex flex-row align-items-center fw-semibold gap-2 mb-0">
                                <li className="nav-item">
                                    <Link 
                                        className={`nav-link px-3 py-1.5 rounded-3 d-flex align-items-center gap-2 ${location.pathname === '/admin/dashboard' ? 'text-warning active bg-dark bg-opacity-60 fw-bold border border-secondary border-opacity-40' : 'text-white-50'}`} 
                                        to="/admin/dashboard"
                                    >
                                        <i className="bi bi-speedometer2 text-warning"></i>
                                        <span>Dashboard</span>
                                    </Link>
                                </li>

                                <li className="nav-item">
                                    <Link 
                                        className={`nav-link px-3 py-1.5 rounded-3 d-flex align-items-center gap-2 ${location.pathname === '/admin/users' ? 'text-warning active bg-dark bg-opacity-60 fw-bold border border-secondary border-opacity-40' : 'text-white-50'}`} 
                                        to="/admin/users"
                                    >
                                        <i className="bi bi-people-fill text-warning"></i>
                                        <span>Users</span>
                                    </Link>
                                </li>
                            </ul>

                            {/* Admin Profile Dropdown */}
                            <div className="position-relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setAdminProfileOpen(!adminProfileOpen)}
                                    className="btn btn-outline-secondary border-secondary border-opacity-50 text-white rounded-pill px-3 py-1.5 d-flex align-items-center gap-2 shadow-sm"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                                >
                                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-warning text-dark fw-bold" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                                        {adminName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="small fw-semibold text-truncate" style={{ maxWidth: '120px' }}>{adminName}</span>
                                    <i className="bi bi-chevron-down extra-small text-warning"></i>
                                </button>

                                {adminProfileOpen && (
                                    <div className="position-absolute end-0 mt-2 bg-dark text-white rounded-3 border border-secondary shadow-lg py-2" style={{ minWidth: '220px', zIndex: 1100 }}>
                                        <div className="px-3 py-2 border-bottom border-secondary border-opacity-40">
                                            <div className="fw-bold text-white small">{adminName}</div>
                                            <div className="text-muted extra-small text-truncate">{adminEmail}</div>
                                            <span className="badge bg-danger mt-1 text-uppercase extra-small fw-bold">Admin Account</span>
                                        </div>

                                        <Link to="/admin/dashboard" className="dropdown-item text-light py-2 px-3 d-flex align-items-center gap-2">
                                            <i className="bi bi-speedometer2 text-warning"></i> Admin Dashboard
                                        </Link>
                                        <Link to="/admin/users" className="dropdown-item text-light py-2 px-3 d-flex align-items-center gap-2">
                                            <i className="bi bi-people-fill text-warning"></i> Manage Users & Roles
                                        </Link>
                                        <div className="dropdown-divider border-secondary border-opacity-40"></div>
                                        <button onClick={handleLogout} className="dropdown-item text-danger py-2 px-3 d-flex align-items-center gap-2 fw-semibold">
                                            <i className="bi bi-box-arrow-right"></i> Logout Admin
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Toggle Button */}
                        <button
                            className="btn btn-outline-secondary d-md-none text-light border-secondary p-1.5 rounded-3 ms-1"
                            onClick={() => setIsNavExpanded(!isNavExpanded)}
                            aria-label="Toggle navigation"
                        >
                            <i className={`bi bi-${isNavExpanded ? 'x-lg' : 'list'} fs-5`}></i>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                {isNavExpanded && (
                    <div className="d-md-none bg-dark border-top border-secondary border-opacity-40 mt-2 pt-2 pb-3 px-2">
                        <ul className="navbar-nav d-flex flex-column gap-2 mb-3">
                            <li className="nav-item">
                                <Link 
                                    className={`nav-link px-3 py-2 rounded-3 d-flex align-items-center gap-2 ${location.pathname === '/admin/dashboard' ? 'text-warning active bg-secondary bg-opacity-30 fw-bold' : 'text-white-50'}`} 
                                    to="/admin/dashboard"
                                >
                                    <i className="bi bi-speedometer2 text-warning"></i>
                                    <span>Dashboard</span>
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link 
                                    className={`nav-link px-3 py-2 rounded-3 d-flex align-items-center gap-2 ${location.pathname === '/admin/users' ? 'text-warning active bg-secondary bg-opacity-30 fw-bold' : 'text-white-50'}`} 
                                    to="/admin/users"
                                >
                                    <i className="bi bi-people-fill text-warning"></i>
                                    <span>User & Role Management</span>
                                </Link>
                            </li>
                        </ul>

                        <div className="pt-2 border-top border-secondary border-opacity-40 d-flex align-items-center justify-content-between px-2">
                            <div className="d-flex align-items-center gap-2">
                                <div className="d-flex align-items-center justify-content-center rounded-circle bg-warning text-dark fw-bold" style={{ width: '32px', height: '32px' }}>
                                    {adminName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-white small fw-bold">{adminName}</div>
                                    <div className="text-muted extra-small">Admin Account</div>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="btn btn-sm btn-outline-danger font-weight-bold py-1 px-3">
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
