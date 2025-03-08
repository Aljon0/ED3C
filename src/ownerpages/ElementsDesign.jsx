import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import CategoryDesigns from '../components/CategoryDesigns';
import { db, storage, auth } from '../firebase';
import DeletionAlert from "../components/DeletionAlert"
import { notifyError, notifySuccess, notifyWarning } from "../general/CustomToast";

function ElementsDesign({ embedded = false }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [allImageContainers, setAllImageContainers] = useState([]);
    const [filteredImageContainers, setFilteredImageContainers] = useState([]);
    const [showCategoryOverlay, setShowCategoryOverlay] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImages, setSelectedImages] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [imageToDelete, setImageToDelete] = useState(null);
    const [showNameInput, setShowNameInput] = useState(false);
    const [imageName, setImageName] = useState('');
    const [pendingUpload, setPendingUpload] = useState(null);
    const [showCheckboxes, setShowCheckboxes] = useState(false);

    const categories = [
        'Border Designs',
        'Corner Designs',
        'Designs'
    ];

    const handleCheckboxToggle = (imageId) => {
        setSelectedImages(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(imageId)) {
                newSelection.delete(imageId);
            } else {
                newSelection.add(imageId);
            }
            return newSelection;
        });
    };

    const handleBulkDelete = async () => {
        if (selectedImages.size === 0) return;

        const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedImages.size} selected images?`);
        if (!confirmDelete) return;

        try {
            const updatedContainers = allImageContainers.filter(
                container => !selectedImages.has(container.id)
            );

            await setDoc(doc(db, "designElements", "uploadedImages"), {
                containers: updatedContainers
            });

            setAllImageContainers(updatedContainers);
            setSelectedImages(new Set());
            setShowCheckboxes(false);
            notifySuccess('Images deleted successfully');
        } catch (error) {
            console.error('Error deleting images:', error);
            notifyError('Failed to delete images');
        }
    };

    // Check authentication on component mount
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                // Redirect to login if not authenticated
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Fetch uploaded images from Firestore on mount
    useEffect(() => {
        const fetchImages = async () => {
            if (!user) return;

            const docRef = doc(db, "designElements", "uploadedImages");
            try {
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const containers = data.containers || [];
                    setAllImageContainers(containers);
                    setFilteredImageContainers(containers);
                    setSelectedImages(new Set()); // Reset selection when fetching new images
                } else {
                    setAllImageContainers([]);
                    setFilteredImageContainers([]);
                }
            } catch (error) {
                notifyError("Error fetching images:", error);
                notifyError("Failed to fetch images. Please try again.");
                setAllImageContainers([]);
                setFilteredImageContainers([]);
            }
        };
        fetchImages();
    }, [user]);

    const handleImageSelection = (imageId) => {
        const newSelection = new Set(selectedImages);
        if (newSelection.has(imageId)) {
            newSelection.delete(imageId);
        } else {
            newSelection.add(imageId);
        }
        setSelectedImages(newSelection);
    };

    // Filter images when selected category changes
    useEffect(() => {
        if (selectedCategory) {
            const filtered = allImageContainers.filter(
                container => container.category === selectedCategory
            );
            setFilteredImageContainers(filtered);
        } else {
            // If no category selected, show all images
            setFilteredImageContainers(allImageContainers);
        }
    }, [selectedCategory, allImageContainers]);

    const handleMultipleImageUpload = async (event) => {
        if (!user || !selectedCategory) {
            notifyWarning("You must be logged in and select a category to upload images.");
            return;
        }

        const files = event.target.files;
        if (files.length === 0) return;

        // Store the files temporarily and show name input
        setPendingUpload(files);
        setShowNameInput(true);
    };

    const processUpload = async () => {
        if (!pendingUpload || !imageName.trim()) return;

        try {
            setIsUploading(true);
            const uploadPromises = Array.from(pendingUpload).map(async (file) => {
                const filename = `${user.uid}/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, filename);

                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);

                return {
                    id: Date.now() + Math.random(),
                    imageURL: downloadURL,
                    category: selectedCategory,
                    name: imageName.trim()
                };
            });

            const newContainers = await Promise.all(uploadPromises);
            const updatedContainers = [...allImageContainers, ...newContainers];

            setAllImageContainers(updatedContainers);

            await setDoc(doc(db, "designElements", "uploadedImages"), {
                containers: updatedContainers
            });

            // Reset states
            setShowNameInput(false);
            setImageName('');
            setPendingUpload(null);
            setShowCategoryOverlay(false);
            setSelectedCategory(null);
            setIsUploading(false);

        } catch (error) {
            notifyError("Upload error:", error);
            notifyError(`Upload failed: ${error.message}`);
            setIsUploading(false);
        }
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setShowCategoryOverlay(false);
        document.getElementById('file-input').click();
    };

    const removeImage = async () => {
        if (!imageToDelete) return;

        try {
            const containerToRemove = allImageContainers.find(container => container.id === imageToDelete);

            if (containerToRemove && containerToRemove.imageURL) {
                // Decode the URL and extract the file path
                const decodedURL = decodeURIComponent(containerToRemove.imageURL);
                const filePathMatch = decodedURL.match(/\/o\/(.+?)\?/);

                if (filePathMatch && filePathMatch[1]) {
                    const filePath = filePathMatch[1];

                    // Create storage reference using the extracted file path
                    const storageRef = ref(storage, filePath);

                    // Delete the file from storage
                    await deleteObject(storageRef);
                }
            }

            const updatedContainers = allImageContainers.filter(container => container.id !== imageToDelete);

            // Update Firestore document
            await setDoc(doc(db, "designElements", "uploadedImages"), {
                containers: updatedContainers
            });

            // Update local state
            setAllImageContainers(updatedContainers);

            // Reset the imageToDelete state
            setImageToDelete(null);
        } catch (error) {
            notifyError("Error removing from storage:", error);
            notifyError(`Failed to delete image: ${error.message}`);
        }
    };

    const toggleCategoryOverlay = () => {
        setShowCategoryOverlay(!showCategoryOverlay);
    };

    return (
        <div className={`flex flex-col ${embedded ? 'w-full' : ''}`}>
            <div className="bg-[#2F424B] rounded-lg p-4 md:p-6">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Elements</h2>
                <div className="relative w-full overflow-y-auto max-h-[500px]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <CategoryDesigns
                            categories={categories}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                        />
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setShowCheckboxes(!showCheckboxes);
                                    if (!showCheckboxes) {
                                        setSelectedImages(new Set());
                                    }
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${showCheckboxes ? 'bg-[#0CAADC] text-white' : 'text-white hover:bg-gray-600'
                                    }`}
                                title={showCheckboxes ? 'Exit Selection Mode' : 'Select Multiple'}
                            >
                                <svg
                                    className="w-5 h-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    {showCheckboxes && <path d="M8 12l3 3 6-6" />}
                                </svg>
                                <span className="hidden sm:inline">{showCheckboxes ? 'Cancel' : 'Select'}</span>
                            </button>

                            <button
                                onClick={toggleCategoryOverlay}
                                className="p-1 rounded-lg hover:bg-gray-600"
                                title="Add Images"
                            >
                                <img
                                    src="/assets/lucide--image-plus.svg"
                                    alt="Add"
                                    className="w-16 h-16"
                                />
                            </button>

                            {showCheckboxes && selectedImages.size > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200"
                                >
                                    <img
                                        src="/assets/bx--trash-white.svg"
                                        alt="Delete Selected"
                                        className="w-5 h-5"
                                    />
                                    <span>({selectedImages.size})</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                        {filteredImageContainers.map((container) => (
                            <div
                                key={container.id}
                                className="relative aspect-video bg-[#F1F3F5] rounded cursor-pointer overflow-hidden group"
                                onClick={() => showCheckboxes && handleCheckboxToggle(container.id)}
                            >
                                {showCheckboxes && (
                                    <div className="absolute top-2 left-2 z-10">
                                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${selectedImages.has(container.id)
                                                ? 'bg-[#0CAADC] border-[#0CAADC]'
                                                : 'border-white bg-transparent'
                                            }`}>
                                            {selectedImages.has(container.id) && (
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                >
                                                    <path d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                )}

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
                                {container.name && (
                                    <span className="absolute bottom-2 right-2 bg-white/75 px-2 py-1 rounded text-xs">
                                        {container.name}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modals */}
                {showNameInput && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white rounded-lg p-6 shadow-lg w-[400px] max-w-[90vw]">
                            <h2 className="text-xl font-bold mb-4">Enter Image Name</h2>
                            <input
                                type="text"
                                value={imageName}
                                onChange={(e) => setImageName(e.target.value)}
                                className="w-full p-2 border rounded mb-4"
                                placeholder="Enter image name"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowNameInput(false);
                                        setPendingUpload(null);
                                        setImageName('');
                                    }}
                                    className="px-4 py-2 bg-gray-200 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={processUpload}
                                    className="px-4 py-2 bg-blue-500 text-white rounded"
                                    disabled={!imageName.trim()}
                                >
                                    Upload
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showCategoryOverlay && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white rounded-lg p-6 shadow-lg w-[400px] max-w-[90vw]">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Select a Category</h2>
                                <img
                                    src="/assets/line-md--remove.svg"
                                    alt="Close"
                                    className="w-6 h-6 cursor-pointer"
                                    onClick={() => {
                                        setShowCategoryOverlay(false);
                                        setSelectedCategory(null);
                                    }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-center py-3 rounded-lg font-semibold transition-colors"
                                        onClick={() => handleCategorySelect(category)}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {isUploading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-lg flex items-center">
                            <svg
                                className="animate-spin h-5 w-5 mr-3"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            <span>Uploading images...</span>
                        </div>
                    </div>
                )}

                <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleMultipleImageUpload}
                />
                <DeletionAlert
                    isOpen={!!imageToDelete}
                    onClose={() => setImageToDelete(null)}
                    onConfirm={removeImage}
                    title="Delete Image"
                    message="Are you sure you want to permanently remove this image from your design elements?"
                    confirmText="Delete Image"
                    cancelText="Cancel"
                />
            </div>
        </div>
    );
}

export default ElementsDesign;