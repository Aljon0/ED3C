import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import UserHeader from '../components/UserHeader';
import { db } from '../firebase';

function UserElements() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState(['Border Designs', 'Corner Designs', 'Designs']);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [imageContainers, setImageContainers] = useState([]);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const docRef = doc(db, 'designElements', 'uploadedImages');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setImageContainers(data.containers || []);
                } else {
                    setImageContainers([]);
                }
            } catch (error) {
                console.error('Error fetching images:', error);
                alert('Failed to fetch images. Please try again.');
            }
        };

        fetchImages();
    }, []);

    // Key event listener for image navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (selectedImageIndex !== null) {
                const filteredImages = imageContainers.filter(
                    container => container.image && 
                    (selectedCategory === null || container.category === selectedCategory)
                );

                const currentIndex = filteredImages.findIndex(
                    img => img.image === filteredImages[selectedImageIndex].image
                );

                if (e.key === 'ArrowRight') {
                    const nextIndex = (currentIndex + 1) % filteredImages.length;
                    setSelectedImageIndex(nextIndex);
                } else if (e.key === 'ArrowLeft') {
                    const prevIndex = (currentIndex - 1 + filteredImages.length) % filteredImages.length;
                    setSelectedImageIndex(prevIndex);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImageIndex, imageContainers, selectedCategory]);

    const filteredImages = imageContainers.filter(
        (container) =>
            container.image && (selectedCategory === null || container.category === selectedCategory)
    );

    const handleDownload = (imageUrl) => {
        const proxyUrl = `/download-image?url=${encodeURIComponent(imageUrl)}`;
    
        fetch(proxyUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob();
            })
            .then(blob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `gravestone_design_${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(error => {
                console.error('Download error:', error);
                alert('Failed to download image');
            });
    };

    return (
        <>
            <UserHeader />
            <main className="ml-8 p-8 mt-16 flex flex-col">
                {/* Back Button */}
                <div className="flex justify-start w-full mt-8 items-center">
                    <div className="flex flex-col items-center mr-8">
                        <img
                            src="/assets/tabler--arrow-left.svg"
                            className="w-14 h-14 cursor-pointer"
                            onClick={() => navigate(-1)}
                            alt="Back"
                        />
                        <p className="text-[#37474F] font-bold">Go Back</p>
                    </div>
                    <span className="font-bold text-[#37474F] text-6xl">
                        Gravestone Design Elements
                    </span>
                </div>

                {/* Main Container */}
                <div className="relative bg-[#2F424B] w-[900px] h-[500px] rounded mt-12 p-4 overflow-y-auto">
                    {/* Category Dropdown */}
                    <div
                        className="flex items-center cursor-pointer mb-4"
                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    >
                        <img
                            src="/assets/icon-park-outline--category-management.svg"
                            className="w-6 h-6 mr-2"
                            alt="Category"
                        />
                        <span className="text-white text-lg font-semibold">
                            {selectedCategory || 'Filter by Category'}
                        </span>
                    </div>

                    {isCategoryDropdownOpen && (
                        <div className="absolute bg-white rounded shadow-md p-2 z-10 w-[200px]">
                            <button
                                className={`w-full text-left px-3 py-2 rounded ${
                                    selectedCategory === null
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-700'
                                }`}
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setIsCategoryDropdownOpen(false);
                                }}
                            >
                                All
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    className={`w-full text-left px-3 py-2 rounded ${
                                        selectedCategory === category
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-700'
                                    }`}
                                    onClick={() => {
                                        setSelectedCategory(category);
                                        setIsCategoryDropdownOpen(false);
                                    }}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Filtered Images */}
                    <div className="flex flex-wrap mt-4">
                        {filteredImages.map((container, index) => (
                            <div
                                key={container.id}
                                className="relative mt-4 w-[150px] h-[100px] bg-[#DADADA] rounded cursor-pointer mr-4 mb-4"
                                onClick={() => setSelectedImageIndex(index)}
                            >
                                <img
                                    src={container.image}
                                    alt={`Uploaded ${container.category}`}
                                    className="w-full h-full object-cover rounded"
                                />
                                {container.category && (
                                    <span className="absolute top-1 left-1 bg-white/75 px-2 py-1 rounded text-xs">
                                        {container.category}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Modal for Viewing Image */}
            {selectedImageIndex !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-8">
                    {/* Left Navigation Arrow */}
                    <button 
                        className="absolute left-8 text-white"
                        onClick={() => {
                            const prevIndex = (selectedImageIndex - 1 + filteredImages.length) % filteredImages.length;
                            setSelectedImageIndex(prevIndex);
                        }}
                    >
                        <img 
                            src="/assets/flowbite--angle-left-outline.svg" 
                            alt="Previous" 
                            className="w-12 h-12"
                        />
                    </button>

                    {/* Modal Content */}
                    <div className="relative bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                        <div className="mr-4 flex flex-col justify-center mb-2">
                            <span className="text-gray-500">Alternative download if not working:</span>
                            <span className="text-gray-500">Right click and Save image as</span>
                        </div>
                        <button
                            className="absolute top-2 right-2 text-2xl font-bold text-gray-500 hover:text-gray-700"
                            onClick={() => setSelectedImageIndex(null)}
                        >
                            &times;
                        </button>
                        <img 
                            src={filteredImages[selectedImageIndex].image} 
                            alt="Selected" 
                            className="max-w-full max-h-[70vh] rounded" 
                        />
                        <div className="mt-2 text-center">
                            <p>Category: {filteredImages[selectedImageIndex].category || 'Uncategorized'}</p>
                        </div>
                        <button
                            className="absolute top-2 right-12 p-2 hover:bg-gray-200 rounded-full"
                            onClick={() => handleDownload(filteredImages[selectedImageIndex].image)}
                        >
                            <img
                                src="/assets/material-symbols--download.svg"
                                className="w-6 h-6"
                                alt="Download Icon"
                            />
                        </button>
                    </div>

                    {/* Right Navigation Arrow */}
                    <button 
                        className="absolute right-8 text-white"
                        onClick={() => {
                            const nextIndex = (selectedImageIndex + 1) % filteredImages.length;
                            setSelectedImageIndex(nextIndex);
                        }}
                    >
                        <img 
                            src="/assets/flowbite--angle-right-outline.svg" 
                            alt="Next" 
                            className="w-12 h-12"
                        />
                    </button>
                </div>
            )}
        </>
    );
}

export default UserElements;