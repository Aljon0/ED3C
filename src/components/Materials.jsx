import React, { useState, useEffect, useRef } from 'react';
import { 
    collection, 
    query, 
    where, 
    getDocs 
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import Tooltip from "./Tooltip";

function Materials({ onImageSelect = () => {} }) {  // Add default no-op function
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [images, setImages] = useState([]);
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const dropdownRef = useRef(null);

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

    const toggleOverlay = () => {
        setIsOverlayOpen(!isOverlayOpen);
        if (!isOverlayOpen) {
            fetchUploadedImages();
        }
    };

    const fetchUploadedImages = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const q = query(collection(db, 'userDesigns'), where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            
            const uploadedImages = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setImages(uploadedImages);
        } catch (error) {
            console.error("Error fetching uploaded images:", error);
        }
    };

    const toggleCategoryDropdown = () => {
        setShowCategoryDropdown(!showCategoryDropdown);
    };

    const handleFilterCategory = (category) => {
        setFilterCategory(category);
        setShowCategoryDropdown(false);
    };

    const filteredImages = filterCategory === 'ALL' 
        ? images 
        : images.filter(image => image.category === filterCategory);

    const handleImageSelect = (image) => {
        // Ensure onImageSelect is a function before calling
        if (typeof onImageSelect === 'function') {
            onImageSelect({
                url: image.imageURL,
                size: [0.5, 0.5],  // Default size, can be adjusted
                position: [0, 0, 0],
                rotation: 0
            });
        }
        toggleOverlay();
    };

    return (
        <>
            <div className="absolute top-4 left-4 flex gap-2 bg-[#2F424B] p-2 rounded-lg ml-60">
                <Tooltip text="Elements Design">
                    <img 
                        src="/assets/academicons--open-materials.svg" 
                        alt="Open Materials" 
                        className="w-9 h-10 cursor-pointer"
                        onClick={toggleOverlay}
                    />
                </Tooltip>
            </div>

            {isOverlayOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="relative flex flex-col bg-[#2F424B] w-[900px] h-[500px] rounded mt-2 overflow-y-auto p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="text-white text-xl p-4">
                                Select Design
                            </h1>
                            <span
                                className="close-button cursor-pointer"
                                onClick={toggleOverlay}
                            >
                                <img
                                    src="/assets/fa--remove.svg"
                                    alt="Close"
                                    className="w-6 h-6"
                                />
                            </span>
                        </div>

                        {/* Category Dropdown */}
                        <div className="flex justify-between items-center mb-4 px-4">
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
                                    <span>{filterCategory}</span>
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
                        </div>

                        {/* Image Grid */}
                        <div className="flex flex-wrap px-2 justify-center">
                            {filteredImages.length === 0 ? (
                                <div className="w-full text-center text-white">
                                    No images found in this category.
                                </div>
                            ) : (
                                filteredImages.map((image) => (
                                    <div
                                        key={image.id}
                                        className="relative mt-4 w-[150px] h-[100px] rounded cursor-pointer flex items-center justify-center mr-4 mb-4 overflow-hidden bg-[#F1F3F5] hover:opacity-75 transition-opacity"
                                        onClick={() => handleImageSelect(image)}
                                        onContextMenu={(e) => e.preventDefault()}
                                        crossOrigin="anonymous"
                                        referrerPolicy="no-referrer"
                                    >
                                        <img
                                            src={image.imageURL}
                                            alt="Uploaded"
                                            className="w-full h-full object-contain"
                                            
                                        />
                                        {image.category && (
                                            <span className="absolute top-2 left-2 bg-white/75 px-2 py-1 rounded text-xs">
                                                {image.category}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Materials;