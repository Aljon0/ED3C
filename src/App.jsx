import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { auth } from './firebase'; // Add this import
import Header from './components/Header.jsx';
import Home from './landingpages/Home.jsx';
import Features from './landingpages/Features.jsx';
import Sample from './landingpages/Sample.jsx';
import Contact from './landingpages/Contact.jsx';
import Login from './landingpages/Login.jsx';
import Register from './landingpages/Register.jsx';
import Catalog from './userpages/Catalog.jsx';
import Canvas from './userpages/Canvas.jsx';
import Create from './userpages/Create.jsx';
import Message from './userpages/Message.jsx';
import Orders from './userpages/Orders.jsx';
import Payment from './userpages/Payment.jsx';
import UserElements from './userpages/UserElements.jsx';
import UserProfile from './userpages/UserProfile.jsx';
import Dashboard from './ownerpages/Dashboard.jsx';
import OwnerMessage from './ownerpages/OwnerMessage.jsx';
import OwnerOrders from './ownerpages/OwnerOrders.jsx';
import OwnerInventory from './ownerpages/OwnerInventory.jsx';
import OwnerUserAccount from './ownerpages/OwnerUserAccount.jsx';
import OwnerDesign from './ownerpages/OwnerDesign.jsx';
import OwnerPaymentAccess from './ownerpages/OwnerPaymentAccess.jsx';
import CustomizeDesign from './ownerpages/CustomizeDesign.jsx';
import ElementsDesign from './ownerpages/ElementsDesign.jsx'
import Reports from './ownerpages/Reports.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AOS from 'aos';
import 'aos/dist/aos.css';

import { AuthProvider } from './components/AuthContext.jsx';

// Create a protected route component
const MessageRedirect = () => {
  const [loading, setLoading] = React.useState(true);
  const [userId, setUserId] = React.useState(null);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return null;
  
  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/messages/${userId}`} replace />;
};


function AppRoutes() {
  const location = useLocation();
  const landingPageRoutes = ['/', '/login', '/register'];
  const isLandingPage = landingPageRoutes.includes(location.pathname);

  return (
    <>
      <ToastContainer />
      {isLandingPage && <Header />}

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User routes */}
        <Route path="/messages" element={<MessageRedirect />} />
        <Route path="/messages/:userId" element={<Message />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/canvas" element={<Canvas />} />
        <Route path="/create" element={<Create />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/UserProfile" element={<UserProfile />} />
        <Route path="/UserElements" element={<UserElements />} />

        {/* Owner's routes */}
        <Route path="/owner/dashboard" element={<Dashboard />} />
        <Route path="/owner/messages/" element={<OwnerMessage />} />
        <Route path="/owner/messages/:userId" element={<OwnerMessage />} />
        <Route path="/owner/orders" element={<OwnerOrders />} />
        <Route path="/owner/inventory" element={<OwnerInventory />} />
        <Route path="/owner/UserAccount" element={<OwnerUserAccount />} />
        <Route path="/owner/design" element={<OwnerDesign />} />
        <Route path="/owner/PaymentAccess" element={<OwnerPaymentAccess />} />
        <Route path="/owner/CustomizeDesign" element={<CustomizeDesign/>} />
        <Route path="/owner/ElementsDesign" element={<ElementsDesign/>}/>
        <Route path="/owner/Reports" element={<Reports/>}/>

        {/* Default route for the landing page */}
        <Route
          path="/"
          element={
            <>
              <Home />
              <Features />
              <Sample />
              <Contact />
            </>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
    });
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;