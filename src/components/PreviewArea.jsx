import { Preload } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import DimensionControls from "../components/DimensionControls";
import Instructions from "../components/Instructions.jsx";
import ManipulationTools from "../components/ManipulationTools";
import Scene from "../components/Scene";
import StyleTools from "../components/StyleTools";
import Tooltip from "../components/Tooltip";
import UndoRedo from "../components/UndoRedo";
import { notifyError, notifySuccess } from "../general/CustomToast.js";
import { useAuth } from "./AuthContext.jsx";
import Frame from "./Frame.jsx";
import LayerPanel from "./LayerPanel.jsx";
import LockScene from "./LockScene.jsx";
import SaveButton from "./SaveButton";

const PreviewArea = (initialState) => {
  const location = useLocation();
  const isOwner = location.pathname.includes("/owner");
  const currentEditKey = isOwner
    ? "currentEditDesign"
    : "currentCustomerEditDesign";
  const initialStateLoadedRef = useRef(false);

  // Initialize states
  const [isLoading, setIsLoading] = useState(true);
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
  const [layerOrder, setLayerOrder] = useState([]);
  const [visibleLayers, setVisibleLayers] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [selectedShape, setSelectedShape] = useState(null);
  const [framePosition, setFramePosition] = useState([0, 0, 0.26]);
  const [frames, setFrames] = useState([]);
  const [selectedFrameId, setSelectedFrameId] = useState(null);
  const { user } = useAuth();

  const canvasRef = useRef();
  const containerRef = useRef();
  const sceneRef = useRef();

  const [stoneDimensions, setStoneDimensions] = useState({
    width: 2,
    height: 2,
    thickness: 0.5,
  });

  const handleUpdateFrameSize = (frameId, newSize) => {
    setFrames((prevFrames) =>
      prevFrames.map((frame) =>
        frame.id === frameId ? { ...frame, size: newSize } : frame
      )
    );
  };

  const handleUpdateFramePosition = (frameId, newPosition) => {
    setFrames((prevFrames) =>
      prevFrames.map((frame) =>
        frame.id === frameId ? { ...frame, position: newPosition } : frame
      )
    );
  };

  const handleClearFrames = () => {
    setFrames([]);
    setSelectedFrameId(null);
  };

  const handleFramePositionUpdate = (newPosition) => {
    setFramePosition(newPosition);
  };

  useEffect(() => {
    console.log("Selected shape changed to:", selectedShape);
  }, [selectedShape]);

  useEffect(() => {
    const initializeLayers = () => {
      const initialLayers = [
        { id: "texture", type: "texture" },
        ...uploadedImages.map((img) => ({
          id: `image-${img.id}`,
          type: "image",
          data: img,
        })),
        ...texts.map((text) => ({
          id: `text-${text.id}`,
          type: "text",
          data: text,
        })),
      ];
      setLayerOrder(initialLayers);
      setVisibleLayers(initialLayers.map((layer) => layer.id));
    };

    initializeLayers();
  }, []);

  // Update layer order when new elements are added
  useEffect(() => {
    const updateLayers = () => {
      const currentLayerIds = new Set(layerOrder.map((layer) => layer.id));

      // Add new images
      uploadedImages.forEach((img) => {
        const layerId = `image-${img.id}`;
        if (!currentLayerIds.has(layerId)) {
          setLayerOrder((prev) => [
            ...prev,
            {
              id: layerId,
              type: "image",
              data: img,
            },
          ]);
          setVisibleLayers((prev) => [...prev, layerId]);
        }
      });

      // Add new texts
      texts.forEach((text) => {
        const layerId = `text-${text.id}`;
        if (!currentLayerIds.has(layerId)) {
          setLayerOrder((prev) => [
            ...prev,
            {
              id: layerId,
              type: "text",
              data: text,
            },
          ]);
          setVisibleLayers((prev) => [...prev, layerId]);
        }
      });
    };

    updateLayers();
  }, [texts, uploadedImages]);

  const handleLayerReorder = (newLayers) => {
    setLayerOrder(newLayers);
  };

  const handleLayerSelect = (layerId) => {
    setSelectedLayer(layerId);

    // Update selected text or image based on layer type
    const layer = layerOrder.find((l) => l.id === layerId);
    if (layer) {
      if (layer.type === "text") {
        const textIndex = texts.findIndex(
          (text) => `text-${text.id}` === layerId
        );
        setSelectedTextIndex(textIndex);
        setSelectedImageIndex(null);
      } else if (layer.type === "image") {
        const imageIndex = uploadedImages.findIndex(
          (img) => `image-${img.id}` === layerId
        );
        setSelectedImageIndex(imageIndex);
        setSelectedTextIndex(null);
      }
    }
  };

  const handleLayerVisibilityToggle = (layerId) => {
    setVisibleLayers((prev) =>
      prev.includes(layerId)
        ? prev.filter((id) => id !== layerId)
        : [...prev, layerId]
    );
  };

  useEffect(() => {
    // Load saved design state if it exists
    const loadSavedDesign = () => {
      try {
        const savedDesignJson = localStorage.getItem(currentEditKey);
        if (savedDesignJson) {
          const savedDesign = JSON.parse(savedDesignJson);

          if (savedDesign.state) {
            requestAnimationFrame(() => {
              setSelectedObject(
                savedDesign.state.selectedObject || "gravestone"
              );
              setSelectedTexture(savedDesign.state.selectedTexture || "marble");

              setTimeout(() => {
                setTexts(savedDesign.state.texts || []);
                setUploadedImages(savedDesign.state.uploadedImages || []);
                setStoneDimensions(
                  savedDesign.state.stoneDimensions || {
                    width: 2,
                    height: 2,
                    thickness: 0.5,
                  }
                );
              }, 100);
            });
          }
        }
      } catch (error) {
        console.error("Error loading saved design:", error);
      }
    };

    loadSavedDesign();
  }, [currentEditKey]);

  const verifyImageUrl = async (url, timeout = 5000) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn(`Image verification failed for ${url}:`, error);
      return false;
    }
  };

  const loadSavedDesign = useCallback(async () => {
    if (initialStateLoadedRef.current) return;

    try {
      setIsLoading(true);
      const savedDesignJson = localStorage.getItem(currentEditKey);

      if (savedDesignJson) {
        const savedDesign = JSON.parse(savedDesignJson);

        if (savedDesign.state) {
          // Create a batch of state updates
          const stateUpdates = {
            selectedObject: savedDesign.state.selectedObject || "gravestone",
            selectedTexture: savedDesign.state.selectedTexture || "marble",
            stoneDimensions: savedDesign.state.stoneDimensions || {
              width: 2,
              height: 2,
              thickness: 0.5,
            },
            texts: Array.isArray(savedDesign.state.texts)
              ? savedDesign.state.texts
              : [],
          };

          // Handle uploaded images
          if (Array.isArray(savedDesign.state.uploadedImages)) {
            const verifiedImages = await Promise.all(
              savedDesign.state.uploadedImages.map(async (img) => {
                if (img.data && typeof img.data === "string") {
                  const isValid = await verifyImageUrl(img.data);
                  return isValid ? img : null;
                }
                return null;
              })
            );
            stateUpdates.uploadedImages = verifiedImages.filter(
              (img) => img !== null
            );
          }

          // Apply all state updates at once
          setSelectedObject(stateUpdates.selectedObject);
          setSelectedTexture(stateUpdates.selectedTexture);
          setStoneDimensions(stateUpdates.stoneDimensions);
          setTexts(stateUpdates.texts);
          if (stateUpdates.uploadedImages) {
            setUploadedImages(stateUpdates.uploadedImages);
          }

          // Save the initial state to prevent unwanted resets
          window.currentSceneState = {
            ...stateUpdates,
            uploadedImages: stateUpdates.uploadedImages || [],
          };

          initialStateLoadedRef.current = true;
        }
      }
    } catch (error) {
      console.error("Error loading saved design:", error);
      notifyError(
        "Error loading saved design. Some elements might be missing."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentEditKey]);

  // Handle initial state from props
  useEffect(() => {
    if (!initialStateLoadedRef.current) {
      if (initialState && Object.keys(initialState).length > 0) {
        const loadInitialState = async () => {
          setIsLoading(true);
          try {
            const stateUpdates = {
              selectedObject: initialState.selectedObject || "gravestone",
              selectedTexture: initialState.selectedTexture || "marble",
              stoneDimensions: initialState.stoneDimensions || {
                width: 2,
                height: 2,
                thickness: 0.5,
              },
              texts: Array.isArray(initialState.texts)
                ? initialState.texts
                : [],
            };

            if (Array.isArray(initialState.uploadedImages)) {
              const verifiedImages = await Promise.all(
                initialState.uploadedImages.map(async (img) => {
                  if (img.data && typeof img.data === "string") {
                    const isValid = await verifyImageUrl(img.data);
                    return isValid ? img : null;
                  }
                  return null;
                })
              );
              stateUpdates.uploadedImages = verifiedImages.filter(
                (img) => img !== null
              );
            }

            // Apply all state updates
            setSelectedObject(stateUpdates.selectedObject);
            setSelectedTexture(stateUpdates.selectedTexture);
            setStoneDimensions(stateUpdates.stoneDimensions);
            setTexts(stateUpdates.texts);
            if (stateUpdates.uploadedImages) {
              setUploadedImages(stateUpdates.uploadedImages);
            }

            window.currentSceneState = {
              ...stateUpdates,
              uploadedImages: stateUpdates.uploadedImages || [],
            };

            initialStateLoadedRef.current = true;
          } catch (error) {
            console.error("Error loading initial state:", error);
            notifyError(
              "Error loading initial state. Some elements might be missing."
            );
          } finally {
            setIsLoading(false);
          }
        };

        loadInitialState();
      } else {
        loadSavedDesign();
      }
    }
  }, [initialState, loadSavedDesign]);

  // Update window.currentSceneState only when states actually change
  useEffect(() => {
    if (!isLoading && initialStateLoadedRef.current) {
      window.currentSceneState = {
        selectedObject,
        selectedTexture,
        texts,
        uploadedImages,
        stoneDimensions,
      };
    }
  }, [
    selectedObject,
    selectedTexture,
    texts,
    uploadedImages,
    stoneDimensions,
    isLoading,
  ]);

  const handleUpdateTextHeight = (index, newHeight) => {
    setTexts((prevTexts) =>
      prevTexts.map((text, i) =>
        i === index ? { ...text, height: newHeight } : text
      )
    );
  };

  const handleUpdateTextPosition = (index, newPosition) => {
    saveStateToHistory("move_text");
    setTexts((prevTexts) =>
      prevTexts.map((text, i) =>
        i === index ? { ...text, position: newPosition } : text
      )
    );
  };

  const saveStateToHistory = useCallback(
    (actionType = "update") => {
      const currentState = {
        texts: JSON.parse(JSON.stringify(texts)),
        images: uploadedImages.map((img) => ({
          ...img,
          url: img.url,
        })),
        actionType, // Track what type of action was performed
        timestamp: Date.now(),
      };

      setUndoStack((prev) => [...prev, currentState]);
      // Clear redo stack when a new action is performed
      setRedoStack([]);
    },
    [texts, uploadedImages]
  );

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Escape key handler for deselection
      if (e.key === "Escape") {
        setSelectedTextIndex(null);
        setSelectedImageIndex(null);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if (
        (e.ctrlKey || e.metaKey) &&
        ((e.key === "z" && e.shiftKey) || e.key === "y")
      ) {
        e.preventDefault();
        handleRedo();
      }

      // Copy functionality (Ctrl + C)
      if (e.ctrlKey && e.key === "c") {
        if (selectedTextIndex !== null) {
          setCopiedElement({
            type: "text",
            data: { ...texts[selectedTextIndex] },
          });
        } else if (selectedImageIndex !== null) {
          setCopiedElement({
            type: "image",
            data: { ...uploadedImages[selectedImageIndex] },
          });
        }
      }

      // Paste functionality (Ctrl + V)
      if (e.ctrlKey && e.key === "v") {
        if (copiedElement) {
          if (copiedElement.type === "text") {
            const newPosition = [
              copiedElement.data.position[0] + 0.2,
              copiedElement.data.position[1] + 0.2,
              copiedElement.data.position[2],
            ];

            const newText = {
              ...copiedElement.data,
              position: newPosition,
            };

            saveStateForUndo(texts, uploadedImages);
            setTexts((prevTexts) => [...prevTexts, newText]);
          } else if (copiedElement.type === "image") {
            const newPosition = [
              copiedElement.data.position[0] + 0.2,
              copiedElement.data.position[1] + 0.2,
              copiedElement.data.position[2],
            ];

            const newImage = {
              ...copiedElement.data,
              position: newPosition,
              id: `image_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            };

            saveStateForUndo(texts, uploadedImages);
            setUploadedImages((prevImages) => [...prevImages, newImage]);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    selectedTextIndex,
    selectedImageIndex,
    texts,
    uploadedImages,
    copiedElement,
  ]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Copy functionality (Ctrl + C)
      if (e.ctrlKey && e.key === "c") {
        if (selectedTextIndex !== null) {
          setCopiedElement({
            type: "text",
            data: { ...texts[selectedTextIndex] },
          });
        } else if (selectedImageIndex !== null) {
          setCopiedElement({
            type: "image",
            data: { ...uploadedImages[selectedImageIndex] },
          });
        }
      }

      // Paste functionality (Ctrl + V)
      if (e.ctrlKey && e.key === "v") {
        if (copiedElement) {
          if (copiedElement.type === "text") {
            const newPosition = [
              copiedElement.data.position[0] + 0.2,
              copiedElement.data.position[1] + 0.2,
              copiedElement.data.position[2],
            ];

            const newText = {
              ...copiedElement.data,
              position: newPosition,
            };

            saveStateForUndo(texts, uploadedImages);
            setTexts((prevTexts) => [...prevTexts, newText]);
          } else if (copiedElement.type === "image") {
            const newPosition = [
              copiedElement.data.position[0] + 0.2,
              copiedElement.data.position[1] + 0.2,
              copiedElement.data.position[2],
            ];

            const newImage = {
              ...copiedElement.data,
              position: newPosition,
              id: `image_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            };

            saveStateForUndo(texts, uploadedImages);
            setUploadedImages((prevImages) => [...prevImages, newImage]);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    selectedTextIndex,
    selectedImageIndex,
    texts,
    uploadedImages,
    copiedElement,
  ]);

  const saveStateForUndo = (currentTexts, currentImages) => {
    // Create deep copies of the current state
    const textsCopy = JSON.parse(JSON.stringify(currentTexts));
    const imagesCopy = currentImages.map((img) => ({
      ...img,
      url: img.url,
    }));

    setUndoStack((prev) => [
      ...prev,
      {
        texts: textsCopy,
        images: imagesCopy,
      },
    ]);
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
      prev.map((img, i) =>
        i === index ? { ...img, rotation: newRotation } : img
      )
    );
  };

  const toggleMoveMode = () => {
    setMoveEnabled((prev) => !prev);
    if (!moveEnabled) {
      setRotateEnabled(false);
    }
  };

  const handleUpdateImageSize = (index, newSize) => {
    setUploadedImages((prevImages) =>
      prevImages.map((img, i) =>
        i === index ? { ...img, size: newSize } : img
      )
    );
  };

  const handleAddText = (textConfig) => {
    const initialPosition = [
      0,
      0,
      selectedObject === "gravestone" ? 0.31 : 0.11,
    ];
    const newTextConfig = {
      ...textConfig,
      position: initialPosition,
      isCylindrical: selectedObject === "Urns",
      id: `text_${Date.now()}`, // Add unique ID for tracking
    };

    // Save current state before adding
    saveStateToHistory("add_text");

    setTexts((prevTexts) => [...prevTexts, newTextConfig]);
    setMoveEnabled(true);
    setSelectedTextIndex(texts.length); // Select the newly added text
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const currentState = {
      texts: JSON.parse(JSON.stringify(texts)),
      images: uploadedImages.map((img) => ({
        ...img,
        url: img.url,
      })),
      actionType: "undo",
      timestamp: Date.now(),
    };

    const previousState = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, currentState]);

    // Apply the previous state
    setTexts(previousState.texts);
    setUploadedImages(previousState.images);
    setUndoStack((prev) => prev.slice(0, -1));

    // Clear selections
    setSelectedTextIndex(null);
    setSelectedImageIndex(null);

    // Notify user of the undone action
    switch (previousState.actionType) {
      case "add_text":
        notifySuccess("Undid text addition");
        break;
      case "add_image":
        notifySuccess("Undid image addition");
        break;
      case "remove":
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
      images: uploadedImages.map((img) => ({
        ...img,
        url: img.url,
      })),
      actionType: "redo",
      timestamp: Date.now(),
    };

    const nextState = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, currentState]);

    // Apply the next state
    setTexts(nextState.texts);
    setUploadedImages(nextState.images);
    setRedoStack((prev) => prev.slice(0, -1));

    // Clear selections
    setSelectedTextIndex(null);
    setSelectedImageIndex(null);

    // Notify user of the redone action
    switch (nextState.actionType) {
      case "add_text":
        notifySuccess("Redid text addition");
        break;
      case "add_image":
        notifySuccess("Redid image addition");
        break;
      case "remove":
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
      saveStateToHistory("add_image");

      const newImage = {
        url: imageDataUrl,
        position: [0, 0, getZOffset(selectedObject, stoneDimensions.thickness)],
        size: [1, 1],
        id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        width: img.width,
        height: img.height,
      };

      setUploadedImages((prevImages) => [...prevImages, newImage]);
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
    saveStateToHistory("move_image");
    setUploadedImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, position: newPosition } : img
      )
    );
  };

  const handleRemoveElement = () => {
    // Save current state before removal
    saveStateToHistory("remove");

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

    setRemoveEnabled(false);
  };

  const handleUpdateText = (index, newText) => {
    setTexts((prev) =>
      prev.map((text, i) => (i === index ? { ...text, text: newText } : text))
    );
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
    <div className="flex gap-6 h-full">
      <div className="relative w-full">
        <div className="relative canvas-container" ref={containerRef}>
          <div className="aspect-[4/3] w-full h-[600px] bg-[#D3D3D3] rounded-lg border-2 border-[#2F424B]">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Canvas
                ref={canvasRef}
                camera={{ position: [0, 0, 5], fov: 75 }}
                style={{ width: "100%", height: "100%" }}
                onCreated={({ gl, scene }) => {
                  sceneRef.current = scene;
                  gl.setClearColor("#D3D3D3", 1);
                  gl.powerPreference = "high-performance";
                  gl.antialias = true;
                  gl.autoClear = true;
                  gl.pixelRatio = Math.min(window.devicePixelRatio, 2);
                  canvasRef.current = { gl, scene };
                }}
                frameloop="demand"
                gl={{
                  preserveDrawingBuffer: true,
                  antialias: true,
                  powerPreference: "high-performance",
                  failIfMajorPerformanceCaveat: false,
                  alpha: false,
                  stencil: false,
                  depth: true,
                  logarithmicDepthBuffer: false,
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
                    layerOrder={layerOrder}
                    visibleLayers={visibleLayers}
                    selectedShape={selectedShape}
                    onRemoveFrame={() => setSelectedShape(null)}
                    frameSize={[0.4, 0.4]} // or your desired size
                    frameThickness={0.02}
                    frameWidth={0.02}
                    framePosition={framePosition} // Pass frame position to Scene
                    onUpdateFramePosition={handleFramePositionUpdate} // Pass callback to update frame
                    frames={frames}
                    setFrames={setFrames}
                    selectedFrameId={selectedFrameId}
                    setSelectedFrameId={setSelectedFrameId}
                    onUpdateFrameSize={handleUpdateFrameSize}
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
            
            .canvas-container {
              width: 100%;
              height: 100%;
            }
          `}</style>

          <div className="absolute top-4 left-4 z-10 flex gap-2 bg-[#2F424B] p-2 rounded-lg">
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

          <Frame
            onSelectShape={setSelectedShape}
            selectedShape={selectedShape}
            frames={frames}
            onClearFrames={handleClearFrames}
          />

          <DimensionControls
            stoneDimensions={stoneDimensions}
            onDimensionChange={handleDimensionChange}
            selectedObject={selectedObject}
          />

          <SaveButton user={user} />
          <LockScene
            isLocked={isSceneLocked}
            onToggleLock={() => setIsSceneLocked((prev) => !prev)}
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
          <Instructions />

          <LayerPanel
            texts={texts}
            images={uploadedImages}
            selectedTexture={selectedTexture}
            onReorder={handleLayerReorder}
            onLayerSelect={handleLayerSelect}
            selectedLayer={selectedLayer}
            onLayerVisibilityToggle={handleLayerVisibilityToggle}
            visibleLayers={visibleLayers}
          />
        </div>
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
