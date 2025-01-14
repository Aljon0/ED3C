import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import UserHeader from '../components/UserHeader.jsx';
import { notifyError, notifySuccess } from '../general/CustomToast.js';

function UserProfile() {
  const [user, setUser] = useState({
    firstName: '',
    surname: '',
    imageUrl: '/assets/mingcute--user-4-line.svg',
    email: '',
    contact: '',
    address: '',
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [userID, setUserID] = useState(null);
  const navigate = useNavigate();

  // Combined auth and data fetching in one useEffect
  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // User is signed in
        setUserID(authUser.uid);
        
        try {
          // Fetch user data from Firestore using the authenticated user's ID
          const userDoc = await getDoc(doc(db, 'Users', authUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              firstName: userData.firstName || '',
              surname: userData.surname || '',
              imageUrl: userData.imageUrl || '/assets/mingcute--user-4-line.svg',
              email: userData.email || '',
              contact: userData.contact || '',
              address: userData.address || '',
            });
          } else {
            notifyError("No user document found!");
            navigate('/login');
          }
        } catch (error) {
          notifyError("Error fetching user data: ", error);
          navigate('/login');
        }
      } else {
        // No user is signed in
        setUserID(null);
        navigate('/login');
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [navigate]);

  // Handle image file input change
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
      const reader = new FileReader();
      reader.onload = (event) => {
        setUser((prevUser) => ({
          ...prevUser,
          imageUrl: event.target.result,
        }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Upload image to Firebase Storage
  const uploadImageToStorage = async (imageFile) => {
    const storage = getStorage();
    const storageRef = ref(storage, `users/${userID}/profile.jpg`);
    
    await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(storageRef);
    return imageUrl;
  };

  // Handle Save button click
  const handleSave = async () => {
    if (!userID) {
      notifyError("No user ID found");
      return;
    }

    try {
      const updatedData = {
        firstName: user.firstName,
        surname: user.surname,
        email: user.email,
        contact: user.contact,
        address: user.address,
      };

      // If there's a new image, upload it
      if (imageFile) {
        const imageUrl = await uploadImageToStorage(imageFile);
        updatedData.imageUrl = imageUrl;
      }

      // Update Firestore
      await updateDoc(doc(db, 'Users', userID), updatedData);
      notifySuccess('Profile updated successfully!');
    } catch (error) {
      notifyError("Error updating profile: ", error);
      notifyError('Failed to update profile. Please try again.');
    }
  };

  // Function to navigate back
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <>
      <UserHeader/>
      <div className="flex items-center px-4 pt-24 mb-6">
        <img 
          src="/assets/tabler--arrow-left.svg" 
          alt="Back" 
          className="cursor-pointer mr-4 w-20" 
          onClick={handleGoBack}  // Go back to the previous page
        />
        <div className="flex items-center cursor-pointer">
          <img 
            src={user.imageUrl} 
            alt="User Image" 
            className="mr-2 w-20 ml-96 rounded-full" 
          />
          <h1 className="text-2xl font-semibold">
            {user.firstName} {user.surname}
          </h1>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center">
        <div className="bg-[#37474F] text-white w-full max-w-md p-8 rounded-lg shadow-lg">
          
          {/* Upload Image */}
          <div className="relative w-20 h-20">
            <img 
              src={user.imageUrl} 
              alt="User Image" 
              className="w-full h-full rounded-full object-cover" 
            />
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full"
            >
              <label className="cursor-pointer">
                <span className="text-white text-xs">Edit</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange} 
                />
              </label>
            </div>
          </div>

          {/* First Name */}
          <div className="mb-4">
            <label className="text-lg block mb-2">First Name</label>
            <input
              type="text"
              value={user.firstName || ''}  // Ensure value is always a string
              className="w-full bg-[#78909C] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#90A4AE]"
              placeholder="First Name"
              readOnly
            />
          </div>

          {/* Surname */}
          <div className="mb-4">
            <label className="text-lg block mb-2">Surname</label>
            <input
              type="text"
              value={user.surname || ''}  // Ensure value is always a string
              className="w-full bg-[#78909C] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#90A4AE]"
              placeholder="Surname"
              readOnly
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="text-lg block mb-2">Email</label>
            <input
              type="email"
              value={user.email || ''}  // Ensure value is always a string
              className="w-full bg-[#78909C] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#90A4AE]"
              placeholder="Email"
              readOnly
            />
          </div>

          {/* Contact */}
          <div className="mb-4">
            <label className="text-lg block mb-2">Contact #</label>
            <input
              type="tel"
              className="w-full bg-[#78909C] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#90A4AE]"
              placeholder="Contact Number"
              value={user.contact || ''}  // Ensure value is always a string
              onChange={(e) => setUser({ ...user, contact: e.target.value })}
            />
          </div>

          {/* Address */}
          <div className="mb-6">
            <label className="text-lg block mb-2">Address</label>
            <input
              type="text"
              className="w-full bg-[#78909C] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#90A4AE]"
              placeholder="Address"
              value={user.address || ''}  // Ensure value is always a string
              onChange={(e) => setUser({ ...user, address: e.target.value })}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              className="bg-[#F4511E] text-white px-4 py-2 rounded-md hover:bg-[#FF7043] focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default UserProfile;
