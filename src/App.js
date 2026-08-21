import './App.css';
import Home from './screens/Home.js';
import {
    BrowserRouter as Router,
    Routes,
    Route
} from 'react-router-dom';
import Login from './screens/Login.js';
import '../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
import Signup from './screens/Signup.js';
import { CartProvider } from './components/ContextReducer.js';
import MyOrders from './screens/MyOrders.js';
import CashfreePayment from './screens/CashfreePayment.js';
import PaymentSuccess from './screens/PaymentSuccess.js';
import OtpVerify from './screens/OtpVerify.js';
import ForgotPassword from './screens/ForgotPassword.js';

export default function App() {
    return (
        <CartProvider>
            <Router>
                <Routes>
                    <Route exact path='/' element={<Home />} />
                    <Route exact path='/login' element={<Login />} />
                    <Route exact path='/signup' element={<Signup />} />
                    <Route exact path='/forgot-password' element={<ForgotPassword />} />
                    <Route exact path='/myorders' element={<MyOrders />} />
                    <Route exact path="/cashfree-payment" element={<CashfreePayment />} />
                    <Route exact path="/payment-success" element={<PaymentSuccess />} />
                    <Route exact path="/otp-verify" element={<OtpVerify />} />
                </Routes>
            </Router>
        </CartProvider>
    );
}

// this is 1st CICD  pipeline run
