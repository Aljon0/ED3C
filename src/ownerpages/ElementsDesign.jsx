import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import OwnerHeader from "../components/OwnerHeader";

function ElementsDesign() {
    const navigate = useNavigate();
    const [designImages, setDesignImages] = useState({});
    const [cornerImages, setCornerImages] = useState({});
    const [borderImages, setBorderImages] = useState({});
    const [showRemoveOptions, setShowRemoveOptions] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState({
        designImages: 0,
        cornerImages: 0,
        borderImages: 0
    });
    
    const IMAGES_PER_PAGE = 4;
    const storage = getStorage();
    const db = getFirestore();

    useEffect(() => {
        loadSavedImages();
    }, []);

    const loadSavedImages = async () => {
        try {
            const docRef = doc(db, 'designElements', 'images');
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                setDesignImages(data.designImages || {});
                setCornerImages(data.cornerImages || {});
                setBorderImages(data.borderImages || {});
            }
        } catch (error) {
            console.error("Error loading images:", error);
        }
    };

    const getNextAvailableIndex = (section) => {
        const images = {
            'designImages': designImages,
            'cornerImages': cornerImages,
            'borderImages': borderImages
        }[section];
        
        let maxIndex = -1;
        Object.keys(images).forEach(key => {
            const index = parseInt(key);
            if (!isNaN(index) && index > maxIndex) {
                maxIndex = index;
            }
        });
        return maxIndex + 1;
    };

    const handleImageUpload = async (event, index, section) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const filename = `${section}/${Date.now()}_${sanitizedName}`;
            const storageRef = ref(storage, filename);
            
            const metadata = {
                contentType: file.type,
            };
            
            const uploadResult = await uploadBytes(storageRef, file, metadata);
            const downloadURL = await getDownloadURL(uploadResult.ref);
            
            const actualIndex = getNextAvailableIndex(section);
            
            const updateState = {
                'designImages': setDesignImages,
                'cornerImages': setCornerImages,
                'borderImages': setBorderImages
            }[section];
            
            updateState(prev => {
                const newImages = { ...prev, [actualIndex]: downloadURL };
                saveToFirebase(section, newImages);
                return newImages;
            });
            
            // Auto-advance to the new page if needed
            const newPage = Math.floor(actualIndex / IMAGES_PER_PAGE);
            setCurrentPage(prev => ({
                ...prev,
                [section]: newPage
            }));
            
        } catch (error) {
            console.error("Error uploading image:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveToFirebase = async (section, images) => {
        try {
            const docRef = doc(db, 'designElements', 'images');
            const existingData = (await getDoc(docRef)).data() || {};
            
            await setDoc(docRef, {
                ...existingData,
                [section]: images
            }, { merge: true });
        } catch (error) {
            console.error("Error saving to Firestore:", error);
        }
    };

    const handleRemoveImage = async (index, section) => {
        try {
            const images = {
                'designImages': designImages,
                'cornerImages': cornerImages,
                'borderImages': borderImages
            }[section];
            
            const imageUrl = images[index];
            const imagePath = decodeURIComponent(imageUrl.split('?')[0].split('/o/')[1]);
            const storageRef = ref(storage, imagePath);
            
            await deleteObject(storageRef);
            
            const updateState = {
                'designImages': setDesignImages,
                'cornerImages': setCornerImages,
                'borderImages': setBorderImages
            }[section];
            
            updateState(prev => {
                const newImages = { ...prev };
                delete newImages[index];
                saveToFirebase(section, newImages);
                return newImages;
            });
            
            setShowRemoveOptions(prev => ({ ...prev, [`${section}-${index}`]: false }));
        } catch (error) {
            console.error("Error removing image:", error);
        }
    };

    const toggleRemoveOptions = (index, section) => {
        setShowRemoveOptions(prev => ({
            ...prev,
            [`${section}-${index}`]: !prev[`${section}-${index}`]
        }));
    };

    const handlePageChange = (section, direction) => {
        setCurrentPage(prev => {
            const images = {
                'designImages': designImages,
                'cornerImages': cornerImages,
                'borderImages': borderImages
            }[section];
            
            const totalImages = Object.keys(images).length;
            const maxPage = Math.ceil(totalImages / IMAGES_PER_PAGE);
            
            let newPage = prev[section] + direction;
            if (newPage < 0) newPage = 0;
            if (newPage >= maxPage && direction > 0) {
                // If moving forward and would exceed max page, allow one extra page for new uploads
                newPage = maxPage;
            } else if (newPage >= maxPage) {
                newPage = maxPage - 1;
            }
            
            return {
                ...prev,
                [section]: newPage
            };
        });
    };

    const getPageImages = (section, images) => {
        const startIndex = currentPage[section] * IMAGES_PER_PAGE;
        const pageImages = {};
        
        // Get all indices and sort them numerically
        const indices = Object.keys(images)
            .map(Number)
            .sort((a, b) => a - b);
        
        // Get images for current page
        for (let i = 0; i < IMAGES_PER_PAGE; i++) {
            const imageIndex = indices[startIndex + i];
            if (imageIndex !== undefined) {
                pageImages[i] = images[imageIndex];
            }
        }
        
        return pageImages;
    };

    const ImageGrid = ({ section, images }) => {
        const pageImages = getPageImages(section, images);
        const totalImages = Object.keys(images).length;
        const maxPage = Math.ceil(totalImages / IMAGES_PER_PAGE);
        const showNextPage = currentPage[section] < maxPage;
        
        return (
            <div className="flex items-center mt-8">
                <img 
                    src="/assets/flowbite--angle-left-outline.svg" 
                    className={`w-8 h-8 mr-4 ${currentPage[section] > 0 ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                    onClick={() => currentPage[section] > 0 && handlePageChange(section, -1)} 
                    alt="Previous" 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(IMAGES_PER_PAGE)].map((_, index) => (
                        <div key={index} className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow flex items-center justify-center cursor-pointer">
                            {isLoading && !pageImages[index] ? (
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                                    <p className="mt-2 text-sm">Uploading...</p>
                                </div>
                            ) : pageImages[index] ? (
                                <>
                                    <img 
                                        src={pageImages[index]} 
                                        alt="Uploaded" 
                                        className="w-full h-full object-cover rounded"
                                        onError={(e) => {
                                            console.error("Image failed to load:", e.target.src);
                                            e.target.src = "/assets/image-error.svg";
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity duration-200"/>
                                </>
                            ) : (
                                <>
                                    <label htmlFor={`file-upload-${section}-${index}`} className="cursor-pointer hover:opacity-80 transition-opacity duration-200">
                                        <img src="/assets/gala--add.svg" className="w-[60px] h-[60px]" alt="Add" />
                                    </label>
                                    <input 
                                        id={`file-upload-${section}-${index}`} 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden"
                                        onChange={(e) => handleImageUpload(e, index, section)} 
                                    />
                                </>
                            )}
                            
                            {pageImages[index] && (
                                <>
                                    <img 
                                        src="/assets/ph--dots-three.svg" 
                                        className="absolute bottom-2 right-2 cursor-pointer" 
                                        onClick={() => toggleRemoveOptions(index, section)}
                                        alt="Options" 
                                    />
                                    {showRemoveOptions[`${section}-${index}`] && (
                                        <div 
                                            className="absolute bottom-10 right-2 bg-white border border-gray-300 rounded shadow-md p-2 cursor-pointer z-10"
                                            onClick={() => handleRemoveImage(index + (currentPage[section] * IMAGES_PER_PAGE), section)}
                                        >
                                            <p className="text-sm text-red-500 font-semibold">Remove</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
                <img 
                    src="/assets/flowbite--angle-right-outline.svg" 
                    className={`w-8 h-8 ml-4 ${showNextPage ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                    onClick={() => showNextPage && handlePageChange(section, 1)} 
                    alt="Next" 
                />
            </div>
        );
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
                    <span className="font-bold text-[#37474F] text-6xl">Gravestone Design Elements</span>
                </div>

                <div className="text-center mt-8">
                    <p className="text-3xl text-[#333333] font-bold">Designs</p>
                </div>
                <ImageGrid section="designImages" images={designImages} />

                <div className="text-center mt-8">
                    <p className="text-3xl text-[#333333] font-bold">Corner Designs</p>
                </div>
                <ImageGrid section="cornerImages" images={cornerImages} />

                <div className="text-center mt-8">
                    <p className="text-3xl text-[#333333] font-bold">Border Designs</p>
                </div>
                <ImageGrid section="borderImages" images={borderImages} />
            </main>
        </>
    );
}

export default ElementsDesign;