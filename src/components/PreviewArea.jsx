import React, { useState, useRef, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import Tooltip from "../components/Tooltip";
import ManipulationTools from "../components/ManipulationTools";
import UndoRedo from "../components/UndoRedo";
import StyleTools from "../components/StyleTools";
import Scene from "../components/Scene";
import DimensionControls from "../components/DimensionControls";
import Materials from "./Materials";
import Frames from "./Frames";
import SaveButton from "./SaveButton";

const PreviewArea = () => {
  const [selectedObject, setSelectedObject] = useState("gravestone");
  const [selectedTexture, setSelectedTexture] = useState("marble");
  const [texts, setTexts] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [moveEnabled, setMoveEnabled] = useState(false);
  const canvasRef = useRef();
  const containerRef = useRef();
  const sceneRef = useRef();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedTextIndex, setSelectedTextIndex] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [rotateEnabled, setRotateEnabled] = useState(false);
  const [removeEnabled, setRemoveEnabled] = useState(false);
  const [copiedText, setCopiedText] = useState(null);
  const [copiedImage, setCopiedImage] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [isFrameSelectionOpen, setIsFrameSelectionOpen] = useState(false);
  
  const [stoneDimensions, setStoneDimensions] = useState({
    width: 2,
    height: 2,
    thickness: 0.5,
  });
  
  // Generalized method to save state for undo
  const saveStateForUndo = (currentTexts, currentImages) => {
    setUndoStack(prev => [...prev, { texts: currentTexts, images: currentImages }]);
    setRedoStack([]); // Clear redo stack when a new action is performed
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

  const handleRemoveImage = () => {
    if (selectedImageIndex !== null) {
      // Save current state before removing image
      saveStateForUndo(texts, uploadedImages);

      setUploadedImages((prevImages) =>
        prevImages.filter((_, index) => index !== selectedImageIndex)
      );
      setSelectedImageIndex(null);
    }
  };

  const toggleMoveMode = () => {
    setMoveEnabled((prev) => !prev);
    if (!moveEnabled) {
      setRotateEnabled(false);
    }
  };

  
  const handleUpdateImageSize = (index, newSize) => {
    saveStateForUndo(texts, uploadedImages);

    setUploadedImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, size: newSize } : img))
    );
  };

  const handleAddText = (textConfig) => {
    const initialPosition = [
      0, 
      0, 
      selectedObject === 'gravestone' ? 0.31 : 0.11
    ];
    
    const newTextConfig = { 
      ...textConfig, 
      position: initialPosition,
    };
  
    // Save current state before adding text
    saveStateForUndo(texts, uploadedImages);
    
    setTexts((prevTexts) => [...prevTexts, newTextConfig]);
    
    // Automatically enable move mode after adding text
    setMoveEnabled(true);
  };
  
  const handleRemoveText = () => {
    if (selectedTextIndex !== null) {
      // Save current state before removing text
      saveStateForUndo(texts, uploadedImages);
  
      setTexts((prevTexts) =>
        prevTexts.filter((_, index) => index !== selectedTextIndex)
      );
      setSelectedTextIndex(null);
    }
  };
  

  const handleUpdateTextPosition = (index, newPosition) => {
    // Save current state before updating position
    saveStateForUndo(texts, uploadedImages);

    setTexts((prevTexts) =>
      prevTexts.map((text, i) =>
        i === index ? { ...text, position: newPosition } : text
      )
    );
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    
    // Push current state to redo stack
    setRedoStack(prev => [...prev, { texts, images: uploadedImages }]);
    
    // Restore previous state
    setTexts(previousState.texts);
    setUploadedImages(previousState.images);
    
    // Remove the last state from undo stack
    setUndoStack(undoStack.slice(0, -1));
  };

  // Modify handleRedo to restore both texts and images
  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    
    // Push current state to undo stack
    setUndoStack(prev => [...prev, { texts, images: uploadedImages }]);
    
    // Restore next state
    setTexts(nextState.texts);
    setUploadedImages(nextState.images);
    
    // Remove the last state from redo stack
    setRedoStack(redoStack.slice(0, -1));
  };

  const handleImageUpload = (imageDataUrl) => {
    // Validate image upload
    if (uploadedImages.length >= 10) {  // Increased from 5 to 10
      alert("Maximum of 10 images allowed");
      return;
    }
  
    // Create a new Image to validate and preload the image
    const img = new Image();
    img.onload = () => {
      const newImage = { 
        url: imageDataUrl, 
        position: [0, 0, getZOffset(selectedObject, stoneDimensions.thickness)],
        size: [1, 1], // Default size
        id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID
        width: img.width,
        height: img.height
      };
  
      // Save current state before adding image
      saveStateForUndo(texts, uploadedImages);
  
      setUploadedImages((prevImages) => [...prevImages, newImage]);
    };
    img.onerror = () => {
      console.error("Invalid image");
      alert("Invalid image. Please upload a supported image format.");
    };
    img.src = imageDataUrl;
  };

  const handleImageSelect = (imageData) => {
    setUploadedImages(prev => [...prev, imageData]);
  };

  const ErrorFallback = () => (
    <div className="error-fallback">
      <h2>Something went wrong with the 3D rendering</h2>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  );

  
  // Updated getZOffset to consider thickness
  const getZOffset = (objectType, thickness = 0.5) => {
    switch (objectType) {
      case "gravestone": 
        return thickness / 2 + 0.01; // Slightly in front of the stone's surface
      case "table-signs": 
        return thickness / 2 + 0.01; // Slightly in front of the sign's surface
      case "base": 
        return 0.21;
      default: 
        return 0.2;
    }
  };

  // Updated handleDimensionChange method
  const handleDimensionChange = (dimension, value) => {
    const newDimensions = {
      ...stoneDimensions,
      [dimension]: parseFloat(value)
    };
    setStoneDimensions(newDimensions);

    // Adjust Z-position of images based on object type and thickness
    setUploadedImages(prevImages => 
      prevImages.map(image => ({
        ...image,
        position: [
          image.position[0], 
          image.position[1], 
          getZOffset(selectedObject, newDimensions.thickness)
        ]
      }))
    );
  };

  const handleUpdateImagePosition = (index, newPosition) => {
    saveStateForUndo(texts, uploadedImages);

    setUploadedImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, position: newPosition } : img))
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

  // Consolidated remove element method
  const handleRemoveElement = () => {
    // Remove selected text
    if (selectedTextIndex !== null) {
      setTexts((prevTexts) =>
        prevTexts.filter((_, index) => index !== selectedTextIndex)
      );
      setSelectedTextIndex(null);
    }

    // Remove selected image
    if (selectedImageIndex !== null) {
      setUploadedImages((prevImages) =>
        prevImages.filter((_, index) => index !== selectedImageIndex)
      );
      setSelectedImageIndex(null);
    }

    // Disable remove mode after removal
    setRemoveEnabled(false);
  };

  // Copy functionality
  const handleCopy = (type) => {
    if (type === 'text' && selectedTextIndex !== null) {
      setCopiedText(texts[selectedTextIndex]);
    } else if (type === 'image' && selectedImageIndex !== null) {
      setCopiedImage(uploadedImages[selectedImageIndex]);
    }
  };

  // Paste functionality
  const handlePaste = (type) => {
    if (type === 'text' && copiedText) {
      // Create a new text with a slight offset
      const newText = {
        ...copiedText,
        position: [
          copiedText.position[0] + 0.2, 
          copiedText.position[1] + 0.2, 
          copiedText.position[2]
        ]
      };
      handleAddText(newText);
    } else if (type === 'image' && copiedImage) {
      // Create a new image with a slight offset
      const newImage = {
        ...copiedImage,
        position: [
          copiedImage.position[0] + 0.2, 
          copiedImage.position[1] + 0.2, 
          getZOffset(selectedObject)
        ]
      };
      setUploadedImages(prev => [...prev, newImage]);
    }
  };

  // Add global key event listener for copy-paste
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for Ctrl/Cmd + C (Copy)
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        if (selectedTextIndex !== null) {
          handleCopy('text');
        } else if (selectedImageIndex !== null) {
          handleCopy('image');
        }
      }
      
      // Check for Ctrl/Cmd + V (Paste)
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        if (copiedText) {
          handlePaste('text');
        } else if (copiedImage) {
          handlePaste('image');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedTextIndex, selectedImageIndex, copiedText, copiedImage]);
  
  const handleFrameSelect = (frameType) => {
    setSelectedFrame(frameType);
    
    // Add a new frame to the scene
    const newFrame = {
      id: `frame-${Date.now()}`,
      type: frameType,
      position: [0, 0, stoneDimensions.thickness / 2 + 0.02], // Positioned slightly in front of the stone
      size: frameType === 'oval' 
        ? [0.6, 0.3]  // Wider than tall for oval
        : frameType === 'circle' 
        ? [0.4, 0.4]  // Equal dimensions for circle
        : frameType === 'rectangle' 
        ? [0.65, 0.5] // Wider rectangle
        : [0.4, 0.4], // Default square
      rotation: 0
    };
  
    setFrames([...frames, newFrame]);
    setIsFrameSelectionOpen(false);
  };

  const toggleFrameSelection = () => {
    setIsFrameSelectionOpen(!isFrameSelectionOpen);
  };

  const [frames, setFrames] = useState([
    { type: "oval", position: [0, 0, 0], rotation: 0 },
  ]);
  
  const onUpdateFrameRotation = (index, rotation) => {
    setFrames((prevFrames) =>
      prevFrames.map((frame, i) =>
        i === index ? { ...frame, rotation } : frame
      )
    );
  };
  

  return (
    <div className="col-span-8">
      <div className="relative canvas-container" ref={containerRef}>
        <div className="h-[500px] bg-[#D3D3D3] rounded-lg w-full border-2 border-[#2F424B]">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Canvas
              ref={canvasRef}
              camera={{ position: [0, 0, 5], fov: 75 }}
              onCreated={(state) => {
                sceneRef.current = state.scene;
              }}
              frameloop="demand"  // Optimize rendering
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
                selectedFrame={selectedFrame}
                frames={frames}
                setFrames={setFrames}
                setSelectedFrame={setSelectedFrame}
                onUpdateFrameRotation={onUpdateFrameRotation}
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

        <SaveButton/>
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

        <Frames onFrameSelect={handleFrameSelect}
        selectedFrame={selectedFrame}
        isFrameSelectionOpen={isFrameSelectionOpen}
        toggleFrameSelection={toggleFrameSelection}
        />
        <Materials onImageSelect={handleImageSelect}/>
      </div>
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
    console.error("Rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <this.props.FallbackComponent />;
    }

    return this.props.children;
  }
}

export default PreviewArea;