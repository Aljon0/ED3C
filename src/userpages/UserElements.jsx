import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import UserHeader from '../components/UserHeader';
import CategoryDesigns from '../components/CategoryDesigns';
import { notifyError } from '../general/CustomToast';

function UserElements() {
    const navigate = useNavigate();
    const [categories] = useState(['Border Designs', 'Corner Designs', 'Designs']);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [imageContainers, setImageContainers] = useState([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch images from Firestore
    useEffect(() => {
        const fetchImages = async () => {
            try {
                const docRef = doc(db, "designElements", "uploadedImages");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const transformedContainers = data.containers.map(container => ({
                        id: container.id,
                        image: container.imageURL,
                        category: container.category,
                        name: container.name // Include name in transformed data
                    }));
                    setImageContainers(transformedContainers);
                } else {
                    setImageContainers([]);
                }
            } catch (error) {
                notifyError("Error fetching images:", error);
                notifyError("Failed to load images. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchImages();
    }, []);

    // Key event listener for image navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (selectedImageIndex !== null) {
                const filteredImages = imageContainers.filter(
                    (container) =>
                        container.image &&
                        (selectedCategory === null || container.category === selectedCategory)
                );

                const currentIndex = filteredImages.findIndex(
                    (img) => img.image === filteredImages[selectedImageIndex]?.image
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

    const handleDownload = async (imageUrl) => {
        try {
            // For Firebase Storage, we don't need cache-control headers
            // as they cause CORS issues
            const response = await fetch(imageUrl, {
                method: 'GET',
                mode: 'cors'
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            // Get the blob directly from the response
            const blob = await response.blob();
            
            // Validate blob
            if (blob.size === 0) {
                throw new Error('Downloaded file is empty');
            }
    
            // Create download link
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Extract filename from Firebase URL or create timestamp-based name
            const urlParts = imageUrl.split('/');
            const originalFileName = urlParts[urlParts.length - 1].split('?')[0];
            const timestamp = new Date().getTime();
            const fileName = decodeURIComponent(originalFileName.split('%2F').pop()) || `gravestone_design_${timestamp}.png`;
    
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
    
            // Handle download with proper cleanup
            document.body.appendChild(link);
            
            return new Promise((resolve, reject) => {
                try {
                    link.click();
                    
                    // Cleanup after sufficient delay
                    setTimeout(() => {
                        window.URL.revokeObjectURL(blobUrl);
                        document.body.removeChild(link);
                        resolve();
                    }, 1000);
                } catch (error) {
                    window.URL.revokeObjectURL(blobUrl);
                    document.body.removeChild(link);
                    reject(error);
                }
            });
    
        } catch (error) {
            console.error('Download failed:', error);
            notifyError('Failed to download image. Please try right-click and save the image instead.');
        }
    };

    return (
        <div className="ml-8 mt-1 flex flex-col mr-4">
            <div className="relative bg-[#2F424B] w-[700px] h-[500px] rounded mt-[76px] p-4 overflow-y-auto">
                <CategoryDesigns
                    categories={categories}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                />

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                ) : (
                    // Modified grid layout to match the reference
                    <div className="grid grid-cols-4 gap-6 p-4 mt-8">
                        {filteredImages.map((container, index) => (
                            <div
                                key={container.id}
                                className="relative w-[150px] h-[100px] bg-[#F1F3F5] rounded cursor-pointer overflow-hidden"
                                onClick={() => setSelectedImageIndex(index)}
                            >
                                <img
                                    src={container.image}
                                    alt={`Uploaded ${container.category}`}
                                    className="w-full h-full object-contain"
                                />
                                {container.category && (
                                    <span className="absolute top-2 left-2 bg-white/75 px-2 py-1 rounded text-xs">
                                        {container.category}
                                    </span>
                                )}
                                {container.name && (
                                    <span className="absolute bottom-2 right-2 bg-white/75 px-2 py-1 rounded text-xs">
                                        {container.name}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>


            {selectedImageIndex !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-8">
                    <button
                        className="absolute left-8 text-white"
                        onClick={() => {
                            const prevIndex =
                                (selectedImageIndex - 1 + filteredImages.length) %
                                filteredImages.length;
                            setSelectedImageIndex(prevIndex);
                        }}
                    >
                        <img
                            src="/assets/flowbite--angle-left-outline.svg"
                            alt="Previous"
                            className="w-12 h-12"
                        />
                    </button>

                    <div className="relative bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                        <div className="mr-4 flex flex-col justify-center mb-2 p-6">
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
                            {filteredImages[selectedImageIndex].name && (
                                <p>Name: {filteredImages[selectedImageIndex].name}</p>
                            )}
                        </div>
                        <button
                            className="absolute top-2 right-12 p-2 hover:bg-gray-200 rounded-full"
                            onClick={() =>
                                handleDownload(filteredImages[selectedImageIndex].image)
                            }
                        >
                            <img
                                src="/assets/material-symbols--download.svg"
                                className="w-6 h-6"
                                alt="Download Icon"
                            />
                        </button>
                    </div>

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
        </div>
    );
}

export default UserElements;