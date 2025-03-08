import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import LogoutModal from './LogoutModal';
import UserNotifications from './UserNotifications';

const Navigation = ({children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState({
    firstName: '',
    surname: '',
    imageUrl: 'https://placekitten.com/80/80',
  });
  const [userID, setUserID] = useState(null);
  
  const navigate = useNavigate();
  const auth = getAuth();

  // Handle authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserID(user.uid);
        if (user.displayName) {
          const [firstName, ...surnameArray] = user.displayName.split(' ');
          const surname = surnameArray.join(' ');
          setUser({
            firstName,
            surname,
            imageUrl: user.photoURL || 'https://placekitten.com/80/80',
          });
        }
      } else {
        setUserID(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch user data from Firestore
  useEffect(() => {
    if (!userID) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'Users', userID));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            firstName: userData.firstName || '',
            surname: userData.surname || '',
            imageUrl: userData.imageUrl || 'https://placekitten.com/80/80',
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [userID]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigate("/login");
      })
      .catch((error) => {
        console.error("Error logging out: ", error);
      });
  };

  const navItems = [
    { to: "/catalog", icon: "/assets/grommet-icons--catalog.svg", label: "Catalog" },
    { to: "/canvas", icon: "/assets/simple-icons--canvas.svg", label: "Canvas" },
    { to: "/create", icon: "/assets/ic--outline-design-services.svg", label: "Create a Design" },
    { to: "/messages", icon: "/assets/mi--message.svg", label: "Message" },
    { to: "/orders", icon: "/assets/mdi--cart-outline.svg", label: "Orders" },
    { to: "/payment", icon: "/assets/ic--outline-payments.svg", label: "Payment" }
  ];

  return (
    <div className="mt-16">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#2F424B] text-white z-[50] px-4 sm:px-[5%] border-b-[0.1rem] border-b-[rgba(0,0,0,0.2)] border-solid">
        <div className="h-8 flex items-center justify-between px-4 md:px-[5%]">
          <div className="flex items-center">
            <img src="/assets/logo2.png" className="w-8 h-8 md:w-10 md:h-10" alt="Logo" />
            <h1 className="text-xl md:text-3xl font-bold italic ml-2 md:ml-4 truncate">
              DOUBLE SEVEN
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <UserNotifications />
            <img
              src="/assets/line-md--log-out.svg"
              className="w-6 h-6 md:w-8 md:h-8 cursor-pointer"
              alt="Logout"
              onClick={() => setIsModalOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Main layout wrapper */}
      <div className="pt-8"> {/* Padding for fixed header */}
        {/* Desktop Sidebar */}
        <aside className="hidden md:block fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-[#2F424B] text-white z-10 overflow-y-auto">
          <div className="flex flex-col items-center py-6">
            <NavLink to="/UserProfile">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                <img 
                  src={user.imageUrl} 
                  alt="User" 
                  className="w-full h-full object-cover"
                />
              </div>
            </NavLink>
            <h2 className="text-lg font-semibold text-white mt-3">
              {user.firstName} {user.surname}
            </h2>
          </div>
          
          <nav className="flex flex-col space-y-2 px-4">
            {navItems.map((item) => (
              <NavLink 
                key={item.to}
                to={item.to} 
                className={({ isActive }) => 
                  `group flex items-center text-base font-medium p-2 rounded-md ${
                    isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'
                  }`
                }
              >
                <img src={item.icon} className="w-5 h-5 mr-2 group-hover:fill-current group-hover:text-white" alt={item.label} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden fixed top-16 left-0 right-0 bg-[#2F424B] z-40 border-b border-gray-600 ">
          {/* Mobile User Profile */}
          <div className="flex items-center justify-center p-4 border-b border-gray-600">
            <NavLink to="/UserProfile" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img 
                  src={user.imageUrl} 
                  alt="User" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white text-sm font-semibold">
                {user.firstName} {user.surname}
              </span>
            </NavLink>
          </div>
          
          {/* Mobile Navigation */}
          <div className="overflow-x-auto">
            <nav className="flex whitespace-nowrap p-2">
              {navItems.map((item) => (
                <NavLink 
                  key={item.to}
                  to={item.to} 
                  className={({ isActive }) => 
                    `flex flex-col items-center px-4 py-2 ${
                      isActive ? 'text-white' : 'text-gray-200'
                    }`
                  }
                >
                  <img src={item.icon} className="w-5 h-5 mb-1" alt={item.label} />
                  <span className="text-xs">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content wrapper */}
        <div className="md:ml-64 pt-[88px] md:pt-0">
          {children}
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          setIsModalOpen(false);
          handleLogout();
        }}
      />
    </div>
  );
};


export default Navigation;