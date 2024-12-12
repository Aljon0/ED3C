import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs,
    addDoc,
    deleteDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import OwnerHeader from "../components/OwnerHeader";
import OwnerSideBar from "../components/OwnerSideBar";
import PreviewArea from "../components/PreviewArea";
import { db, storage, auth } from '../firebase';

function CustomizeDesign() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [isCategoryOverlayOpen, setIsCategoryOverlayOpen] = useState(false);
    const [imageContainers, setImageContainers] = useState([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);

    const categories = [
        'Border Designs',
        'Corner Designs',
        'Designs'
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowCategoryDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Check authentication and load images
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Fetch saved images
                await fetchSavedImages(currentUser.uid);
            } else {
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Fetch saved images from Firestore
    const fetchSavedImages = async (userId) => {
        try {
            const q = query(collection(db, 'userDesigns'), where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            
            const savedImages = await Promise.all(
                querySnapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data();
                    return {
                        id: docSnap.id,
                        ...data
                    };
                })
            );

            setImageContainers(savedImages);
        } catch (error) {
            console.error("Error fetching saved images:", error);
        }
    };

    const toggleOverlay = () => setIsOverlayOpen(!isOverlayOpen);

    const toggleCategoryOverlay = () => {
        setIsCategoryOverlayOpen(!isCategoryOverlayOpen);
    };

    const toggleCategoryDropdown = () => {
        setShowCategoryDropdown(!showCategoryDropdown);
    };

    const handleFilterCategory = (category) => {
        setFilterCategory(category);
        setShowCategoryDropdown(false);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setIsCategoryOverlayOpen(false);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const removeImage = async (imageId) => {
        try {
            // Remove from Firestore
            await deleteDoc(doc(db, 'userDesigns', imageId));
            
            // Remove from local state
            setImageContainers(prev => prev.filter(container => container.id !== imageId));
        } catch (error) {
            console.error("Error removing image:", error);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (file && selectedCategory && user) {
            try {
                // Upload file to Firebase Storage
                const storageRef = ref(storage, `users/${user.uid}/designs/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);

                // Save image metadata to Firestore
                const imageData = {
                    userId: user.uid,
                    category: selectedCategory,
                    imageURL: downloadURL,
                    storagePath: snapshot.ref.fullPath,
                    uploadedAt: new Date().toISOString()
                };

                // Add to Firestore
                const docRef = await addDoc(collection(db, 'userDesigns'), imageData);

                // Update local state
                const newContainer = {
                    id: docRef.id,
                    ...imageData
                };

                setImageContainers(prev => [...prev, newContainer]);
                
                // Reset selected category and filter
                setSelectedCategory(null);
                setFilterCategory(newContainer.category);
            } catch (error) {
                console.error("Error uploading image:", error);
            }
        }
    };

    const filteredContainers = filterCategory === 'ALL' 
        ? imageContainers 
        : imageContainers.filter(container => container.category === filterCategory);

        return (
            <>
                <OwnerHeader />
                <OwnerSideBar />
                <main className="ml-64 mt-16 p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-12 gap-8">
                            <div className="col-span-12">
                                <PreviewArea />
                            </div>
                            <div className="flex ml-8 w-64">
                                <button
                                    className="bg-[#2F424B] text-white text-2xl px-8 py-2 rounded hover:bg-[#445166] transition-colors w-64 flex items-center space-x-2 whitespace-nowrap"
                                    onClick={toggleOverlay}
                                >
                                    <img
                                        src="/assets/ic--outline-settings.svg"
                                        alt="Settings"
                                        className="w-6 h-6"
                                    />
                                    <span>Elements Design</span>
                                </button>
                            </div>
                            <div className="flex ml-[470px] w-48">
                                <button className="bg-[#2F424B] text-white text-2xl px-8 py-2 rounded hover:bg-[#445166] transition-colors w-50">
                                    Save To
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
        
                {isOverlayOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="relative flex flex-col bg-[#2F424B] w-[900px] h-[500px] rounded mt-2 overflow-y-auto p-4">
                            <div className="flex justify-between items-center">
                                <h1 className="text-white text-xl p-4">
                                    Elements Design (Upload PNG file type only.)
                                </h1>
                                <span
                                    className="close-button cursor-pointer"
                                    onClick={toggleOverlay}
                                >
                                    <img
                                        src="/assets/fa--remove.svg"
                                        alt="Remove"
                                        className="w-6 h-6"
                                    />
                                </span>
                            </div>
        
                            {isCategoryOverlayOpen && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                                    <div className="bg-white rounded p-8 shadow-lg">
                                        <h2 className="text-2xl font-bold mb-4">Select a Category</h2>
                                        <div className="grid grid-cols-3 gap-4">
                                            {categories.map((category) => (
                                                <button
                                                    key={category}
                                                    className="bg-[#2F424B] text-white px-4 py-2 rounded hover:bg-[#445166] transition-colors"
                                                    onClick={() => handleCategorySelect(category)}
                                                >
                                                    {category}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
                                            onClick={toggleCategoryOverlay}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
        
                            <div className="flex justify-between items-center mb-4">
                                {/* Category Dropdown */}
                                <div ref={dropdownRef} className="relative">
                                    <button
                                        className="flex items-center bg-inherit text-white px-4 py-2 rounded"
                                        onClick={toggleCategoryDropdown}
                                    >
                                        <img
                                            src="/assets/icon-park-outline--category-management.svg"
                                            alt="Categories"
                                            className="w-6 h-6 mr-2"
                                        />
                                        <span>{selectedCategory || 'ALL'}</span>
                                    </button>
        
                                    {showCategoryDropdown && (
                                        <div className="absolute bg-white shadow-lg rounded mt-2 w-48 z-10">
                                            <button
                                                className={`block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-200 ${
                                                    filterCategory === 'ALL' ? 'font-bold' : ''
                                                }`}
                                                onClick={() => handleFilterCategory('ALL')}
                                            >
                                                ALL
                                            </button>
                                            {categories.map((category) => (
                                                <button
                                                    key={category}
                                                    className={`block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-200 ${
                                                        filterCategory === category ? 'font-bold' : ''
                                                    }`}
                                                    onClick={() => handleFilterCategory(category)}
                                                >
                                                    {category}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
        
                                {/* Add Image Button */}
                                <button
                                    onClick={toggleCategoryOverlay}
                                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded flex items-center space-x-2"
                                >
                                    <img
                                        src="/assets/typcn--plus.svg"
                                        alt="Add"
                                        className="w-6 h-6"
                                    />
                                    <span>Add Image</span>
                                </button>
        
                                {/* Hidden file input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".png"
                                    className="hidden"
                                />
                            </div>
        
                            <div className="flex flex-wrap">
                                {filteredContainers.map((container) => (
                                    <div
                                        key={container.id}
                                        className="relative mt-4 w-[150px] h-[100px] rounded cursor-pointer flex items-center justify-center mr-4 mb-4 overflow-hidden bg-[#F1F3F5]"
                                    >
                                        <img
                                            src={container.imageURL}
                                            alt="Uploaded"
                                            className="w-full h-full object-contain"
                                        />
                                        {container.category && (
                                            <span className="absolute top-2 left-2 bg-white/75 px-2 py-1 rounded text-xs">
                                                {container.category}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => removeImage(container.id)}
                                            className="absolute top-2 right-2 bg-transparent hover:bg-red-500/30 rounded-full p-1"
                                        >
                                            <img
                                                src="/assets/line-md--remove.svg"
                                                alt="Remove"
                                                className="w-5 h-5"
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
}        

export default CustomizeDesign;