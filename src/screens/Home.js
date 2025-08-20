import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Card from '../components/Card'
import Carousel from '../components/Carousel'


export default function Home() {
    let [foodCat, setFoodCat] = useState([]);
    let [foodItem, setFoodItem] = useState([]);

    const loadData = async () => {
        let foodItems = await fetch(`${process.env.REACT_APP_BASE_URL}/food/data`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            }
        })
        let foodCategories = await fetch(`${process.env.REACT_APP_BASE_URL}/food/categories`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            }
        })
        foodCategories = await foodCategories.json()
        foodItems = await foodItems.json()

        setFoodItem(foodItems.data);
        setFoodCat(foodCategories.data);
    }

    useEffect(() => {
        loadData();
    }, []);
    
    return (
        <div>
            <div><Navbar /></div>
            <div><Carousel /></div>
            <div className="container">
                {
                foodCat.length !== 0 ? (
                    foodCat.map((data) => (
                        <div key={data._id}>
                            <button className='fs-3 rounded bg-primary m-3'>{data.CategoryName}</button>
                            <hr />
                            <div className="row">
                                {foodItem.length !== 0
                                    ? foodItem.filter((item) => item.CategoryName === data.CategoryName)
                                        .map((filteredItem) => (
                                            <div className="col-md-4 col-sm-6 mb-3" key={filteredItem._id}>
                                                <Card   foodItem={filteredItem}
                                                        options={filteredItem.options[0]}
                                                />
                                            </div>
                                        ))
                                    : <p className="text-white">No items found.</p>}
                            </div>
                        </div>
                    ))
                ) : (
                    // <p className="text-white">Loading...</p>
                    <p className="text-white text-lg font-medium animate-pulse tracking-wide">
                        Loading<span className="animate-bounce inline-block">...</span>
                    </p>
                )}
            </div>

            <div><Footer /></div>
        </div>
    )
}
