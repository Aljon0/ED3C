import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { notifyError, notifySuccess } from '../general/CustomToast.js';
import Navigation from '../components/Navigation.jsx';

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
      <Navigation />
      {/* Header Section - Modified for better mobile layout */}
      <div className="ml-0 md:ml-64">
        <div className="flex items-start sm:ml-64 px-4 md:px-8 pt-16 md:pt-24 mb-6">
          <div className="flex items-center w-full">
            <img
              src="/assets/tabler--arrow-left.svg"
              alt="Back"
              className="cursor-pointer w-8 h-8 md:w-10 md:h-10 mr-4"
              onClick={handleGoBack}
            />
            <div className="flex items-center ml-12">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src={user.imageUrl}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-xl md:text-2xl font-semibold ml-4">
                {user.firstName} {user.surname}
              </h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col px-4 md:px-8 mb-8 items-start sm:ml-64">
          <div className="bg-[#37474F] text-white w-full max-w-md p-4 md:p-8 rounded-lg shadow-lg">

            {/* Profile image upload section */}
            <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-6">
              <div className="w-full h-full rounded-full overflow-hidden">
                <img
                  src={user.imageUrl}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full cursor-pointer">
                <label className="cursor-pointer w-full h-full flex items-center justify-center">
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

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-base md:text-lg block mb-1 md:mb-2">First Name</label>
                <input
                  type="text"
                  value={user.firstName || ''}
                  className="w-full bg-[#78909C] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#90A4AE] text-sm md:text-base"
                  placeholder="First Name"
                  readOnly
                />
              </div>

              <div>
                <label className="text-base md:text-lg block mb-1 md:mb-2">Surname</label>
                <input
                  type="text"
                  value={user.surname || ''}
                  className="w-full bg-[#78909C] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#90A4AE] text-sm md:text-base"
                  placeholder="Surname"
                  readOnly
                />
              </div>

              <div>
                <label className="text-base md:text-lg block mb-1 md:mb-2">Email</label>
                <input
                  type="email"
                  value={user.email || ''}
                  className="w-full bg-[#78909C] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#90A4AE] text-sm md:text-base"
                  placeholder="Email"
                  readOnly
                />
              </div>

              <div>
                <label className="text-base md:text-lg block mb-1 md:mb-2">Contact #</label>
                <input
                  type="tel"
                  className="w-full bg-[#78909C] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#90A4AE] text-sm md:text-base"
                  placeholder="Contact Number"
                  value={user.contact || ''}
                  onChange={(e) => setUser({ ...user, contact: e.target.value })}
                />
              </div>

              <div>
                <label className="text-base md:text-lg block mb-1 md:mb-2">Address</label>
                <input
                  type="text"
                  className="w-full bg-[#78909C] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#90A4AE] text-sm md:text-base"
                  placeholder="Address"
                  value={user.address || ''}
                  onChange={(e) => setUser({ ...user, address: e.target.value })}
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end mt-6">
              <button
                className="bg-[#F4511E] text-white px-4 py-2 rounded-md hover:bg-[#FF7043] focus:outline-none focus:ring-2 focus:ring-[#FF7043] text-sm md:text-base transition-colors duration-200"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;