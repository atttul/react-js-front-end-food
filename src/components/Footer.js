import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top">
        <div className="col-md-4 d-flex align-items-center">
          <Link to="/" cLink ssName="mb-3 me-2 mb-md-0 text-muted text-decoration-none lh-1">
          </Link>
          <span className="mb-3 mb-md-0 text-muted">© 2022 GoFood, Inc</span>
        </div>

        <ul className="nav col-md-4 justify-content-end list-unstyled d-flex">
          <li className="ms-3"><Link className="text-muted" to="#"></Link></li>
          <li className="ms-3"><Link className="text-muted" to="#"></Link></li>
          <li className="ms-3"><Link className="text-muted" to="#"></Link></li>
        </ul>
      </div>
    </div>
  )
}
