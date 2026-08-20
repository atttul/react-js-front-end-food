import React, { useEffect, useState, useRef } from 'react';

export default function OrderTrackerModal({ order, onClose }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const riderMarkerRef = useRef(null);

    // Initial 30 mins countdown (1800 seconds)
    const [secondsLeft, setSecondsLeft] = useState(1800);
    const [progressPercent, setProgressPercent] = useState(0);

    // Default coordinates (e.g. Connaught Place, New Delhi area)
    const restaurantCoords = [28.6315, 77.2167]; // Restaurant
    const userCoords = [28.6139, 77.2090];       // Customer Location

    // Calculate current rider position along route based on progress percentage
    const getCurrentRiderCoords = (percent) => {
        const fraction = Math.min(Math.max(percent / 100, 0), 1);
        const lat = restaurantCoords[0] + (userCoords[0] - restaurantCoords[0]) * fraction;
        const lng = restaurantCoords[1] + (userCoords[1] - restaurantCoords[1]) * fraction;
        return [lat, lng];
    };

    // Countdown Timer logic (30 minutes = 1800s)
    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Update progress percentage (0% to 100% over 30 mins)
    useEffect(() => {
        const elapsed = 1800 - secondsLeft;
        const percent = Math.min(100, Math.floor((elapsed / 1800) * 100));
        setProgressPercent(percent);
    }, [secondsLeft]);

    // Initialize Leaflet Map
    useEffect(() => {
        if (!mapRef.current) return;
        const L = window.L;
        if (!L) return;

        if (!mapInstance.current) {
            // Create Leaflet Map instance
            const map = L.map(mapRef.current).setView(restaurantCoords, 14);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);

            // Restaurant Marker
            const restaurantIcon = L.divIcon({
                html: '<div style="background-color: #fd5631; color: white; padding: 6px 10px; border-radius: 20px; font-weight: bold; font-size: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);"><i class="bi bi-shop"></i> Kitchen</div>',
                className: 'custom-leaflet-icon',
                iconSize: [80, 30]
            });
            L.marker(restaurantCoords, { icon: restaurantIcon }).addTo(map)
                .bindPopup("<b>Mern Dine Kitchen</b><br/>Preparing your order.");

            // User Destination Marker
            const userIcon = L.divIcon({
                html: '<div style="background-color: #38bdf8; color: black; padding: 6px 10px; border-radius: 20px; font-weight: bold; font-size: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);"><i class="bi bi-house-door-fill"></i> Delivery Address</div>',
                className: 'custom-leaflet-icon',
                iconSize: [110, 30]
            });
            L.marker(userCoords, { icon: userIcon }).addTo(map)
                .bindPopup("<b>Your Delivery Address</b>");

            // Polyline route
            L.polyline([restaurantCoords, userCoords], {
                color: '#fd5631',
                weight: 4,
                dashArray: '8, 8',
                opacity: 0.7
            }).addTo(map);

            // Rider Marker
            const initialRiderCoords = getCurrentRiderCoords(progressPercent);
            const riderIcon = L.divIcon({
                html: '<div style="background-color: #f59e0b; color: black; padding: 6px 10px; border-radius: 20px; font-weight: bold; font-size: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);"><i class="bi bi-bicycle"></i> Rider (Live)</div>',
                className: 'custom-leaflet-icon',
                iconSize: [90, 30]
            });
            riderMarkerRef.current = L.marker(initialRiderCoords, { icon: riderIcon }).addTo(map)
                .bindPopup("<b>Rajesh Kumar (Delivery Partner)</b><br/>En route to your location.");

            mapInstance.current = map;
        }

        // Cleanup
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Move Rider Marker as progress updates
    useEffect(() => {
        if (riderMarkerRef.current) {
            const currentRiderCoords = getCurrentRiderCoords(progressPercent);
            riderMarkerRef.current.setLatLng(currentRiderCoords);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progressPercent]);

    // Format MM:SS
    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Determine current milestone status
    const getMilestoneStatus = () => {
        if (secondsLeft === 0) return { label: 'Delivered', icon: 'bi-check-circle-fill text-success' };
        if (progressPercent >= 40) return { label: 'Out for Delivery (Rider En Route)', icon: 'bi-bicycle text-warning' };
        if (progressPercent >= 10) return { label: 'Food Prepared & Packed', icon: 'bi-box-seam text-info' };
        return { label: 'Order Placed & Preparing in Kitchen', icon: 'bi-fire text-danger' };
    };

    const currentStatus = getMilestoneStatus();

    return (
        <div className="custom-modal-overlay">
            <div className="custom-modal-content p-4 text-white" style={{ maxWidth: '850px', width: '92%' }}>
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between border-bottom border-secondary pb-3 mb-3">
                    <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-geo-alt-fill text-warning fs-3"></i>
                        <div>
                            <h5 className="fw-bold mb-0">Live GPS Order Tracking</h5>
                            <small className="text-muted">Item: {order?.product_name || 'Food Order'} | Total ETA: 30 Mins</small>
                        </div>
                    </div>
                    <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                </div>

                {/* Countdown & ETA Banner */}
                <div className="bg-dark p-3 rounded-3 border border-secondary mb-4 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 shadow-sm">
                    <div>
                        <span className="text-muted small d-block">Estimated Arrival Time:</span>
                        <h4 className="fw-bold text-warning mb-0 d-flex align-items-center gap-2">
                            <i className="bi bi-clock-history"></i> {formatTime(secondsLeft)} Mins
                        </h4>
                    </div>

                    <div className="text-sm-end">
                        <span className="badge bg-dark border border-warning text-warning px-3 py-2 fs-6 rounded-pill">
                            <i className={`bi ${currentStatus.icon} me-1`}></i> {currentStatus.label}
                        </span>
                    </div>
                </div>

                {/* Milestones Stepper */}
                <div className="mb-4">
                    <div className="d-flex justify-content-between text-center small mb-2 text-muted fw-semibold">
                        <span className={progressPercent >= 0 ? "text-success" : ""}>1. Placed</span>
                        <span className={progressPercent >= 15 ? "text-success" : ""}>2. Preparing</span>
                        <span className={progressPercent >= 40 ? "text-warning" : ""}>3. On the Way</span>
                        <span className={progressPercent >= 100 ? "text-success" : ""}>4. Delivered</span>
                    </div>
                    <div className="progress bg-dark border border-secondary" style={{ height: '10px' }}>
                        <div 
                            className="progress-bar progress-bar-striped progress-bar-animated bg-warning" 
                            role="progressbar" 
                            style={{ width: `${Math.max(5, progressPercent)}%` }} 
                        />
                    </div>
                </div>

                {/* Leaflet GPS Map View */}
                <div 
                    ref={mapRef} 
                    className="rounded-3 border border-secondary mb-4 overflow-hidden" 
                    style={{ height: '280px', width: '100%', zIndex: 1 }} 
                />

                {/* Driver & Support Info */}
                <div className="row g-3">
                    <div className="col-12 col-md-7">
                        <div className="p-3 bg-dark rounded-3 border border-secondary d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3">
                                <div className="p-3 rounded-circle bg-secondary bg-opacity-25 text-warning border border-warning">
                                    <i className="bi bi-person-badge fs-3"></i>
                                </div>
                                <div>
                                    <h6 className="fw-bold text-white mb-0">Rajesh Kumar</h6>
                                    <small className="text-muted">Delivery Partner • TVS Apache (DL 01 AB 4321)</small>
                                </div>
                            </div>
                            <a href="tel:9876543210" className="btn btn-outline-success btn-sm px-3 fw-semibold">
                                <i className="bi bi-telephone-fill me-1"></i> Call Rider
                            </a>
                        </div>
                    </div>

                    <div className="col-12 col-md-5">
                        <div className="p-3 bg-dark rounded-3 border border-secondary h-100 d-flex flex-column justify-content-center">
                            <small className="text-muted d-block">Delivery Address:</small>
                            <span className="fw-semibold text-white small text-truncate">
                                <i className="bi bi-pin-map-fill text-danger me-1"></i> {order?.size ? `Option: ${order.size}` : 'Customer Address'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
