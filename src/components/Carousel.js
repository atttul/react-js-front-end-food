import React from 'react'

export default function Carousel() {
    return (
        <div className="container mt-4 mb-4">
            <div id="carouselExampleFade" className="carousel slide carousel-fade shadow-lg rounded-4 overflow-hidden" data-bs-ride="carousel">
                <div className="carousel-inner position-relative">
                    {/* Dark gradient overlay for text legibility */}
                    <div 
                        className="position-absolute w-100 h-100" 
                        style={{ 
                            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.2) 60%)', 
                            zIndex: 2, 
                            pointerEvents: 'none' 
                        }} 
                    />
                    
                    <div className="carousel-item active">
                        <img src="https://img.magnific.com/free-psd/food-menu-restaurant-facebook-cover-banner-template_120329-4875.jpg?semt=ais_test_b&w=740&q=80"
                            alt="food banner 1"
                            className="w-100"
                            style={{ height: "clamp(150px, 24vw, 240px)", objectFit: "cover" }} />
                    </div>
                    <div className="carousel-item">
                        <img src="https://img.magnific.com/free-psd/food-menu-restaurant-facebook-cover-template_106176-2214.jpg?semt=ais_test_b&w=740&q=80"
                            alt="food banner 2"
                            className="w-100"
                            style={{ height: "clamp(150px, 24vw, 240px)", objectFit: "cover" }} />
                    </div>
                    <div className="carousel-item">
                        <img src="https://img.magnific.com/free-psd/food-menu-restaurant-web-banner-template_106176-1459.jpg"
                            alt="food banner 3"
                            className="w-100"
                            style={{ height: "clamp(150px, 24vw, 240px)", objectFit: "cover" }} />
                    </div>
                    <div className="carousel-item">
                        <img src="https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRbiMKSwByrvSYOlSjrCyDiiRfMGpaWwVfmKiH1kFCJg0SARXQq"
                            alt="food banner 4"
                            className="w-100"
                            style={{ height: "clamp(150px, 24vw, 240px)", objectFit: "cover" }} />
                    </div>
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleFade" data-bs-slide="prev" style={{ zIndex: 3 }}>
                    <span className="carousel-control-prev-icon p-3 bg-dark bg-opacity-50 rounded-circle" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleFade" data-bs-slide="next" style={{ zIndex: 3 }}>
                    <span className="carousel-control-next-icon p-3 bg-dark bg-opacity-50 rounded-circle" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                </button>
            </div>
        </div>
    )
}

