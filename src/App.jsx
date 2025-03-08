import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import Header from './components/Header.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { AuthProvider } from './components/AuthContext.jsx';


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
import ElementsDesign from './ownerpages/ElementsDesign.jsx';
import Reports from './ownerpages/Reports.jsx';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const [loading, setLoading] = React.useState(true);
  const [authorized, setAuthorized] = React.useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        try {
          // Use localStorage instead of sessionStorage
          const userRole = localStorage.getItem('userRole');
          if (requiredRole && userRole !== requiredRole) {
            setAuthorized(false);
          } else {
            setAuthorized(true);
          }
        } catch (error) {
          console.error('Auth check error:', error);
          setAuthorized(false);
        }
        
        setLoading(false);
      });

      return () => unsubscribe();
    };

    checkAuth();
  }, [requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#CACACA] to-[#A8A8A8] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!authorized) {
    // Clear any stored data when unauthorized
    localStorage.removeItem('userRole');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Message Redirect Component
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

// App Routes Component
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

        {/* Protected Customer routes */}
        <Route
          path="/messages"
          element={<MessageRedirect />}
        />
        <Route
          path="/messages/:userId"
          element={
            <ProtectedRoute requiredRole="customer">
              <Message />
            </ProtectedRoute>
          }
        />
        <Route
          path="/catalog"
          element={
            <ProtectedRoute requiredRole="customer">
              <Catalog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/canvas"
          element={
            <ProtectedRoute requiredRole="customer">
              <Canvas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute requiredRole="customer">
              <Create />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute requiredRole="customer">
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute requiredRole="customer">
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/UserProfile"
          element={
            <ProtectedRoute requiredRole="customer">
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/UserElements"
          element={
            <ProtectedRoute requiredRole="customer">
              <UserElements />
            </ProtectedRoute>
          }
        />

        {/* Protected Owner routes */}
        <Route
          path="/owner/dashboard"
          element={
            <ProtectedRoute requiredRole="owner">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/messages"
          element={
            <ProtectedRoute requiredRole="owner">
              <OwnerMessage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/messages/:userId"
          element={
            <ProtectedRoute requiredRole="owner">
              <OwnerMessage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/orders"
          element={
            <ProtectedRoute requiredRole="owner">
              <OwnerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/inventory"
          element={
            <ProtectedRoute requiredRole="owner">
              <OwnerInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/UserAccount"
          element={
            <ProtectedRoute requiredRole="owner">
              <OwnerUserAccount />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/design"
          element={
            <ProtectedRoute requiredRole="owner">
              <OwnerDesign />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/PaymentAccess"
          element={
            <ProtectedRoute requiredRole="owner">
              <OwnerPaymentAccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/CustomizeDesign"
          element={
            <ProtectedRoute requiredRole="owner">
              <CustomizeDesign />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/ElementsDesign"
          element={
            <ProtectedRoute requiredRole="owner">
              <ElementsDesign />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/Reports"
          element={
            <ProtectedRoute requiredRole="owner">
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Landing page route */}
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

        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
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