import React, { useState, useEffect } from 'react';
import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";
import ElementsDesign from "./ElementsDesign"; // Import ElementsDesign component
import { NavLink, useNavigate } from "react-router-dom";
import { notifyError, notifySuccess } from '../general/CustomToast.js';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../components/AuthContext.jsx';

function OwnerDesign() {
  const { user } = useAuth();
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, userData } = useAuth();
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

  const loadSavedDesigns = async () => {
    try {
      setIsLoading(true);
      let designsQuery;

      // Build the query based on category
      if (selectedCategory === 'All') {
        designsQuery = query(
          collection(db, 'designs'),
          where('userId', '==', currentUser.uid),
          where('isOwner', '==', true)
        );
      } else {
        designsQuery = query(
          collection(db, 'designs'),
          where('userId', '==', currentUser.uid),
          where('isOwner', '==', true),
          where('category', '==', selectedCategory)
        );
      }

      const querySnapshot = await getDocs(designsQuery);

      // Load designs with better error handling and retry logic
      const designsData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();

          // Implement retry logic for thumbnail loading
          const loadThumbnail = async (retries = 3) => {
            for (let i = 0; i < retries; i++) {
              try {
                const thumbnailRef = ref(storage, data.thumbnail);
                const thumbnailUrl = await getDownloadURL(thumbnailRef);
                return thumbnailUrl;
              } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
              }
            }
          };

          try {
            const thumbnailUrl = await loadThumbnail();

            // Process scene state with proper default values
            const processedSceneState = {
              selectedObject: data.sceneState?.selectedObject || "gravestone",
              selectedTexture: data.sceneState?.selectedTexture || "marble",
              texts: Array.isArray(data.sceneState?.texts) ? data.sceneState.texts : [],
              uploadedImages: [],
              stoneDimensions: {
                width: data.sceneState?.stoneDimensions?.width || 2,
                height: data.sceneState?.stoneDimensions?.height || 2,
                thickness: data.sceneState?.stoneDimensions?.thickness || 0.5
              }
            };

            // Process uploaded images with retry logic
            if (Array.isArray(data.sceneState?.uploadedImages)) {
              processedSceneState.uploadedImages = await Promise.all(
                data.sceneState.uploadedImages.map(async (img) => {
                  if (img.data && typeof img.data === 'string' && img.data.startsWith('designs/')) {
                    try {
                      const imageRef = ref(storage, img.data);
                      const imageUrl = await getDownloadURL(imageRef);
                      return { ...img, data: imageUrl };
                    } catch (error) {
                      console.warn(`Failed to load image for design ${doc.id}:`, error);
                      return { ...img, data: null }; // Return null for failed images instead of keeping the storage path
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
              sceneState: processedSceneState
            };
          } catch (error) {
            console.error(`Failed to load design ${doc.id}:`, error);
            return null;
          }
        })
      );

      // Filter out failed designs and update state
      const validDesigns = designsData.filter(design => design !== null);
      setSavedDesigns(validDesigns);

    } catch (error) {
      console.error('Error loading designs:', error);
      notifyError('Error loading saved designs. Please try again.');
      setSavedDesigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadSavedDesigns();
    }
  }, [currentUser, selectedCategory]);

  const handleEdit = (design) => {
    try {
      // Ensure all required properties exist with fallbacks
      const editState = {
        selectedObject: design.sceneState?.selectedObject || "gravestone",
        selectedTexture: design.sceneState?.selectedTexture || "marble",
        texts: Array.isArray(design.sceneState?.texts) ? design.sceneState.texts : [],
        uploadedImages: Array.isArray(design.sceneState?.uploadedImages)
          ? design.sceneState.uploadedImages.filter(img => img.data !== null)
          : [],
        stoneDimensions: {
          width: design.sceneState?.stoneDimensions?.width || 2,
          height: design.sceneState?.stoneDimensions?.height || 2,
          thickness: design.sceneState?.stoneDimensions?.thickness || 0.5
        }
      };

      const saveData = {
        state: editState,
        designId: design.id,
        metadata: {
          originalTexture: design.sceneState?.selectedTexture,
          originalObject: design.sceneState?.selectedObject,
          lastEdited: new Date().toISOString()
        }
      };

      localStorage.setItem('currentEditDesign', JSON.stringify(saveData));
      localStorage.setItem('initialEditState', JSON.stringify({
        selectedObject: design.sceneState?.selectedObject,
        selectedTexture: design.sceneState?.selectedTexture,
        stoneDimensions: design.sceneState?.stoneDimensions || {
          width: 2,
          height: 2,
          thickness: 0.5
        }
      }));

      navigate('/owner/CustomizeDesign');
    } catch (error) {
      console.error('Error preparing design for edit:', error);
      notifyError('Error preparing design for edit. Please try again.');
    }
  };

  const handleDelete = async (designId) => {
    if (!window.confirm('Are you sure you want to delete this design?')) {
      return;
    }

    try {
      const design = savedDesigns.find(d => d.id === designId);
      if (!design) throw new Error('Design not found');

      // Delete thumbnail
      const thumbnailRef = ref(storage, design.thumbnail);
      await deleteObject(thumbnailRef);

      // Delete uploaded images
      if (design.sceneState.uploadedImages) {
        await Promise.all(
          design.sceneState.uploadedImages.map(async (img) => {
            if (img.data && typeof img.data === 'string' && img.data.startsWith('designs/')) {
              const imageRef = ref(storage, img.data);
              try {
                await deleteObject(imageRef);
              } catch (error) {
                console.warn('Failed to delete image:', error);
              }
            }
          })
        );
      }

      // Delete Firestore document
      await deleteDoc(doc(db, 'designs', designId));

      // Update local state
      setSavedDesigns(prev => prev.filter(design => design.id !== designId));
      notifySuccess('Design deleted successfully');

      // Refresh the designs
      loadSavedDesigns();
    } catch (error) {
      console.error('Error deleting design:', error);
      notifyError('Error deleting design');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredDesigns = savedDesigns.filter(design =>
    design.category === selectedCategory
  );

  if (isLoading) {
    return (
      <>
        <OwnerSideBar />
        <OwnerHeader />
        <div className="min-h-screen flex flex-col">
          <div className="flex-1 flex flex-col">

            <main className="flex-1 p-4 sm:p-8 mt-16">
              <div className="flex items-center justify-center h-full mt-64 ml-64">
                <div className="text-xl text-gray-600 ">Loading designs...</div>
              </div>
            </main>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <OwnerHeader />
      <OwnerSideBar />
      <div className="min-h-screen flex flex-col ml-64">

        <div className="flex-1 flex flex-col">

          <div className="flex-1 mt-16">
            <main className="p-4 sm:p-8">
              {/* Catalog Section */}
              <div className="flex items-center mb-8">
                <h1 className="font-bold text-[#37474F] text-2xl sm:text-3xl md:text-5xl lg:text-4xl xl:text-5xl">CATALOG</h1>
              </div>

              <div className="bg-[#2F424B] rounded-lg p-4 sm:p-6">
                <div className="relative mb-6">
                  <div
                    className="flex items-center justify-between cursor-pointer p-3 bg-white bg-opacity-10 rounded w-48 hover:bg-opacity-20 transition-all"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  >
                    <div className="flex items-center">
                      <img
                        src="/assets/icon-park-outline--category-management.svg"
                        className="w-5 h-5 sm:w-6 sm:h-6 mr-2"
                        alt="Category"
                      />
                      <span className="text-white font-medium">{selectedCategory}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-white transition-transform ${isCategoryDropdownOpen ? 'transform rotate-180' : ''
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {isCategoryDropdownOpen && (
                    <div className="absolute top-full left-0 bg-white rounded shadow-lg z-10 w-48 mt-1">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                  {savedDesigns.map((design) => (
                    <div
                      key={design.id}
                      className="relative group rounded-lg overflow-hidden shadow-lg"
                    >
                      <div className="w-full aspect-video bg-[#DADADA] overflow-hidden">
                        <img
                          src={design.thumbnail}
                          alt={`${design.category} Design`}
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
                        <span className="text-sm font-medium">{design.category}</span>
                        <span className="text-xs opacity-75">{formatDate(design.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {savedDesigns.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center h-[400px] text-white">
                    <svg className="w-16 h-16 opacity-50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-xl font-medium">No designs found</p>
                    <p className="text-sm opacity-75 mt-2">Create a new design to get started</p>
                  </div>
                )}
              </div>

              {/* Elements Design Section - Now below the catalog */}
              <div className="mt-8 bg-white rounded-lg shadow">
                <ElementsDesign embedded={true} />
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

export default OwnerDesign;