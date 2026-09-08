import React, { useEffect, useState, useRef } from 'react';

export default function OrderTrackerModal({ order, onClose }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const riderMarkerRef = useRef(null);

    const [secondsLeft, setSecondsLeft] = useState(1800);
    const [progressPercent, setProgressPercent] = useState(0);
    const [backendStatus, setBackendStatus] = useState(order?.order_status || 'PENDING');
    const [isPendingAcceptance, setIsPendingAcceptance] = useState(
        !order?.order_status || order.order_status === 'PENDING' || order.order_status === 'PLACED'
    );
    const [autoAcceptRemainingSeconds, setAutoAcceptRemainingSeconds] = useState(180);

    const restaurantCoords = [28.6315, 77.2167]; // Kitchen
    const userCoords = [28.6139, 77.2090];       // Customer Location

    // 1. Fetch live backend tracking
    const fetchLiveTracking = async () => {
        if (!order?._id) return;
        try {
            const baseUrl = (process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api').replace(/\/$/, '');
            const res = await fetch(`${baseUrl}/order/track/${order._id}`);
            const data = await res.json();
            if (data.success && data.data) {
                const info = data.data;
                setBackendStatus(info.status || 'PENDING');
                setIsPendingAcceptance(!!info.is_pending_acceptance);

                if (typeof info.remaining_seconds === 'number') {
                    setSecondsLeft(info.remaining_seconds);
                }
                if (typeof info.progress_percentage === 'number') {
                    setProgressPercent(info.progress_percentage);
                }
                if (typeof info.auto_accept_remaining_seconds === 'number') {
                    setAutoAcceptRemainingSeconds(info.auto_accept_remaining_seconds);
                }
            }
        } catch (err) {
            console.warn("Live tracking API warning:", err);
        }
    };

    // Poll live tracking API every 3 seconds
    useEffect(() => {
        fetchLiveTracking();
        const pollInterval = setInterval(fetchLiveTracking, 3000);
        return () => clearInterval(pollInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order]);

    // 2. Local 1-second countdown tick
    useEffect(() => {
        const timer = setInterval(() => {
            if (isPendingAcceptance || backendStatus === 'PENDING' || backendStatus === 'PLACED') {
                setAutoAcceptRemainingSeconds(prev => (prev > 0 ? prev - 1 : 0));
                setSecondsLeft(1800);
                setProgressPercent(0);
            } else if (['ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(backendStatus)) {
                setSecondsLeft(prev => (prev > 1 ? prev - 1 : 0));
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [backendStatus, isPendingAcceptance]);

    // Calculate rider position along route
    const getCurrentRiderCoords = (percent) => {
        const fraction = Math.min(Math.max(percent / 100, 0), 1);
        const lat = restaurantCoords[0] + (userCoords[0] - restaurantCoords[0]) * fraction;
        const lng = restaurantCoords[1] + (userCoords[1] - restaurantCoords[1]) * fraction;
        return [lat, lng];
    };

    // Leaflet Map Initialization
    useEffect(() => {
        if (!mapRef.current) return;
        const L = window.L;
        if (!L) return;

        if (!mapInstance.current) {
            const map = L.map(mapRef.current).setView(restaurantCoords, 14);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            // Restaurant Marker
            const restaurantIcon = L.divIcon({
                html: '<div style="background-color: #fd5631; color: white; padding: 6px 10px; border-radius: 20px; font-weight: bold; font-size: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);"><i class="bi bi-shop"></i> Kitchen</div>',
                className: 'custom-leaflet-icon',
                iconSize: [80, 30]
            });
            L.marker(restaurantCoords, { icon: restaurantIcon }).addTo(map)
                .bindPopup("<b>Mern Dine Central Kitchen</b><br/>Preparing your order.");

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

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update rider marker on progress changes
    useEffect(() => {
        if (riderMarkerRef.current) {
            const coords = getCurrentRiderCoords(progressPercent);
            riderMarkerRef.current.setLatLng(coords);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progressPercent]);

    // Format seconds into MM:SS
    const formatTime = (totalSeconds) => {
        const mins = Math.floor(Math.max(0, totalSeconds) / 60);
        const secs = Math.floor(Math.max(0, totalSeconds)) % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Status Banner Info Helper
    const getStatusDetails = () => {
        const st = (backendStatus || '').toUpperCase();
        if (st === 'REJECTED') {
            return {
                title: 'Order Rejected',
                badgeText: 'Rejected by Restaurant',
                badgeClass: 'border-danger text-danger bg-danger bg-opacity-10',
                icon: 'bi-x-circle-fill text-danger',
                note: 'The restaurant was unable to accept your order.'
            };
        }
        if (st === 'DELIVERED' || (secondsLeft === 0 && !isPendingAcceptance)) {
            return {
                title: 'Order Delivered!',
                badgeText: 'Delivered',
                badgeClass: 'border-success text-success bg-success bg-opacity-10',
                icon: 'bi-check-circle-fill text-success',
                note: 'Food delivered! Enjoy your delicious meal.'
            };
        }
        if (isPendingAcceptance || st === 'PENDING' || st === 'PLACED') {
            return {
                title: 'Awaiting Restaurant Acceptance',
                badgeText: `Auto-accepts in ${formatTime(autoAcceptRemainingSeconds)} Mins`,
                badgeClass: 'border-warning text-warning bg-warning bg-opacity-10 animate-pulse',
                icon: 'bi-hourglass-split text-warning',
                note: '30-minute delivery clock starts automatically as soon as restaurant accepts your order!'
            };
        }
        if (st === 'OUT_FOR_DELIVERY' || progressPercent >= 40) {
            return {
                title: 'Rider Out for Delivery',
                badgeText: 'Out for Delivery',
                badgeClass: 'border-warning text-warning bg-warning bg-opacity-10',
                icon: 'bi-bicycle text-warning',
                note: 'Rider is en route to your delivery location!'
            };
        }
        return {
            title: 'Order Accepted & Preparing',
            badgeText: 'Accepted by Kitchen',
            badgeClass: 'border-success text-success bg-success bg-opacity-10',
            icon: 'bi-fire text-danger',
            note: 'Order accepted! Chef is preparing your meal.'
        };
    };

    const statusDetails = getStatusDetails();

    return (
        <div className="custom-modal-overlay">
            <div className="custom-modal-content p-4 text-white shadow-lg" style={{ maxWidth: '850px', width: '92%' }}>
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

                {/* Countdown & Status Banner */}
                <div className="bg-dark p-3 rounded-3 border border-secondary mb-3 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 shadow-sm">
                    <div>
                        <span className="text-muted extra-small d-block">
                            {isPendingAcceptance ? 'Delivery Timer (On Hold):' : 'Estimated Arrival Time:'}
                        </span>
                        <h4 className="fw-bold text-warning mb-0 d-flex align-items-center gap-2">
                            <i className="bi bi-clock-history"></i> {formatTime(secondsLeft)} Mins
                        </h4>
                    </div>

                    <div className="text-sm-end">
                        <span className={`badge border px-3 py-2 fs-6 rounded-pill d-inline-flex align-items-center gap-1.5 ${statusDetails.badgeClass}`}>
                            <i className={`bi ${statusDetails.icon}`}></i> {statusDetails.badgeText}
                        </span>
                    </div>
                </div>

                {/* Auto-Acceptance & Status Note Banner */}
                <div className="p-2.5 rounded-3 border border-warning border-opacity-30 bg-warning bg-opacity-10 mb-3 small d-flex align-items-center gap-2">
                    <i className="bi bi-info-circle-fill text-warning fs-6 flex-shrink-0"></i>
                    <span className="text-white-50 extra-small">{statusDetails.note}</span>
                </div>

                {/* Milestones Stepper */}
                <div className="mb-4">
                    <div className="d-flex justify-content-between text-center extra-small mb-2 text-muted fw-semibold">
                        <span className={isPendingAcceptance || backendStatus ? "text-success fw-bold" : ""}>1. Placed</span>
                        <span className={!isPendingAcceptance && ['ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(backendStatus) ? "text-success fw-bold" : (isPendingAcceptance ? "text-warning" : "")}>
                            2. Accepted {isPendingAcceptance && `(${formatTime(autoAcceptRemainingSeconds)})`}
                        </span>
                        <span className={['OUT_FOR_DELIVERY', 'DELIVERED'].includes(backendStatus) || progressPercent >= 40 ? "text-warning fw-bold" : ""}>
                            3. On the Way
                        </span>
                        <span className={backendStatus === 'DELIVERED' || (secondsLeft === 0 && !isPendingAcceptance) ? "text-success fw-bold" : ""}>
                            4. Delivered
                        </span>
                    </div>
                    <div className="progress bg-dark border border-secondary" style={{ height: '10px' }}>
                        <div 
                            className="progress-bar progress-bar-striped progress-bar-animated bg-warning" 
                            role="progressbar" 
                            style={{ width: `${isPendingAcceptance ? 15 : Math.max(15, progressPercent)}%` }} 
                        />
                    </div>
                </div>

                {/* Leaflet GPS Map View */}
                <div 
                    ref={mapRef} 
                    className="rounded-3 border border-secondary mb-4 overflow-hidden shadow-sm" 
                    style={{ height: '260px', width: '100%', zIndex: 1 }} 
                />

                {/* Driver & Delivery Address Info */}
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
                            <small className="text-muted d-block">Delivery Target:</small>
                            <span className="fw-semibold text-white small text-truncate">
                                <i className="bi bi-pin-map-fill text-danger me-1"></i> {order?.product_name ? `${order.product_name} (${order.size || 'Standard'})` : 'Customer Address'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
