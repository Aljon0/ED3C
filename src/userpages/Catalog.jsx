import React, { useState, useEffect, useCallback } from 'react';
import UserHeader from "../components/UserHeader";
import UserSideBar from "../components/UserSideBar";
import { NavLink, useNavigate } from "react-router-dom";
import { notifySuccess, notifyError } from "../general/CustomToast.js";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../components/AuthContext';
import UserElements from './UserElements.jsx';

function Catalog() {
    const { currentUser } = useAuth();
    const [savedDesigns, setSavedDesigns] = useState([]);
    const [ownerDesigns, setOwnerDesigns] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    
    const db = getFirestore();
    const storage = getStorage();

    const categories = [
        'All',
        'Gravestone',
        'Gravestone Base',
        'Urns',
        'Table Signs'
    ];

    const processThumbnail = useCallback((thumbnailData) => {
        if (!thumbnailData) return null;
        try {
            // Check if the thumbnail is a valid data URL
            if (thumbnailData.startsWith('data:image')) {
                return thumbnailData;
            }
            return null;
        } catch (error) {
            console.warn('Error processing thumbnail:', error);
            return null;
        }
    }, []);
    
    const validateSceneState = useCallback((sceneState) => {
        const defaultState = {
            selectedObject: "gravestone",
            selectedTexture: "marble",
            texts: [],
            uploadedImages: [],
            stoneDimensions: { width: 2, height: 2, thickness: 0.5 }
        };

        if (!sceneState || typeof sceneState !== 'object') {
            return defaultState;
        }

        return {
            selectedObject: sceneState.selectedObject || defaultState.selectedObject,
            selectedTexture: sceneState.selectedTexture || defaultState.selectedTexture,
            texts: Array.isArray(sceneState.texts) ? sceneState.texts : defaultState.texts,
            uploadedImages: Array.isArray(sceneState.uploadedImages) ? sceneState.uploadedImages : defaultState.uploadedImages,
            stoneDimensions: {
                width: parseFloat(sceneState.stoneDimensions?.width) || defaultState.stoneDimensions.width,
                height: parseFloat(sceneState.stoneDimensions?.height) || defaultState.stoneDimensions.height,
                thickness: parseFloat(sceneState.stoneDimensions?.thickness) || defaultState.stoneDimensions.thickness
            }
        };
    }, []);

    const loadDesignsFromFirestore = useCallback(async (isOwnerDesigns = false) => {
        if (!currentUser && !isOwnerDesigns) return [];

        try {
            const designsQuery = query(
                collection(db, 'designs'),
                isOwnerDesigns ? 
                    where('isOwner', '==', true) :
                    where('userId', '==', currentUser.uid)
            );

            const querySnapshot = await getDocs(designsQuery);
            const designPromises = querySnapshot.docs.map(async (doc) => {
                try {
                    const data = doc.data();
                    const thumbnailUrl = await getDownloadURL(ref(storage, data.thumbnail));
                    
                    // Extract stone and texture data
                    const rawSceneState = data.sceneState || {};
                    const processedSceneState = {
                        selectedObject: rawSceneState.selectedObject || "gravestone",
                        selectedTexture: rawSceneState.selectedTexture || "marble",
                        stoneDimensions: rawSceneState.stoneDimensions || { width: 2, height: 2, thickness: 0.5 },
                        texts: rawSceneState.texts || [],
                        uploadedImages: []
                    };

                    // Process uploaded images if they exist
                    if (Array.isArray(rawSceneState.uploadedImages)) {
                        processedSceneState.uploadedImages = await Promise.all(
                            rawSceneState.uploadedImages.map(async (img) => {
                                if (img.data?.startsWith('designs/')) {
                                    try {
                                        const imageUrl = await getDownloadURL(ref(storage, img.data));
                                        return { ...img, data: imageUrl };
                                    } catch (error) {
                                        console.warn(`Failed to load image: ${img.data}`, error);
                                        return null;
                                    }
                                }
                                return img;
                            })
                        );

                        processedSceneState.uploadedImages = processedSceneState.uploadedImages.filter(img => img !== null);
                    }

                    // Validate the entire scene state
                    const validatedSceneState = validateSceneState(processedSceneState);

                    return {
                        ...data,
                        id: doc.id,
                        thumbnail: thumbnailUrl,
                        sceneState: validatedSceneState,
                        isOwnerDesign: isOwnerDesigns
                    };
                } catch (error) {
                    console.warn(`Failed to process design document ${doc.id}:`, error);
                    return null;
                }
            });

            const designs = await Promise.all(designPromises);
            return designs.filter(design => design !== null);
        } catch (error) {
            console.error(`Error loading ${isOwnerDesigns ? 'owner' : 'customer'} designs:`, error);
            throw error;
        }
    }, [currentUser, db, storage, validateSceneState]);

    const validateDesign = useCallback((design, isOwner = false) => {
        if (!design || typeof design !== 'object') {
            console.warn('Invalid design object:', design);
            return null;
        }

        const now = new Date().toISOString();
        const validatedDesign = {
            id: design.id || `${isOwner ? 'owner' : 'customer'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            thumbnail: processThumbnail(design.thumbnail),
            // Keep the original category for owner designs
            category: isOwner ? (design.category || 'Gravestone') : (design.category || 'Recent Designs'),
            date: design.date || now,
            isOwnerDesign: isOwner,
            sceneState: validateSceneState(design.sceneState)
        };

        return validatedDesign;
    }, [processThumbnail, validateSceneState]);

    const loadAllDesigns = useCallback(async () => {
        try {
            console.log('Starting to load designs...');
            
            // Load owner designs
            const ownerDesignsRaw = localStorage.getItem('savedDesigns');
            let ownerDesignsList = [];
            
            if (ownerDesignsRaw) {
                try {
                    const parsed = JSON.parse(ownerDesignsRaw);
                    if (Array.isArray(parsed)) {
                        ownerDesignsList = parsed
                            .map(design => validateDesign(design, true))
                            .filter(design => design !== null);
                    }
                } catch (e) {
                    console.error('Error parsing owner designs:', e);
                }
            }

            // Load customer designs
            const customerDesignsRaw = localStorage.getItem('customerSavedDesigns');
            let customerDesignsList = [];
            
            if (customerDesignsRaw) {
                try {
                    const parsed = JSON.parse(customerDesignsRaw);
                    if (Array.isArray(parsed)) {
                        customerDesignsList = parsed
                            .map(design => validateDesign(design, false))
                            .filter(design => design !== null);
                    }
                } catch (e) {
                    console.error('Error parsing customer designs:', e);
                }
            }

            setOwnerDesigns(ownerDesignsList);
            setSavedDesigns(customerDesignsList);

        } catch (error) {
            console.error('Error in loadAllDesigns:', error);
            notifyError('Error loading designs');
            setOwnerDesigns([]);
            setSavedDesigns([]);
        }
    }, [validateDesign]);

    const getFilteredDesigns = useCallback(() => {
        if (selectedCategory === 'All') {
            return [...ownerDesigns].sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        return ownerDesigns
            .filter(design => design.category === selectedCategory)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [selectedCategory, ownerDesigns]);

    const handleEdit = (design) => {
        try {
          const editState = {
            selectedObject: design.sceneState.selectedObject || "gravestone",
            selectedTexture: design.sceneState.selectedTexture || "marble",
            texts: Array.isArray(design.sceneState.texts) ? design.sceneState.texts : [],
            uploadedImages: Array.isArray(design.sceneState.uploadedImages) ? design.sceneState.uploadedImages : [],
            stoneDimensions: design.sceneState.stoneDimensions || {
              width: 2,
              height: 2,
              thickness: 0.5
            }
          };
      
          // Store the complete state with additional metadata
          const saveData = {
            state: editState,
            designId: design.id,
            metadata: {
              originalTexture: design.sceneState.selectedTexture,
              originalObject: design.sceneState.selectedObject,
              lastEdited: new Date().toISOString()
            }
          };
      
          localStorage.setItem('currentEditDesign', JSON.stringify(saveData));
          
          // Also store the initial state separately for reference
          localStorage.setItem('initialEditState', JSON.stringify({
            selectedObject: design.sceneState.selectedObject,
            selectedTexture: design.sceneState.selectedTexture,
            stoneDimensions: design.sceneState.stoneDimensions
          }));
          
          navigate('/Create');
        } catch (error) {
          console.error('Error preparing design for edit:', error);
          notifyError('Error preparing design for edit');
        }
      };

    const handleDelete = useCallback(async (designId) => {
        if (!currentUser || !designId) return;

        if (!window.confirm('Are you sure you want to delete this design?')) return;

        try {
            const designToDelete = [...savedDesigns, ...ownerDesigns].find(d => d.id === designId);
            if (!designToDelete) throw new Error('Design not found');

            await deleteDoc(doc(db, 'designs', designId));
            setSavedDesigns(prev => prev.filter(d => d.id !== designId));
            setOwnerDesigns(prev => prev.filter(d => d.id !== designId));

            notifySuccess('Design deleted successfully');
        } catch (error) {
            console.error('Error deleting design:', error);
            notifyError('Error deleting design');
        }
    }, [currentUser, db, savedDesigns, ownerDesigns]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const loadOwnerDesigns = useCallback(async () => {
        try {
            const ownerDesignsQuery = query(
                collection(db, 'designs'),
                where('isOwner', '==', true)
            );
            
            const querySnapshot = await getDocs(ownerDesignsQuery);
            const designsPromises = querySnapshot.docs.map(async (doc) => {
                const data = doc.data();
                
                try {
                    // Get thumbnail URL
                    const thumbnailUrl = await getDownloadURL(ref(storage, data.thumbnail));
                    
                    // Process scene state and its images
                    let processedSceneState = validateSceneState(data.sceneState);
                    
                    // Process uploaded images if they exist
                    if (processedSceneState.uploadedImages?.length > 0) {
                        const processedImages = await Promise.all(
                            processedSceneState.uploadedImages.map(async (img) => {
                                if (img.data && typeof img.data === 'string' && img.data.startsWith('designs/')) {
                                    try {
                                        const imageUrl = await getDownloadURL(ref(storage, img.data));
                                        return { ...img, data: imageUrl };
                                    } catch (error) {
                                        console.warn(`Failed to load image: ${img.data}`, error);
                                        return null;
                                    }
                                }
                                return img;
                            })
                        );
                        
                        processedSceneState.uploadedImages = processedImages.filter(img => img !== null);
                    }

                    return {
                        ...data,
                        id: doc.id,
                        thumbnail: thumbnailUrl,
                        sceneState: processedSceneState,
                        isOwnerDesign: true
                    };
                } catch (error) {
                    console.warn(`Failed to process design ${doc.id}:`, error);
                    return null;
                }
            });

            const designs = await Promise.all(designsPromises);
            const validDesigns = designs.filter(design => design !== null);
            setOwnerDesigns(validDesigns);
            
        } catch (error) {
            console.error('Error loading owner designs:', error);
            setOwnerDesigns([]);
            throw error;
        }
    }, [db, storage, validateSceneState]);

    const loadCustomerDesigns = useCallback(async () => {
        if (!currentUser) return;
        
        try {
            const customerDesignsQuery = query(
                collection(db, 'designs'),
                where('userId', '==', currentUser.uid),
                where('isOwner', '==', false)
            );
            
            const querySnapshot = await getDocs(customerDesignsQuery);
            const designsData = await Promise.all(querySnapshot.docs.map(async (doc) => {
                const data = doc.data();
                
                try {
                    const thumbnailUrl = await getDownloadURL(ref(storage, data.thumbnail));
                    
                    let processedSceneState = { ...data.sceneState };
                    if (processedSceneState.uploadedImages) {
                        processedSceneState.uploadedImages = await Promise.all(
                            processedSceneState.uploadedImages.map(async (img) => {
                                if (img.data && typeof img.data === 'string' && img.data.startsWith('designs/')) {
                                    try {
                                        const imageUrl = await getDownloadURL(ref(storage, img.data));
                                        return { ...img, data: imageUrl };
                                    } catch (error) {
                                        console.warn('Failed to load image:', error);
                                        return img;
                                    }
                                }
                                return img;
                            })
                        );
                    }

                    return {
                        ...data,
                        id: doc.id,
                        thumbnail: thumbnailUrl,
                        sceneState: processedSceneState,
                        isOwnerDesign: false
                    };
                } catch (error) {
                    console.warn('Failed to load design assets:', error);
                    return null;
                }
            }));

            const validDesigns = designsData.filter(design => design !== null);
            setSavedDesigns(validDesigns);
        } catch (error) {
            console.error('Error loading customer designs:', error);
            setSavedDesigns([]);
        }
    }, [currentUser, db, storage]);

    const handleUseTemplate = (design) => {
        try {
            const editState = {
                selectedObject: design.sceneState.selectedObject || "gravestone",
                selectedTexture: design.sceneState.selectedTexture || "marble",
                texts: Array.isArray(design.sceneState.texts) ? JSON.parse(JSON.stringify(design.sceneState.texts)) : [],
                uploadedImages: Array.isArray(design.sceneState.uploadedImages) ? 
                    JSON.parse(JSON.stringify(design.sceneState.uploadedImages)) : [],
                stoneDimensions: design.sceneState.stoneDimensions || {
                    width: 2,
                    height: 2,
                    thickness: 0.5
                }
            };

            // Store as a new customer design based on the template
            const saveData = {
                state: editState,
                designId: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                metadata: {
                    templateId: design.id,
                    originalTexture: design.sceneState.selectedTexture,
                    originalObject: design.sceneState.selectedObject,
                    createdAt: new Date().toISOString()
                }
            };

            localStorage.setItem('currentCustomerEditDesign', JSON.stringify(saveData));
            
            // Store initial state for reference
            localStorage.setItem('initialEditState', JSON.stringify({
                selectedObject: design.sceneState.selectedObject,
                selectedTexture: design.sceneState.selectedTexture,
                stoneDimensions: design.sceneState.stoneDimensions
            }));

            navigate('/Create');
        } catch (error) {
            console.error('Error preparing template for use:', error);
            notifyError('Error preparing template for use');
        }
    };

    useEffect(() => {
        const loadDesigns = async () => {
            setIsLoading(true);
            try {
                await loadOwnerDesigns();
                
                // Only load customer designs if there's a logged-in user
                if (currentUser) {
                    const customerDesignsQuery = query(
                        collection(db, 'designs'),
                        where('userId', '==', currentUser.uid),
                        where('isOwner', '==', false)
                    );
                    
                    const querySnapshot = await getDocs(customerDesignsQuery);
                    const customerDesigns = await Promise.all(
                        querySnapshot.docs.map(async (doc) => {
                            const data = doc.data();
                            const thumbnailUrl = await getDownloadURL(ref(storage, data.thumbnail));
                            return {
                                ...data,
                                id: doc.id,
                                thumbnail: thumbnailUrl,
                                sceneState: validateSceneState(data.sceneState)
                            };
                        })
                    );
                    setSavedDesigns(customerDesigns);
                }
            } catch (error) {
                console.error('Error loading designs:', error);
                notifyError('Failed to load designs');
            } finally {
                setIsLoading(false);
            }
        };

        loadDesigns();
    }, [currentUser, db, storage, loadOwnerDesigns, validateSceneState]);

    useEffect(() => {
        const initializeDesigns = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    loadOwnerDesigns(),
                    loadCustomerDesigns()
                ]);
            } catch (error) {
                console.error('Error initializing designs:', error);
                notifyError('Failed to load designs');
            } finally {
                setIsLoading(false);
            }
        };

        initializeDesigns();
    }, [loadOwnerDesigns, loadCustomerDesigns]);

    useEffect(() => {
        const loadAllDesigns = async () => {
            setIsLoading(true);
            try {
                const [ownerDesignsData, customerDesignsData] = await Promise.all([
                    loadDesignsFromFirestore(true),
                    loadDesignsFromFirestore(false)
                ]);

                setOwnerDesigns(ownerDesignsData);
                setSavedDesigns(customerDesignsData);
            } catch (error) {
                console.error('Error loading designs:', error);
                notifyError('Failed to load designs');
                setOwnerDesigns([]);
                setSavedDesigns([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadAllDesigns();
    }, [loadDesignsFromFirestore]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-gray-600">Loading designs...</div>
            </div>
        );
    }

    return (
        <>
            <UserHeader />
            <UserSideBar />
            <div className="flex ml-64 mt-16">
                <main className="p-8 flex-1">
                    <div className="flex items-center ml-16">
                        <span className="font-bold text-[#37474F] text-5xl ml-64">CATALOG</span>
                    </div>

                    {/* Recent Designs Section - Always visible at the top */}
                    <div className="relative bg-[#2F424B] w-[900px] rounded mt-8 p-6 overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-6">Recent Designs</h2>
                        
                        {savedDesigns.length > 0 ? (
                            <div className="grid grid-cols-3 gap-6">
                                {savedDesigns.map((design) => (
                                    <div
                                        key={design.id}
                                        className="relative group rounded-lg overflow-hidden shadow-lg"
                                    >
                                        <div className="w-full h-[150px] bg-[#DADADA] overflow-hidden">
                                            <img
                                                src={design.thumbnail}
                                                alt="Saved Design"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col justify-center items-center gap-3">
                                                <button
                                                    onClick={() => handleEdit(design)}
                                                    className="opacity-0 group-hover:opacity-100 bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-600 transition-all transform translate-y-4 group-hover:translate-y-0"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(design.id)}
                                                    className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-red-600 transition-all transform translate-y-4 group-hover:translate-y-0"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-3 flex justify-between items-center">
                                            <span className="text-sm font-medium">Recent Design</span>
                                            <span className="text-xs opacity-75">{formatDate(design.date)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-white">
                                <p className="text-xl font-medium">No recent designs</p>
                                <p className="text-sm opacity-75 mt-2">Your saved designs will appear here</p>
                            </div>
                        )}
                    </div>

                    {/* Templates Section */}
                    <div className="relative bg-[#2F424B] w-[900px] rounded mt-8 p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Templates</h2>
                            <div
                                className="flex items-center justify-between cursor-pointer p-3 bg-white bg-opacity-10 rounded w-48 hover:bg-opacity-20 transition-all"
                                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                            >
                                <div className="flex items-center">
                                    <img
                                        src="/assets/icon-park-outline--category-management.svg"
                                        className="w-6 h-6 mr-2"
                                        alt="Category"
                                    />
                                    <span className="text-white font-medium">{selectedCategory}</span>
                                </div>
                                <svg
                                    className={`w-4 h-4 text-white transition-transform ${
                                        isCategoryDropdownOpen ? 'transform rotate-180' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            
                            {isCategoryDropdownOpen && (
                                <div className="absolute top-16 right-6 bg-white rounded shadow-lg z-10 w-48 mt-1">
                                    {categories.map((category) => (
                                        <div
                                            key={category}
                                            className="p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                                            onClick={() => {
                                                setSelectedCategory(category);
                                                setIsCategoryDropdownOpen(false);
                                            }}
                                        >
                                            {category}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            {getFilteredDesigns().map((design) => (
                                <div
                                    key={design.id}
                                    className="relative group rounded-lg overflow-hidden shadow-lg"
                                >
                                    <div className="w-full h-[150px] bg-[#DADADA] overflow-hidden">
                                        <img
                                            src={design.thumbnail}
                                            alt={`${design.category} Design`}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col justify-center items-center gap-3">
                                            <button
                                                onClick={() => handleUseTemplate(design)}
                                                className="opacity-0 group-hover:opacity-100 bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-600 transition-all transform translate-y-4 group-hover:translate-y-0"
                                            >
                                                Use Template
                                            </button>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-3 flex justify-between items-center">
                                        <span className="text-sm font-medium">{design.category}</span>
                                        <span className="text-xs opacity-75">{formatDate(design.date)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {getFilteredDesigns().length === 0 && (
                            <div className="flex flex-col items-center justify-center h-32 text-white">
                                <p className="text-xl font-medium">No templates found</p>
                                <p className="text-sm opacity-75 mt-2">No templates available in this category</p>
                            </div>
                        )}
                    </div>
                </main>

                <div className="flex-1 p-8">
                    <UserElements />
                </div>
            </div>
        </>
    );
}

export default Catalog;