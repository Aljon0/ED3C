import React, { useContext, useState, useEffect, createContext } from 'react';
import { auth, db } from '../firebase'; // Assuming firebase.js exports both 'auth' and 'db'
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions

// Create a context
const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);  // Authenticated user info
  const [userData, setUserData] = useState(null);        // Firestore user info

  useEffect(() => {
    // Firebase listener to handle auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Fetch user data from Firestore
        const userDocRef = doc(db, "Users", user.uid);  // Reference to the user's document in Firestore
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          setUserData(userDocSnapshot.data());  // Save user data from Firestore
        } else {
          console.log("No such user document!");
        }
      } else {
        setUserData(null);  // Clear user data when logged out
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for accessing the AuthContext
export const useAuth = () => useContext(AuthContext);
