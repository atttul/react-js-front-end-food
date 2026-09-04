import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';

export default function AdminUsers() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingUserId, setUpdatingUserId] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    const adminUserDataStr = localStorage.getItem('adminUserData');
    let currentAdminId = null;
    try {
        if (adminUserDataStr) {
            const parsed = JSON.parse(adminUserDataStr);
            currentAdminId = parsed._id || parsed.id;
        }
    } catch (e) {}

    // Verify Admin authentication on mount
    useEffect(() => {
        const token = localStorage.getItem('adminAuthToken');
        const userDataStr = localStorage.getItem('adminUserData');
        let adminUser = null;
        try {
            adminUser = userDataStr ? JSON.parse(userDataStr) : null;
        } catch (e) {}

        if (!token || !adminUser || adminUser.role !== 'admin') {
            navigate('/admin/login');
        }
    }, [navigate]);

    // Fetch registered users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('adminAuthToken');
        if (!token) return;

        try {
            const localUrl = 'http://localhost:5000/api';
            const remoteUrl = (process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api').replace(/\/$/, '');
            const urlsToTry = [localUrl, remoteUrl];

            let data = null;

            for (const baseUrl of urlsToTry) {
                try {
                    const res = await fetch(`${baseUrl}/admin/users`, {
                        method: 'GET',
                        headers: {
                            'authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (res.status === 401 || res.status === 403) {
                        localStorage.removeItem('adminAuthToken');
                        localStorage.removeItem('adminUserData');
                        navigate('/admin/login');
                        return;
                    }

                    if (res.ok) {
                        data = await res.json();
                        if (data && data.success) break;
                    }
                } catch (e) {
                    console.warn(`Attempt to ${baseUrl} failed:`, e);
                }
            }

            if (data && data.success) {
                setUsers(data.data || []);
                setErrorMsg(null);
            } else {
                setErrorMsg(data?.message || "Failed to fetch users.");
            }
        } catch (err) {
            console.error("Fetch users error:", err);
            setErrorMsg("Network error when fetching users.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Role change handler
    const handleRoleChange = async (targetUser, newRole) => {
        const targetUserId = targetUser._id;

        // Security check frontend
        if (String(targetUserId) === String(currentAdminId)) {
            setErrorMsg("Security Policy Violation: You cannot change your own administrative role.");
            return;
        }

        setUpdatingUserId(targetUserId);
        setSuccessMsg(null);
        setErrorMsg(null);
        const token = localStorage.getItem('adminAuthToken');

        try {
            const localUrl = 'http://localhost:5000/api';
            const remoteUrl = (process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api').replace(/\/$/, '');
            const urlsToTry = [localUrl, remoteUrl];

            let resData = null;

            for (const baseUrl of urlsToTry) {
                try {
                    const res = await fetch(`${baseUrl}/admin/users/${targetUserId}/role`, {
                        method: 'PATCH',
                        headers: {
                            'authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ role: newRole })
                    });
                    resData = await res.json();
                    if (res.ok && resData.success) break;
                } catch (e) {}
            }

            if (resData && resData.success) {
                setSuccessMsg(resData.message || `User role successfully updated to ${newRole}`);
                setUsers(prevUsers =>
                    prevUsers.map(u => (u._id === targetUserId ? { ...u, role: newRole } : u))
                );
            } else {
                setErrorMsg(resData?.message || "Failed to update user role.");
            }
        } catch (err) {
            setErrorMsg("Network error when updating user role.");
        } finally {
            setUpdatingUserId(null);
        }
    };

    // Search filter
    const filteredUsers = users.filter((u) => {
        const term = searchTerm.toLowerCase();
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = String(u.phone_number || '');
        return name.includes(term) || email.includes(term) || phone.includes(term);
    });

    return (
        <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#e0e0e0' }} className="d-flex flex-column">
            <AdminNavbar />

            <main className="container-fluid px-3 px-md-4 py-4 flex-grow-1">
                {/* Header Banner */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 bg-dark rounded-4 p-3.5 p-md-4 border border-secondary shadow-sm">
                    <div>
                        <h2 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
                            <i className="bi bi-people-fill text-warning"></i> User & Role Management
                        </h2>
                        <p className="text-light small mb-0 opacity-85">
                            Manage user accounts, view profile information, and assign access roles.
                        </p>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <span className="badge bg-secondary text-light px-3 py-2 fs-6 rounded-pill border border-secondary">
                            Total Users: <strong className="text-warning">{users.length}</strong>
                        </span>
                        <button
                            onClick={fetchUsers}
                            className="btn btn-outline-secondary btn-sm text-light border-secondary"
                            title="Refresh List"
                        >
                            <i className="bi bi-arrow-repeat"></i> Refresh
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {successMsg && (
                    <div className="alert alert-success alert-dismissible fade show rounded-3 small py-2.5 px-3 mb-3" role="alert">
                        <i className="bi bi-check-circle-fill me-2 fs-6"></i>
                        {successMsg}
                        <button type="button" className="btn-close btn-close-white py-2" onClick={() => setSuccessMsg(null)}></button>
                    </div>
                )}
                {errorMsg && (
                    <div className="alert alert-danger alert-dismissible fade show rounded-3 small py-2.5 px-3 mb-3" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2 fs-6"></i>
                        {errorMsg}
                        <button type="button" className="btn-close btn-close-white py-2" onClick={() => setErrorMsg(null)}></button>
                    </div>
                )}

                {/* Search Bar */}
                <div className="mb-4">
                    <div className="input-group" style={{ maxWidth: '480px' }}>
                        <span className="input-group-text bg-dark text-warning border-secondary">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control bg-dark text-white border-secondary"
                            placeholder="Search by name, email, or phone number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                className="btn btn-outline-secondary border-secondary text-light"
                                onClick={() => setSearchTerm('')}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Users List Table & Mobile Cards */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading Users...</span>
                        </div>
                        <p className="text-light mt-3">Fetching registered user accounts...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-5 bg-dark rounded-4 border border-secondary p-4">
                        <i className="bi bi-person-x text-warning opacity-75" style={{ fontSize: '3.5rem' }}></i>
                        <h4 className="fw-bold text-white mt-3 mb-2">No users found</h4>
                        <p className="text-light small">Try adjusting your search keywords.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="d-none d-md-block table-responsive rounded-4 border border-secondary overflow-hidden shadow-sm mb-4">
                            <table className="table table-dark table-hover mb-0 align-middle">
                                <thead className="table-secondary text-uppercase small fw-bold" style={{ backgroundColor: '#212529' }}>
                                    <tr>
                                        <th scope="col" className="py-3 px-3">#</th>
                                        <th scope="col" className="py-3">User Name</th>
                                        <th scope="col" className="py-3">Email Address</th>
                                        <th scope="col" className="py-3">Phone Number</th>
                                        <th scope="col" className="py-3">Location / Address</th>
                                        <th scope="col" className="py-3 text-center">Role Status</th>
                                        <th scope="col" className="py-3 text-center">Role Management</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user, idx) => {
                                        const isSelf = String(user._id) === String(currentAdminId);
                                        const userRole = user.role || 'user';
                                        const isAdmin = userRole === 'admin';

                                        return (
                                            <tr key={user._id || idx}>
                                                <th scope="row" className="px-3 text-muted">{idx + 1}</th>
                                                <td className="fw-bold text-white">
                                                    {user.name}
                                                    {isSelf && (
                                                        <span className="badge bg-warning text-dark ms-2 extra-small">You</span>
                                                    )}
                                                </td>
                                                <td className="text-warning-emphasis font-monospace small">{user.email || 'N/A'}</td>
                                                <td className="text-light small">{user.phone_number || 'N/A'}</td>
                                                <td className="text-light small text-truncate" style={{ maxWidth: '200px' }}>
                                                    {user.location || 'Not provided'}
                                                </td>
                                                <td className="text-center">
                                                    <span className={`badge ${isAdmin ? 'bg-danger text-white' : 'bg-secondary text-light'} px-3 py-1.5 fw-bold text-uppercase`}>
                                                        <i className={`bi bi-${isAdmin ? 'shield-lock-fill' : 'person-fill'} me-1`}></i>
                                                        {isAdmin ? 'Admin' : 'Customer'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-inline-block" style={{ width: '140px' }}>
                                                        <select
                                                            className={`form-select form-select-sm bg-dark border-secondary ${isAdmin ? 'text-danger fw-bold' : 'text-light'}`}
                                                            value={userRole}
                                                            onChange={(e) => handleRoleChange(user, e.target.value)}
                                                            disabled={isSelf || updatingUserId === user._id}
                                                            title={isSelf ? "You cannot modify your own administrative role." : "Change user access role"}
                                                        >
                                                            <option value="user">User (Customer)</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="d-md-none row g-3">
                            {filteredUsers.map((user) => {
                                const isSelf = String(user._id) === String(currentAdminId);
                                const userRole = user.role || 'user';
                                const isAdmin = userRole === 'admin';

                                return (
                                    <div key={user._id} className="col-12">
                                        <div className="card bg-dark border-secondary rounded-4 shadow-sm p-3">
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <h5 className="fw-bold text-white mb-0">
                                                    {user.name}
                                                    {isSelf && <span className="badge bg-warning text-dark ms-2 extra-small">You</span>}
                                                </h5>
                                                <span className={`badge ${isAdmin ? 'bg-danger' : 'bg-secondary'} px-2.5 py-1 text-uppercase fw-bold`}>
                                                    {isAdmin ? 'Admin' : 'Customer'}
                                                </span>
                                            </div>

                                            <div className="small text-warning font-monospace mb-1">{user.email}</div>
                                            <div className="small text-light mb-2">Phone: {user.phone_number || 'N/A'}</div>

                                            <div className="border-top border-secondary pt-2.5 mt-1 d-flex align-items-center justify-content-between">
                                                <span className="text-light small fw-medium">Access Role:</span>
                                                <select
                                                    className="form-select form-select-sm bg-dark text-white border-secondary"
                                                    style={{ width: '150px' }}
                                                    value={userRole}
                                                    onChange={(e) => handleRoleChange(user, e.target.value)}
                                                    disabled={isSelf || updatingUserId === user._id}
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
