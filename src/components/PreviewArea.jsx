import React, { useState, useRef, Suspense, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { useLocation } from 'react-router-dom';
import Tooltip from "../components/Tooltip";
import ManipulationTools from "../components/ManipulationTools";
import UndoRedo from "../components/UndoRedo";
import StyleTools from "../components/StyleTools";
import Scene from "../components/Scene";
import DimensionControls from "../components/DimensionControls";
import SaveButton from "./SaveButton";
import { notifySuccess, notifyError } from "../general/CustomToast.js";
import { useAuth } from "./AuthContext.jsx";
import LockScene from "./LockScene.jsx";
import Instructions from "../components/Instructions.jsx";

const PreviewArea = (initialState) => {
  const location = useLocation();
  const isOwner = location.pathname.includes('/owner');
  const currentEditKey = isOwner ? 'currentEditDesign' : 'currentCustomerEditDesign';
  
  // Initialize states
  const [selectedObject, setSelectedObject] = useState("gravestone");
  const [selectedTexture, setSelectedTexture] = useState("marble");
  const [texts, setTexts] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [moveEnabled, setMoveEnabled] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedTextIndex, setSelectedTextIndex] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [rotateEnabled, setRotateEnabled] = useState(false);
  const [removeEnabled, setRemoveEnabled] = useState(false);
  const [copiedElement, setCopiedElement] = useState(null);
  const [isSceneLocked, setIsSceneLocked] = useState(false);
  const { user } = useAuth();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  const canvasRef = useRef();
  const containerRef = useRef();
  const sceneRef = useRef();
  const loadingStateRef = useRef({
    isLoading: false,
    textureLoaded: false
  });

  const [stoneDimensions, setStoneDimensions] = useState({
    width: 2,
    height: 2,
    thickness: 0.5,
  });

  const handleUpdateTextHeight = (index, newHeight) => {
    setTexts(prevTexts => 
      prevTexts.map((text, i) => 
        i === index ? { ...text, height: newHeight } : text
      )
    );
  };

  const handleUpdateTextPosition = (index, newPosition) => {
    saveStateToHistory('move_text');
    setTexts((prevTexts) =>
      prevTexts.map((text, i) =>
        i === index ? { ...text, position: newPosition } : text
      )
    );
  };

  const saveStateToHistory = useCallback((actionType = 'update') => {
    const currentState = {
      texts: JSON.parse(JSON.stringify(texts)),
      images: uploadedImages.map(img => ({
        ...img,
        url: img.url
      })),
      actionType, // Track what type of action was performed
      timestamp: Date.now()
    };

    setUndoStack(prev => [...prev, currentState]);
    // Clear redo stack when a new action is performed
    setRedoStack([]);
  }, [texts, uploadedImages]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Escape key handler for deselection
      if (e.key === 'Escape') {
        setSelectedTextIndex(null);
        setSelectedImageIndex(null);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }

      // Copy functionality (Ctrl + C)
      if (e.ctrlKey && e.key === 'c') {
        if (selectedTextIndex !== null) {
          setCopiedElement({
            type: 'text',
            data: { ...texts[selectedTextIndex] }
          });
        } else if (selectedImageIndex !== null) {
          setCopiedElement({
            type: 'image',
            data: { ...uploadedImages[selectedImageIndex] }
          });
        }
      }
      
      // Paste functionality (Ctrl + V)
      if (e.ctrlKey && e.key === 'v') {
        if (copiedElement) {
          if (copiedElement.type === 'text') {
            const newPosition = [
              copiedElement.data.position[0] + 0.2,
              copiedElement.data.position[1] + 0.2,
              copiedElement.data.position[2]
            ];
            
            const newText = {
              ...copiedElement.data,
              position: newPosition
            };
            
            saveStateForUndo(texts, uploadedImages);
            setTexts(prevTexts => [...prevTexts, newText]);
          } else if (copiedElement.type === 'image') {
            const newPosition = [
              copiedElement.data.position[0] + 0.2,
              copiedElement.data.position[1] + 0.2,
              copiedElement.data.position[2]
            ];
            
            const newImage = {
              ...copiedElement.data,
              position: newPosition,
              id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            saveStateForUndo(texts, uploadedImages);
            setUploadedImages(prevImages => [...prevImages, newImage]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedTextIndex, selectedImageIndex, texts, uploadedImages, copiedElement]);

  useEffect(() => {
    // Load saved design state if it exists
    const loadSavedDesign = () => {
      try {
        const savedDesignJson = localStorage.getItem(currentEditKey);
        if (savedDesignJson) {
          const savedDesign = JSON.parse(savedDesignJson);
          
          if (savedDesign.state) {
            requestAnimationFrame(() => {
              setSelectedObject(savedDesign.state.selectedObject || "gravestone");
              setSelectedTexture(savedDesign.state.selectedTexture || "marble");
              
              setTimeout(() => {
                setTexts(savedDesign.state.texts || []);
                setUploadedImages(savedDesign.state.uploadedImages || []);
                setStoneDimensions(savedDesign.state.stoneDimensions || {
                  width: 2,
                  height: 2,
                  thickness: 0.5
                });
              }, 100);
            });
          }
        }
      } catch (error) {
        console.error('Error loading saved design:', error);
      }
    };

    loadSavedDesign();
  }, [currentEditKey]);

  useEffect(() => {
    if (initialState) {
      setSelectedObject(initialState.selectedObject || "gravestone");
      setSelectedTexture(initialState.selectedTexture || "marble");
      setTexts(initialState.texts || []);
      setUploadedImages(initialState.uploadedImages || []);
      setStoneDimensions(initialState.stoneDimensions || {
        width: 2,
        height: 2,
        thickness: 0.5,
      });
    }
  }, [initialState]);

  // Add this useEffect to store current scene state for SaveButton
  useEffect(() => {
    window.currentSceneState = {
      selectedObject,
      selectedTexture,
      texts,
      uploadedImages,
      stoneDimensions
    };
  }, [selectedObject, selectedTexture, texts, uploadedImages, stoneDimensions]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Copy functionality (Ctrl + C)
      if (e.ctrlKey && e.key === 'c') {
        if (selectedTextIndex !== null) {
          setCopiedElement({
            type: 'text',
            data: { ...texts[selectedTextIndex] }
          });
        } else if (selectedImageIndex !== null) {
          setCopiedElement({
            type: 'image',
            data: { ...uploadedImages[selectedImageIndex] }
          });
        }
      }
      
      // Paste functionality (Ctrl + V)
      if (e.ctrlKey && e.key === 'v') {
        if (copiedElement) {
          if (copiedElement.type === 'text') {
            const newPosition = [
              copiedElement.data.position[0] + 0.2,
              copiedElement.data.position[1] + 0.2,
              copiedElement.data.position[2]
            ];
            
            const newText = {
              ...copiedElement.data,
              position: newPosition
            };
            
            saveStateForUndo(texts, uploadedImages);
            setTexts(prevTexts => [...prevTexts, newText]);
          } else if (copiedElement.type === 'image') {
            const newPosition = [
              copiedElement.data.position[0] + 0.2,
              copiedElement.data.position[1] + 0.2,
              copiedElement.data.position[2]
            ];
            
            const newImage = {
              ...copiedElement.data,
              position: newPosition,
              id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            saveStateForUndo(texts, uploadedImages);
            setUploadedImages(prevImages => [...prevImages, newImage]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedTextIndex, selectedImageIndex, texts, uploadedImages, copiedElement]);

  const saveStateForUndo = (currentTexts, currentImages) => {
    // Create deep copies of the current state
    const textsCopy = JSON.parse(JSON.stringify(currentTexts));
    const imagesCopy = currentImages.map(img => ({
      ...img,
      url: img.url 
    }));

    setUndoStack(prev => [...prev, {
      texts: textsCopy,
      images: imagesCopy
    }]);
    setRedoStack([]);
  };

  const toggleRotateMode = () => {
    setRotateEnabled((prev) => !prev);
    if (!rotateEnabled) {
      setMoveEnabled(false);
    }
  };

  const handleUpdateImageRotation = (index, newRotation) => {
    saveStateForUndo(texts, uploadedImages);
    setUploadedImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, rotation: newRotation } : img))
    );
  };

  const toggleMoveMode = () => {
    setMoveEnabled((prev) => !prev);
    if (!moveEnabled) {
      setRotateEnabled(false);
    }
  };

  const handleUpdateImageSize = (index, newSize) => {
    setUploadedImages(prevImages => 
      prevImages.map((img, i) => 
        i === index 
          ? { ...img, size: newSize }
          : img
      )
    );
  };

  const handleAddText = (textConfig) => {
    const initialPosition = [0, 0, selectedObject === "gravestone" ? 0.31 : 0.11];
    const newTextConfig = {
      ...textConfig,
      position: initialPosition,
      isCylindrical: selectedObject === "Urns",
      id: `text_${Date.now()}` // Add unique ID for tracking
    };
    
    // Save current state before adding
    saveStateToHistory('add_text');
    
    setTexts((prevTexts) => [...prevTexts, newTextConfig]);
    setMoveEnabled(true);
    setSelectedTextIndex(texts.length); // Select the newly added text
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const currentState = {
      texts: JSON.parse(JSON.stringify(texts)),
      images: uploadedImages.map(img => ({
        ...img,
        url: img.url
      })),
      actionType: 'undo',
      timestamp: Date.now()
    };

    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, currentState]);
    
    // Apply the previous state
    setTexts(previousState.texts);
    setUploadedImages(previousState.images);
    setUndoStack(prev => prev.slice(0, -1));
    
    // Clear selections
    setSelectedTextIndex(null);
    setSelectedImageIndex(null);
    
    // Notify user of the undone action
    switch (previousState.actionType) {
      case 'add_text':
        notifySuccess("Undid text addition");
        break;
      case 'add_image':
        notifySuccess("Undid image addition");
        break;
      case 'remove':
        notifySuccess("Undid removal");
        break;
      default:
        notifySuccess("Undid last action");
    }
  };

  // Updated handleRedo
  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const currentState = {
      texts: JSON.parse(JSON.stringify(texts)),
      images: uploadedImages.map(img => ({
        ...img,
        url: img.url
      })),
      actionType: 'redo',
      timestamp: Date.now()
    };

    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, currentState]);
    
    // Apply the next state
    setTexts(nextState.texts);
    setUploadedImages(nextState.images);
    setRedoStack(prev => prev.slice(0, -1));
    
    // Clear selections
    setSelectedTextIndex(null);
    setSelectedImageIndex(null);
    
    // Notify user of the redone action
    switch (nextState.actionType) {
      case 'add_text':
        notifySuccess("Redid text addition");
        break;
      case 'add_image':
        notifySuccess("Redid image addition");
        break;
      case 'remove':
        notifySuccess("Redid removal");
        break;
      default:
        notifySuccess("Redid last action");
    }
  };

  const handleImageUpload = (imageDataUrl) => {
    const img = new Image();
    img.onload = () => {
      // Save current state before adding new image
      saveStateToHistory('add_image');
      
      const newImage = {
        url: imageDataUrl,
        position: [0, 0, getZOffset(selectedObject, stoneDimensions.thickness)],
        size: [1, 1],
        id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        width: img.width,
        height: img.height,
      };
      
      setUploadedImages(prevImages => [...prevImages, newImage]);
      setSelectedImageIndex(uploadedImages.length); // Select the newly added image
    };
    img.onerror = () => {
      notifyError("Invalid image format");
    };
    img.src = imageDataUrl;
  };

  const getZOffset = (objectType, thickness = 0.5) => {
    switch (objectType) {
      case "gravestone":
        return thickness / 2 + 0.01;
      case "table-signs":
        return thickness / 2 + 0.01;
      case "base":
        return 0.21;
      default:
        return 0.2;
    }
  };

  const handleDimensionChange = (dimension, value) => {
    const newDimensions = {
      ...stoneDimensions,
      [dimension]: parseFloat(value),
    };
    setStoneDimensions(newDimensions);
    setUploadedImages((prevImages) =>
      prevImages.map((image) => ({
        ...image,
        position: [
          image.position[0],
          image.position[1],
          getZOffset(selectedObject, newDimensions.thickness),
        ],
      }))
    );
  };

  const toggleRemoveMode = () => {
    setRemoveEnabled((prev) => !prev);
    // Disable other modes when remove mode is active
    if (!removeEnabled) {
      setMoveEnabled(false);
      setRotateEnabled(false);
    }
  };

  const handleUpdateImagePosition = (index, newPosition) => {
    saveStateToHistory('move_image');
    setUploadedImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, position: newPosition } : img))
    );
  };

  const handleRemoveElement = () => {
    // Save current state before removal
    saveStateToHistory('remove');

    // Remove selected text
    if (selectedTextIndex !== null) {
      setTexts(prevTexts =>
        prevTexts.filter((_, index) => index !== selectedTextIndex)
      );
      setSelectedTextIndex(null);
    }

    // Remove selected image
    if (selectedImageIndex !== null) {
      setUploadedImages(prevImages =>
        prevImages.filter((_, index) => index !== selectedImageIndex)
      );
      setSelectedImageIndex(null);
    }

    setRemoveEnabled(false);
  };

  const handleUpdateText = (index, newText) => {
    setTexts(prev => prev.map((text, i) => 
      i === index ? { ...text, text: newText } : text
    ));
  };
        
  const ErrorFallback = ({ error }) => (
    <div className="error-fallback p-4 text-red-600">
      <h2>Something went wrong with the 3D rendering</h2>
      <pre>{error?.message}</pre>
      <button 
        onClick={() => window.location.reload()}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Reload
      </button>
    </div>
  );

  return (
    <div className="flex gap-6">
      <div className="relative canvas-container" ref={containerRef}>
        <div className="h-[500px] bg-[#D3D3D3] rounded-lg w-[500px] border-2 border-[#2F424B]">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Canvas
              ref={canvasRef}
              camera={{ position: [0, 0, 5], fov: 75 }}
              onCreated={({ gl, scene }) => {
                sceneRef.current = scene;
                gl.setClearColor('#D3D3D3', 1);
                
                // Optimize WebGL context
                gl.powerPreference = "high-performance";
                gl.antialias = true;
                gl.autoClear = true;
                gl.pixelRatio = Math.min(window.devicePixelRatio, 2); // Limit pixel ratio
                
                // Store the GL context reference
                canvasRef.current = { gl, scene };
              }}
              frameloop="demand"
              gl={{
                preserveDrawingBuffer: true,
                antialias: true,
                powerPreference: "high-performance",
                failIfMajorPerformanceCaveat: false,
                alpha: false,
                stencil: false, // Disable stencil buffer if not needed
                depth: true,
                logarithmicDepthBuffer: false
              }}
            >
              
              <Suspense fallback={null}>
                <Scene
                  selectedObject={selectedObject}
                  selectedTexture={selectedTexture}
                  texts={texts}
                  setTexts={setTexts}
                  onUpdateTextPosition={handleUpdateTextPosition}
                  moveEnabled={moveEnabled}
                  uploadedImages={uploadedImages}
                  setUploadedImages={setUploadedImages}
                  stoneDimensions={stoneDimensions}
                  onUpdateImagePosition={handleUpdateImagePosition}
                  selectedImageIndex={selectedImageIndex}
                  setSelectedImageIndex={setSelectedImageIndex}
                  onUpdateImageSize={handleUpdateImageSize}
                  rotateEnabled={rotateEnabled}
                  onUpdateImageRotation={handleUpdateImageRotation}
                  removeEnabled={removeEnabled}
                  selectedTextIndex={selectedTextIndex}
                  setSelectedTextIndex={setSelectedTextIndex}
                  isSceneLocked={isSceneLocked}
                  onUpdateText={handleUpdateText}
                  onUpdateTextHeight={handleUpdateTextHeight}
                />
                <Preload all />
              </Suspense>
            </Canvas>
          </ErrorBoundary>
        </div>

        <style>{`
          .filter-white { 
            filter: brightness(0) invert(1);
          }
        `}</style>

        <div className="absolute top-4 left-4 flex gap-2 bg-[#2F424B] p-2 rounded-lg">
          {[
            { id: "gravestone", label: "Gravestone" },
            { id: "base", label: "Base" },
            { id: "Urns", label: "Urn" },
            { id: "table-signs", label: "Table Signs" },
          ].map(({ id, label }) => (
            <Tooltip key={id} text={label}>
              <button
                className="w-8 h-8 cursor-pointer hover:opacity-80"
                onClick={() => setSelectedObject(id)}
              >
                <img
                  src={`/assets/${id}.svg`}
                  alt={label}
                  className="w-full h-full filter-white"
                />
              </button>
            </Tooltip>
          ))}
        </div>

        <DimensionControls 
          stoneDimensions={stoneDimensions}
          onDimensionChange={handleDimensionChange}
          selectedObject={selectedObject}
        />

        <SaveButton user={user} />
        <LockScene 
          isLocked={isSceneLocked}
          onToggleLock={() => setIsSceneLocked(prev => !prev)}
        />
        <StyleTools
          selectedObject={selectedObject}
          selectedTexture={selectedTexture}
          setSelectedTexture={setSelectedTexture}
          onImageUpload={handleImageUpload}
          uploadedImage={uploadedImages}
        />
        <ManipulationTools
          onAddText={handleAddText}
          rotateEnabled={rotateEnabled} 
          toggleRotateMode={toggleRotateMode}
          moveEnabled={moveEnabled}
          toggleMoveMode={toggleMoveMode}
          removeEnabled={removeEnabled}
          toggleRemoveMode={toggleRemoveMode}
          onRemoveElement={handleRemoveElement} 
        />

        <UndoRedo onUndo={handleUndo} onRedo={handleRedo} />

      </div>
      <Instructions/>
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    notifyError("Rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <this.props.FallbackComponent />;
    }

    return this.props.children;
  }
}


export default PreviewArea;