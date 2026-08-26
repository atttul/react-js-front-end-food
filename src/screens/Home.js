import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Card from '../components/Card'
import Carousel from '../components/Carousel'

export default function Home() {
    let [foodCat, setFoodCat] = useState([]);
    let [foodItem, setFoodItem] = useState([]);
    let [search, setSearch] = useState('');

    const loadData = async () => {
        const baseUrl = process.env.REACT_APP_BASE_URL || 'https://node-js-back-end-food.vercel.app/api';
        const cleanBase = baseUrl.replace(/\/$/, '');

        try {
            const res = await fetch(`${cleanBase}/food/home-data`);
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    setFoodItem(json.data.foodItems || []);
                    setFoodCat(json.data.foodCategories || []);
                    return;
                }
            }
        } catch (e) {
            console.warn("Single endpoint fetch attempt fallback:", e);
        }

        try {
            const [itemsRes, catRes] = await Promise.all([
                fetch(`${cleanBase}/food/data`),
                fetch(`${cleanBase}/food/categories`)
            ]);
            const itemsJson = await itemsRes.json();
            const catJson = await catRes.json();
            setFoodItem(itemsJson.data || []);
            setFoodCat(catJson.data || []);
        } catch (err) {
            console.error("Error loading home data:", err);
        }
    }

    useEffect(() => {
        loadData();
    }, []);
    
    return (
        <div className="d-flex flex-column min-vh-100 position-relative">
            <Navbar />
            <Carousel />
            
            {/* Search & Feature Highlights Bar */}
            <div className="container my-3">
                <div className="search-container p-3 mb-4">
                    <div className="row g-3 align-items-center">
                        <div className="col-12 col-md-6">
                            <div className="input-group">
                                <span className="input-group-text bg-transparent border-0 text-warning fs-5">
                                    <i className="bi bi-search"></i>
                                </span>
                                <input 
                                    type="search" 
                                    className="form-control search-input fs-6" 
                                    placeholder="Search your favorite food (e.g., Paneer, Pizza, Burger)..." 
                                    value={search} 
                                    onChange={(e) => setSearch(e.target.value)} 
                                />
                            </div>
                        </div>
                        <div className="col-12 col-md-6 d-flex flex-wrap justify-content-md-end gap-2">
                            <span className="feature-badge">
                                <i className="bi bi-lightning-charge-fill text-warning me-1"></i> Fast Delivery
                            </span>
                            <span className="feature-badge">
                                <i className="bi bi-[#fd5631] bi-fire me-1 text-danger"></i> Fresh Cooked
                            </span>
                            <span className="feature-badge">
                                <i className="bi bi-shield-check text-info me-1"></i> 100% Hygienic
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mb-5 flex-grow-1">
                {
                foodCat.length !== 0 ? (
                    foodCat.map((data) => {
                        const filteredItems = foodItem.filter((item) => 
                            (item.CategoryName === data.CategoryName) && 
                            (item.name.toLowerCase().includes(search.toLowerCase()))
                        );

                        if (search && filteredItems.length === 0) return null;

                        return (
                            <div key={data._id} className="mb-5">
                                <div className="d-flex align-items-center mb-3">
                                    <span className="category-badge fs-4 me-3">
                                        <i className="bi bi-tag-fill me-2"></i>{data.CategoryName}
                                    </span>
                                    <div className="flex-grow-1 border-bottom border-secondary opacity-25"></div>
                                </div>
                                <div className="row g-4">
                                    {filteredItems.length !== 0
                                        ? filteredItems.map((filteredItem) => (
                                                <div className="col-12 col-sm-6 col-lg-4 col-xl-3 d-flex align-items-stretch" key={filteredItem._id}>
                                                    <Card 
                                                        foodItem={filteredItem}
                                                        options={filteredItem.options[0]}
                                                    />
                                                </div>
                                            ))
                                        : <p className="text-muted fs-6 italic">No items found in this category.</p>}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center my-5 py-5">
                        <div className="spinner-border text-warning mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted fw-semibold">Fetching delicious food items...</p>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    )
}


