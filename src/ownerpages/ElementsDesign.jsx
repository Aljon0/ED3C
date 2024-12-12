    import React, { useEffect, useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { doc, setDoc, getDoc } from 'firebase/firestore';
    import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
    import OwnerHeader from "../components/OwnerHeader";
    import CategoryDesigns from '../components/CategoryDesigns';
    import { db, storage, auth } from '../firebase';

    function ElementsDesign() {
        const navigate = useNavigate();
        const [user, setUser] = useState(null);
        const [selectedCategory, setSelectedCategory] = useState(null);
        const [imageContainers, setImageContainers] = useState([{ id: 1, image: null, category: null }]);
        const [showCategoryOverlay, setShowCategoryOverlay] = useState(false);
        const [currentContainerIndex, setCurrentContainerIndex] = useState(null);
        const [dropdownIndex, setDropdownIndex] = useState(null);

        const categories = [
            'Border Designs',
            'Corner Designs',
            'Designs'
        ];

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
                        const containers = data.containers || [{ id: 1, image: null, category: null }];
                        
                        // Ensure at least one empty container exists
                        if (containers.length === 0 || containers[containers.length - 1].image !== null) {
                            containers.push({ id: containers.length + 1, image: null, category: null });
                        }
                        
                        setImageContainers(containers);
                    } else {
                        // If no document exists, set default state
                        setImageContainers([{ id: 1, image: null, category: null }]);
                    }
                } catch (error) {
                    console.error("Error fetching images:", error);
                    alert("Failed to fetch images. Please try again.");
                    // Fallback to default state
                    setImageContainers([{ id: 1, image: null, category: null }]);
                }
            };
            fetchImages();
        }, [user]);

        const handleImageUpload = async (event, index) => {
            if (!user) {
                alert("You must be logged in to upload images.");
                return;
            }

            const file = event.target.files[0];
            if (file) {
                try {
                    const filename = `${user.uid}/${Date.now()}_${file.name}`;
                    const storageRef = ref(storage, filename);

                    const snapshot = await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(snapshot.ref);

                    const updatedContainers = [...imageContainers];
                    updatedContainers[index].image = downloadURL;
                    updatedContainers[index].category = selectedCategory;
                    
                    if (index === updatedContainers.length - 1) {
                        updatedContainers.push({ 
                            id: updatedContainers.length + 1, 
                            image: null, 
                            category: null 
                        });
                    }
                    
                    setImageContainers(updatedContainers);

                    await setDoc(doc(db, "designElements", "uploadedImages"), {
                        containers: updatedContainers
                    });

                    setCurrentContainerIndex(null);
                    setSelectedCategory(null);
                    setShowCategoryOverlay(false);

                } catch (error) {
                    console.error("Upload error:", error);
                    alert(`Upload failed: ${error.message}`);
                }
            }
        };

        const handleRemoveImage = async (index) => {
            const confirm = window.confirm("Are you sure you want to remove this image?");
            if (!confirm) return;

            const updatedContainers = [...imageContainers];
            const removedImage = updatedContainers[index];

            // Remove from Firebase Storage
            if (removedImage.image) {
                const storageRef = ref(storage, removedImage.image.split('/o/')[1].split('?')[0]);
                await deleteObject(storageRef).catch((error) => console.error("Error removing from storage:", error));
            }

            updatedContainers[index].image = null;
            updatedContainers[index].category = null;

            setImageContainers(updatedContainers);

            await setDoc(doc(db, "designElements", "uploadedImages"), {
                containers: updatedContainers
            });

            setDropdownIndex(null);
        };

        const handleCategorySelect = (category) => {
            setSelectedCategory(category);
            setShowCategoryOverlay(false);
        };

        const handleContainerClick = (index) => {
            if (!imageContainers[index].image) {
                setCurrentContainerIndex(index);
                setShowCategoryOverlay(true);
            }
        };

        return (
            <>
                <OwnerHeader />
                <main className="ml-8 p-8 mt-16 flex flex-col">
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

                    <div className='relative flex flex-col bg-[#2F424B] w-[900px] h-[500px] rounded mt-2 overflow-y-auto p-4'>
                        <CategoryDesigns 
                            categories={categories}
                            imageContainers={imageContainers}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                        />

                        {/* Keep existing image containers for upload */}
                        <div className="flex flex-wrap">
                            {imageContainers.map((container, index) => (
                                <div
                                    key={container.id}
                                    className="relative mt-4 w-[150px] h-[100px] bg-[#DADADA] rounded cursor-pointer flex items-center justify-center mr-4 mb-4"
                                    onClick={() => {
                                        if (!container.image) {
                                            setCurrentContainerIndex(index);
                                            setShowCategoryOverlay(true);
                                        }
                                    }}
                                >
                                    {!container.image ? (
                                        <div className="flex flex-col items-center">
                                            <img 
                                                src="/assets/typcn--plus.svg" 
                                                alt="Add" 
                                                className="w-8 h-8 mb-1"
                                            />
                                            <span className="text-[#2F424B] text-sm">Add Image</span>
                                        </div>
                                    ) : (
                                        <>
                                            <img
                                                src={container.image}
                                                alt="Uploaded"
                                                className="w-full h-full object-cover rounded"
                                            />
                                            <img
                                                src="/assets/ph--dots-three.svg"
                                                alt="Options"
                                                className="absolute bottom-2 right-2 w-6 h-6 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDropdownIndex(index === dropdownIndex ? null : index);
                                                }}
                                            />
                                            {dropdownIndex === index && (
                                                <div className="absolute bottom-10 right-2 bg-white rounded shadow-lg p-2">
                                                    <button
                                                        className="text-red-500 text-sm"
                                                        onClick={() => handleRemoveImage(index)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {showCategoryOverlay && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                            <div className="bg-white rounded-lg p-6 shadow-lg w-[400px]">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">Select a Category</h2>
                                    <img 
                                        src="/assets/line-md--remove.svg" 
                                        alt="Close" 
                                        className="w-6 h-6 cursor-pointer"
                                        onClick={() => {
                                            setShowCategoryOverlay(false);
                                            setCurrentContainerIndex(null);
                                        }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-center py-3 rounded-lg font-semibold transition-colors"
                                            onClick={() => {
                                                handleCategorySelect(category);
                                                // Trigger file input after category selection
                                                document.getElementById(`file-input-${currentContainerIndex}`).click();
                                            }}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hidden file input for programmatic triggering */}
                    {currentContainerIndex !== null && (
                        <input
                            id={`file-input-${currentContainerIndex}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, currentContainerIndex)}
                        />
                    )}
                </main>
            </>
        );
    }

    export default ElementsDesign;