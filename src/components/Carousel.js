import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Carousel() {
    return (
        <div>
            <div id="carouselExampleFade" className=" m-3 carousel slide carousel-fade" >
                <div className="carousel-inner">
                    <div className="carousel-item active">
                        <img src="https://imgs.search.brave.com/IHH2Fr239MYiqFdo73NgjxOtM_X4lB4tupaRRQ7kQGY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/cHJlbWl1bS1wc2Qv/aG90ZWwtZm9vZC1i/YW5uZXItZGVzaWdu/LXRlbXBsYXRlXzk4/NzcwMS0xNzE3Lmpw/Zz9zZW10PWFpc19o/eWJyaWQmdz03NDA"
                            alt="food"
                            className="w-100"
                            style={{ height: "400px", objectFit: "cover", borderRadius: "8px" }} />
                    </div>
                    <div className="carousel-item">
                        <img src="https://os-data-2.xargo-cdn.net/tnqdev/images/food-aerial-ottos-fresh-food-market-custom.jpg"
                            alt="food"
                            className="w-100"
                            style={{ height: "400px", objectFit: "cover", borderRadius: "8px" }} />
                    </div>
                    <div className="carousel-item">
                        <img src="https://imgs.search.brave.com/KXecyDrI1GoxpCRjgulgxCVCJPfPypLyLprqtXfYzT8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/ZnJlZS1wc2QvZm9v/ZC1tZW51LXJlc3Rh/dXJhbnQtd2ViLWJh/bm5lci10ZW1wbGF0/ZV8xMDYxNzYtODI1/LmpwZz9zZW10PWFp/c19oeWJyaWQmdz03/NDA"
                            alt="food"
                            className="w-100"
                            style={{ height: "400px", objectFit: "cover", borderRadius: "8px" }} />
                    </div>
                    <div className="carousel-item">
                        <img src="https://imgs.search.brave.com/J6SVtt5_KQfyaGBiV1Ckqen9h23HFGMJad2VRdRQvgk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzA1LzY5/LzBiLzA1NjkwYjkz/MTgyMmVlZGQ4ZjY3/NDE4ZGFkMWU2Y2E2/LmpwZw"
                            alt="food"
                            className="w-100"
                            style={{ height: "400px", objectFit: "cover", borderRadius: "8px" }} />
                    </div>
                    <div className="carousel-item">
                        <img src="https://imgs.search.brave.com/3o-hofvSAT7CHXcA9bwCTXNbMduXXUpSFsTNO6Cce-8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/ZnJlZS1wc2QvcmVh/bGlzdGljLWZvb2Qt/ZmVzdGl2YWwtaW5z/dGFncmFtLXBvc3Rz/XzIzLTIxNDk3NTM3/NzguanBnP3NlbXQ9/YWlzX2h5YnJpZCZ3/PTc0MA"
                            alt="food"
                            className="w-100"
                            style={{ height: "400px", objectFit: "cover", borderRadius: "8px" }} />
                    </div>
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleFade" data-bs-slide="prev">
                    <span className="carousel-control-prev-icon"></span>
                    <span className="">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleFade" data-bs-slide="next">
                    <span className="">Next</span>
                    <span className="carousel-control-next-icon"></span>
                </button>
            </div>
        </div>
    )
}
