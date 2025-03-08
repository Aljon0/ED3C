import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
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
                        name: container.name
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
            // Create a new request with appropriate headers
            const response = await fetch(imageUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'image/*'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Get the blob
            const blob = await response.blob();

            if (blob.size === 0) {
                throw new Error('Downloaded file is empty');
            }

            // Create and trigger download
            const blobUrl = window.URL.createObjectURL(blob);
            const filename = imageUrl.split('/').pop().split('?')[0];
            const decodedFilename = decodeURIComponent(filename);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = decodedFilename;
            document.body.appendChild(link);

            try {
                link.click();

                // Cleanup
                setTimeout(() => {
                    window.URL.revokeObjectURL(blobUrl);
                    document.body.removeChild(link);
                }, 100);
            } catch (error) {
                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(link);
                throw error;
            }

        } catch (error) {
            notifyError('Download failed:', error);
            notifyError('Failed to download image. Please try right-click and save image instead.');
        }
    };

    return (
        <div className="bg-[#2F424B] rounded-lg p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Elements</h2>
            <div className="relative w-full overflow-y-auto max-h-[500px]">
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                        {filteredImages.map((container, index) => (
                            <div
                                key={container.id}
                                className="relative aspect-video bg-[#F1F3F5] rounded cursor-pointer overflow-hidden group"
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

            {/* Modal - keeping the same styling */}
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