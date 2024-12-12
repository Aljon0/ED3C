import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

function UserSideBar() {
    const [user, setUser] = useState({
        firstName: '',
        surname: '',
        imageUrl: 'https://via.placeholder.com/80',
    });

    const [userID, setUserID] = useState(null);

    // Use onAuthStateChanged to handle auth state
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserID(user.uid);

                if (user.displayName) {
                    const [firstName, ...surnameArray] = user.displayName.split(' ');
                    const surname = surnameArray.join(' ');
                    setUser({
                        firstName,
                        surname,
                        imageUrl: user.photoURL || 'https://via.placeholder.com/80',
                    });
                }
            } else {
                setUserID(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // Fetch user data from Firestore for registered users
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
                imageUrl: userData.imageUrl || 'https://via.placeholder.com/80', // Get the saved image URL
              });
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        };
      
        fetchUserData();
      }, [userID]);

    return (
        <div className="flex">
            <aside className="fixed top-0 left-0 w-64 h-full bg-[#37474F] text-white pt-24">
                <div className="flex flex-col items-center mb-10">
                    {/* Link user image to the UserProfile page */}
                    <NavLink to="/UserProfile">
                        <img 
                            src={user.imageUrl} 
                            alt="User Image" 
                            className="rounded-full w-20 h-20 mb-4 cursor-pointer" 
                        />
                    </NavLink>
                    {/* Display user's First Name and Surname */}
                    <h2 className="text-xl font-semibold text-white leading-3">
                        {user.firstName} {user.surname}
                    </h2>
                </div>
                <nav className="flex flex-col space-y-4 px-4">
                <NavLink 
                            to="/catalog" 
                            className={({ isActive }) => `group flex items-center text-base font-medium p-2 rounded-md ${isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'}`}
                        >
                            <img src="/assets/grommet-icons--catalog.svg" className="w-6 h-6 mr-2 group-hover:fill-current group-hover:text-white"/>Catalog
                        </NavLink>
                        <NavLink 
                            to="/canvas" 
                            className={({ isActive }) => `group flex items-center text-base font-medium p-2 rounded-md ${isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'}`}
                        >
                            <img src="/assets/simple-icons--canvas.svg" className="w-6 h-6 mr-2 group-hover:fill-current group-hover:text-white"/>Canvas
                        </NavLink>
                        <NavLink 
                            to="/create" 
                            className={({ isActive }) => `group flex items-center text-base font-medium p-2 rounded-md ${isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'}`}
                        >
                            <img src="/assets/ic--outline-design-services.svg" className="w-6 h-6 mr-2 group-hover:fill-current group-hover:text-white"/>Create a Design
                        </NavLink>
                        <NavLink 
                            to="/messages" 
                            className={({ isActive }) => `group flex items-center text-base font-medium p-2 rounded-md ${isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'}`}
                        >
                            <img src="/assets/mi--message.svg" className="w-6 h-6 mr-2 group-hover:fill-current group-hover:text-white"/>Message
                        </NavLink>
                        <NavLink 
                            to="/orders" 
                            className={({ isActive }) => `group flex items-center text-base font-medium p-2 rounded-md ${isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'}`}
                        >
                            <img src="/assets/mdi--cart-outline.svg" className="w-6 h-6 mr-2 group-hover:fill-current group-hover:text-white"/>Orders
                        </NavLink>
                        <NavLink 
                            to="/payment" 
                            className={({ isActive }) => `group flex items-center text-base font-medium p-2 rounded-md ${isActive ? 'bg-[#576c75] text-white' : 'text-gray-200 hover:bg-[#576c75] hover:text-white'}`}
                        >
                            <img src="/assets/ic--outline-payments.svg" className="w-6 h-6 mr-2 group-hover:fill-current group-hover:text-white"/>Payment
                        </NavLink>
                    </nav>
                </aside>
            </div>
    );
}

export default UserSideBar;
