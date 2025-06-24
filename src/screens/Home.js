import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Card from '../components/Card'
import Carousel from '../components/Carousel'


export default function Home() {
    let [foodCat, setFoodCat] = useState([]);
    let [foodItem, setFoodItem] = useState([]);

    const loadData = async () => {
        let foodItems = await fetch('http://localhost:5000/api/food/data', {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            }
        })
        let foodCategories = await fetch('http://localhost:5000/api/food/categories', {
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
            <div ><Carousel /></div>
            <div className="container">
                {
                foodCat.length !== 0 ? (
                    foodCat.map((data) => (
                        <div key={data._id}>
                            <h5 >{data.CategoryName}</h5>
                            <hr />
                            <div className="row">
                                {foodItem.length !== 0
                                    ? foodItem
                                        .filter((item) => item.CategoryName === data.CategoryName)
                                        .map((filteredItem) => (
                                            <div className="col-md-4 col-sm-6 mb-3" key={filteredItem._id}>
                                                <Card
                                                    foodItem={filteredItem}
                                                    options={filteredItem.options[0]}

                                                />
                                            </div>
                                        ))
                                    : <p className="text-white">No items found.</p>}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-white">No categories found.</p>
                )}
            </div>

            <div><Footer /></div>
        </div>
    )
}
