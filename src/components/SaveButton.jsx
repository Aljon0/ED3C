import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Tooltip from "./Tooltip";
import { notifySuccess, notifyError } from "../general/CustomToast.js";
import { getStorage, ref, uploadString } from "firebase/storage";
import { getFirestore, doc, setDoc, collection } from "firebase/firestore";
import { useAuth } from '../components/AuthContext';

function SaveButton() {
  const location = useLocation();
  const { currentUser, userData } = useAuth(); // Use both currentUser and userData
  const isOwner = location.pathname.includes('/owner');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const storage = getStorage();
  const db = getFirestore();

  const categories = [
    'Recent Designs',
    'Gravestone',
    'Gravestone Base',
    'Urns',
    'Table Signs'
  ];

  const compressImage = async (dataUrl, maxSize = 100 * 1024) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > 800) {
            height = Math.round((height * 800) / width);
            width = 800;
          }
        } else {
          if (height > 800) {
            width = Math.round((width * 800) / height);
            height = 800;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let result = canvas.toDataURL('image/jpeg', quality);
        
        while (result.length > maxSize && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(result);
      };
      img.src = dataUrl;
    });
  };

  const getCanvasThumbnail = async () => {
    try {
      const canvas = document.querySelector('.canvas-container canvas');
      if (!canvas) {
        console.warn('Canvas not found for thumbnail');
        return null;
      }

      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      
      ctx.fillStyle = '#D3D3D3';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      try {
        ctx.drawImage(canvas, 0, 0);
        const rawThumbnail = tempCanvas.toDataURL('image/jpeg', 0.9);
        return await compressImage(rawThumbnail);
      } catch (error) {
        console.warn('Failed to draw canvas:', error);
        return tempCanvas.toDataURL('image/jpeg', 0.8);
      }
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      return null;
    }
  };

  const saveDesignToFirebase = async (design) => {
    if (!currentUser) throw new Error('No user authenticated');
  
    const designId = design.id;
    
    // Upload thumbnail
    const thumbnailRef = ref(storage, `thumbnails/${currentUser.uid}/${designId}`);
    await uploadString(thumbnailRef, design.thumbnail, 'data_url');
  
    // Process and upload images
    const processedSceneState = { ...design.sceneState };
    if (processedSceneState.uploadedImages && processedSceneState.uploadedImages.length > 0) {
      processedSceneState.uploadedImages = await Promise.all(
        processedSceneState.uploadedImages.map(async (img) => {
          if (img.data && !img.data.startsWith('http')) {
            const imageRef = ref(storage, `designs/${currentUser.uid}/${designId}/images/${img.id}`);
            await uploadString(imageRef, img.data, 'data_url');
            return {
              ...img,
              data: `designs/${currentUser.uid}/${designId}/images/${img.id}`
            };
          }
          return img;
        })
      );
    }
  
    // Ensure selectedObject and selectedTexture are included
    const designData = {
      ...design,
      thumbnail: `thumbnails/${currentUser.uid}/${designId}`,
      sceneState: {
        ...processedSceneState,
        selectedObject: processedSceneState.selectedObject || window.currentSceneState.selectedObject,
        selectedTexture: processedSceneState.selectedTexture || window.currentSceneState.selectedTexture
      },
      userId: currentUser.uid,
      isOwner,
      category: design.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  
    // Save design data to Firestore
    const designDoc = doc(collection(db, 'designs'), designId);
    await setDoc(designDoc, designData);
  
    return designId;
  };

  const handleSave = async (category = 'Recent Designs') => {
    if (!currentUser) {
      notifyError('Please sign in to save designs');
      return;
    }

    try {
      setIsSaving(true);
      const thumbnail = await getCanvasThumbnail();
      if (!thumbnail) {
        notifyError('Unable to create thumbnail');
        return;
      }

      const currentState = window.currentSceneState;
      if (!currentState) {
        notifyError('No scene state found');
        return;
      }

      // Compress and prepare scene state
      const compressedState = {
        selectedObject: currentState.selectedObject || "gravestone",
        selectedTexture: currentState.selectedTexture,
        texts: currentState.texts || [],
        uploadedImages: currentState.uploadedImages ? 
          await Promise.all(currentState.uploadedImages.map(async img => ({
            ...img,
            data: img.data ? await compressImage(img.data, 200 * 1024) : null
          }))) : [],
        stoneDimensions: currentState.stoneDimensions || {
          width: 2,
          height: 2,
          thickness: 0.5
        }
      };

      const designId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newDesign = {
        id: designId,
        thumbnail,
        category: isOwner ? category : 'Recent Designs',
        date: new Date().toISOString(),
        sceneState: compressedState
      };

      // Save to Firebase
      await saveDesignToFirebase(newDesign);

      // Store only the current edit state in localStorage
      const currentEditKey = isOwner ? 'currentEditDesign' : 'currentCustomerEditDesign';
      localStorage.setItem(currentEditKey, JSON.stringify({
        state: compressedState,
        designId: designId
      }));

      setShowCategoryModal(false);
      notifySuccess('Design saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      notifyError('Error saving design. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClick = () => {
    if (isOwner) {
      setShowCategoryModal(true);
    } else {
      handleSave();
    }
  };

  return (
    <>
      <div className="absolute top-4 right-28 flex gap-2 bg-[#2F424B] p-2 rounded-lg">
        <div className="relative">
          <Tooltip text="Save">
            <button 
              onClick={handleClick}
              disabled={isSaving}
              className={isSaving ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <img
                src="/assets/material-symbols--save.svg"
                alt=""
                className="w-8 h-8 cursor-pointer hover:opacity-80"
              />
            </button>
          </Tooltip>
        </div>
      </div>

      {isOwner && showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4 text-[#2F424B]">Select Category</h2>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleSave(category)}
                  disabled={isSaving}
                  className="w-full p-2 text-left hover:bg-gray-100 rounded transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCategoryModal(false)}
              disabled={isSaving}
              className="mt-4 w-full p-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default SaveButton;