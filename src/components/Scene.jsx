import { OrbitControls, Plane } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TextureLoader } from "three";
import FrameShape from "../components/FrameShape";
import CylindricalText from "./CylindricalText";
import ImageRenderer from "./ImageRenderer";
import Shape from "./Shape";
import Text2DComponent from "./Text2DComponent";

const Scene = ({
  selectedObject,
  selectedTexture,
  texts = [],
  setTexts,
  onUpdateTextPosition,
  moveEnabled,
  uploadedImages,
  setUploadedImages,
  stoneDimensions,
  onUpdateImagePosition,
  onUpdateImageSize,
  onUpdateImageRotation,
  rotateEnabled,
  removeEnabled,
  selectedTextIndex,
  setSelectedTextIndex,
  selectedImageIndex,
  setSelectedImageIndex,
  isSceneLocked,
  onUpdateText,
  onUpdateTextHeight,
  layerOrder = [],
  visibleLayers = [],
  selectedShape,
  onRemoveFrame,
  frameSize = [0.4, 0.4],
  frameThickness = 0.02,
  frameWidth = 0.02,
  onUpdateFramePosition,
  frames = [],
  setFrames,
  onUpdateFrameSize,
}) => {
  const { camera, gl } = useThree();
  const groupRef = useRef();
  const orbitControlsRef = useRef(null);
  const imageRefs = useRef([]);
  const [sizeIndex, setSizeIndex] = useState(0);
  const [flippedImages, setFlippedImages] = useState({});
  const [movingImageIndex, setMovingImageIndex] = useState(null);
  const [movingTextIndex, setMovingTextIndex] = useState(null);
  const [movingFrameId, setMovingFrameId] = useState(null);
  const [isResizingFrame, setIsResizingFrame] = useState(false);
  const [frameResizeDirection, setFrameResizeDirection] = useState(null);
  const [initialFrameSize, setInitialFrameSize] = useState(null);
  const [selectedFrameId, setSelectedFrameId] = useState(null);
  const [textWidth, setTextWidth] = useState(2);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [initialPointerPosition, setInitialPointerPosition] = useState(null);
  const [activeFrameResize, setActiveFrameResize] = useState(false);

  // Track if there's a pending frame to be placed
  const [pendingFrame, setPendingFrame] = useState(false);

  const imageTexturesRef = useRef(new Map());
  const textureRef = useRef();
  const textureLoaderRef = useRef(new TextureLoader());
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [activeHandle, setActiveHandle] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [initialSize, setInitialSize] = useState(null);

  const handleWidthUpdate = (newWidth) => {
    setTextWidth(newWidth);
  };

  const handleFrameSelect = (frameId) => {
    setSelectedFrameId(frameId === selectedFrameId ? null : frameId);
  };

  const handleFramePointerDown = (event, frameId) => {
    event.stopPropagation();

    // If remove is enabled, remove the frame
    if (removeEnabled) {
      setFrames(frames.filter((frame) => frame.id !== frameId));
      setSelectedFrameId(null);
      return;
    }

    // If move is enabled, start moving the frame
    if (moveEnabled) {
      setMovingFrameId(frameId);
      handleFrameSelect(frameId);
    }
  };

  const handleFramePointerMove = (event) => {
    if (movingFrameId !== null && moveEnabled) {
      const point = event.point;

      // Find the frame being moved
      const frameIndex = frames.findIndex(
        (frame) => frame.id === movingFrameId
      );
      if (frameIndex !== -1) {
        // Create a copy of the frames array
        const newFrames = [...frames];
        // Update the position of the moved frame
        newFrames[frameIndex] = {
          ...newFrames[frameIndex],
          position: [point.x, point.y, newFrames[frameIndex].position[2]],
        };
        // Update the frames state
        setFrames(newFrames);
      }
    }
  };
  const handleFramePointerUp = () => {
    setMovingFrameId(null);
  };

  const handleFrameResizeStart = (event, direction, frameId) => {
    event.stopPropagation();
    setIsResizingFrame(true);
    setFrameResizeDirection(direction);
    setSelectedFrameId(frameId);
    setActiveFrameResize(true); // Set active resize to true when starting resize

    const frame = frames.find((f) => f.id === frameId);
    if (frame) {
      setInitialFrameSize(frame.size);
      setInitialPointerPosition({ x: event.clientX, y: event.clientY });

      // Disable orbit controls during resize
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = false;
      }

      // Add event listeners to the window
      window.addEventListener("mousemove", handleFrameResizeMove);
      window.addEventListener("mouseup", handleFrameResizeEnd);
    }
  };

  // Handle frame resize move
  const handleFrameResizeMove = useCallback(
    (event) => {
      if (
        !isResizingFrame ||
        !frameResizeDirection ||
        !initialPointerPosition ||
        !initialFrameSize ||
        !selectedFrameId ||
        !activeFrameResize // Only resize if active resize is true
      )
        return;

      const deltaX = (event.clientX - initialPointerPosition.x) * 0.002;
      const deltaY = (event.clientY - initialPointerPosition.y) * -0.002;

      let newWidth = initialFrameSize[0];
      let newHeight = initialFrameSize[1];

      // Update dimensions based on resize direction
      switch (frameResizeDirection) {
        case "top":
          newHeight = Math.max(0.1, initialFrameSize[1] + deltaY);
          break;
        case "bottom":
          newHeight = Math.max(0.1, initialFrameSize[1] - deltaY);
          break;
        case "left":
          newWidth = Math.max(0.1, initialFrameSize[0] - deltaX);
          break;
        case "right":
          newWidth = Math.max(0.1, initialFrameSize[0] + deltaX);
          break;
        case "topLeft":
          newWidth = Math.max(0.1, initialFrameSize[0] - deltaX);
          newHeight = Math.max(0.1, initialFrameSize[1] + deltaY);
          break;
        case "topRight":
          newWidth = Math.max(0.1, initialFrameSize[0] + deltaX);
          newHeight = Math.max(0.1, initialFrameSize[1] + deltaY);
          break;
        case "bottomLeft":
          newWidth = Math.max(0.1, initialFrameSize[0] - deltaX);
          newHeight = Math.max(0.1, initialFrameSize[1] - deltaY);
          break;
        case "bottomRight":
          newWidth = Math.max(0.1, initialFrameSize[0] + deltaX);
          newHeight = Math.max(0.1, initialFrameSize[1] - deltaY);
          break;
      }

      // Update the frame size in the parent component
      if (onUpdateFrameSize) {
        onUpdateFrameSize(selectedFrameId, [newWidth, newHeight]);
      }
    },
    [
      isResizingFrame,
      frameResizeDirection,
      initialPointerPosition,
      initialFrameSize,
      selectedFrameId,
      onUpdateFrameSize,
      activeFrameResize, // Include activeFrameResize in dependencies
    ]
  );

  // Handle frame resize end
  const handleFrameResizeEnd = useCallback(() => {
    setIsResizingFrame(false);
    setFrameResizeDirection(null);
    setInitialPointerPosition(null);
    setInitialFrameSize(null);
    setActiveFrameResize(false); // Reset active resize state

    // Re-enable orbit controls
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }

    // Remove event listeners
    window.removeEventListener("mousemove", handleFrameResizeMove);
    window.removeEventListener("mouseup", handleFrameResizeEnd);
  }, [handleFrameResizeMove]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleFrameResizeMove);
      window.removeEventListener("mouseup", handleFrameResizeEnd);
    };
  }, [handleFrameResizeMove, handleFrameResizeEnd]);

  const loadTexture = useCallback(async (textureName) => {
    if (!textureName) return null;

    try {
      const texture = await new Promise((resolve, reject) => {
        textureLoaderRef.current.load(
          `/textures/${textureName}.jpg`,
          (texture) => {
            texture.needsUpdate = true;
            texture.encoding = THREE.sRGBEncoding;
            resolve(texture);
          },
          undefined,
          reject
        );
      });

      return texture;
    } catch (error) {
      console.error("Error loading texture:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const updateTexture = async () => {
      if (!selectedTexture || !groupRef.current) return;

      const texture = await loadTexture(selectedTexture);

      if (!isMounted || !texture) return;

      textureRef.current = texture;

      groupRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.map = texture;
          child.material.needsUpdate = true;
        }
      });
    };

    updateTexture();

    return () => {
      isMounted = false;
    };
  }, [selectedTexture, loadTexture]);

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleFrameResizeMove);
      window.removeEventListener("mouseup", handleFrameResizeEnd);
    };
  }, [handleFrameResizeMove, handleFrameResizeEnd]);

  useEffect(() => {
    const handleContextRestored = () => {
      if (groupRef.current) {
        groupRef.current.traverse((child) => {
          if (child.isMesh) {
            child.material.needsUpdate = true;
            if (child.material.map) {
              child.material.map.needsUpdate = true;
            }
          }
        });
      }
    };

    window.addEventListener("webglcontextrestored", handleContextRestored);
    return () => {
      window.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, []);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        if (child.isMesh) {
          child.material.needsUpdate = true;
        }
      });
    }
  }, [selectedObject, selectedTexture, texts, uploadedImages]);

  // Reset pendingFrame when selectedShape changes
  useEffect(() => {
    if (selectedShape) {
      setPendingFrame(true);
    } else {
      setPendingFrame(false);
    }
  }, [selectedShape]);

  const memoizedTexture = useMemo(() => {
    if (!selectedTexture) return null;

    const textureLoader = new TextureLoader();
    const texture = textureLoader.load(
      `/textures/${selectedTexture}.jpg`,
      (loadedTexture) => {
        loadedTexture.needsUpdate = true;
        if (groupRef.current) {
          groupRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.needsUpdate = true;
            }
          });
        }
      },
      undefined,
      (error) => console.error("Error loading texture:", error)
    );

    textureRef.current = texture;
    return texture;
  }, [selectedTexture]);

  useEffect(() => {
    if (memoizedTexture && groupRef.current) {
      groupRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.map = memoizedTexture;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [memoizedTexture]);

  const loadImageTexture = (imageUrl) => {
    if (imageTexturesRef.current.has(imageUrl)) {
      return imageTexturesRef.current.get(imageUrl);
    }

    const textureLoader = new TextureLoader();
    const texture = textureLoader.load(imageUrl);
    imageTexturesRef.current.set(imageUrl, texture);
    return texture;
  };

  const stopPropagation = (event) => {
    event.stopPropagation();
  };

  const handleBackgroundClick = (event) => {
    if (event.object.type === "Mesh" && !event.object.material.map) {
      setSelectedTextIndex(null);
      setSelectedImageIndex(null);
      setSelectedFrameId(null);
      setIsResizing(false);
      setIsResizingFrame(false);
      setResizeDirection(null);
      setFrameResizeDirection(null);
      setInitialPointerPosition(null);
      setInitialFrameSize(null);
      setInitialSize(null);
      setActiveFrameResize(false); // Reset active resize state

      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = true;
      }
    }
  };

  const handleTextRemove = (index) => {
    setTexts((prev) => prev.filter((_, i) => i !== index));
    setSelectedTextIndex(null);
  };

  const handleImagePointerDown = (event, index) => {
    event.stopPropagation();

    if (removeEnabled) {
      setSelectedImageIndex(null);
      setUploadedImages((prevImages) =>
        prevImages.filter((_, i) => i !== index)
      );
      return;
    }

    if (rotateEnabled) {
      const currentRotation = uploadedImages[index].rotation || 0;
      const newRotation = (currentRotation + 90) % 360;
      onUpdateImageRotation(index, newRotation);
    } else if (moveEnabled) {
      setMovingImageIndex(index);
    } else {
      setSelectedImageIndex(index === selectedImageIndex ? null : index);
    }
  };

  const handleImagePointerMove = (event) => {
    event.stopPropagation();

    if (movingImageIndex !== null && moveEnabled) {
      const point = event.point;
      onUpdateImagePosition(movingImageIndex, [
        point.x,
        point.y,
        uploadedImages[movingImageIndex].position[2],
      ]);
    }
  };

  const handleImagePointerUp = () => {
    setMovingImageIndex(null);
  };

  const handleFlip = (e, index) => {
    e.stopPropagation();
    setFlippedImages((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleResizeIconClick = (e, index, handle) => {
    e.stopPropagation();
    setActiveHandle(handle);
    setSelectedImageIndex(index);
    setIsDragging(true);
    setDragStartPosition({ x: e.clientX, y: e.clientY });
    setInitialSize(uploadedImages[index].size);

    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false;
    }

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
  };

  const handlePointerDown = (e) => {
    if (activeHandle && selectedImageIndex !== null) {
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });

      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = false;
      }

      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);
    }
  };

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging || !activeHandle || !dragStartPosition || !initialSize)
        return;

      const deltaX = (e.clientX - dragStartPosition.x) * 0.01;
      const deltaY = (e.clientY - dragStartPosition.y) * 0.01;

      let newWidth = initialSize[0];
      let newHeight = initialSize[1];

      switch (activeHandle) {
        case "right":
          newWidth = Math.max(0.1, initialSize[0] + deltaX);
          break;
        case "left":
          newWidth = Math.max(0.1, initialSize[0] - deltaX);
          break;
        case "top":
          newHeight = Math.max(0.1, initialSize[1] - deltaY);
          break;
        case "bottom":
          newHeight = Math.max(0.1, initialSize[1] + deltaY);
          break;
        case "topLeft":
          newWidth = Math.max(0.1, initialSize[0] - deltaX);
          newHeight = Math.max(0.1, initialSize[1] - deltaY);
          break;
        case "topRight":
          newWidth = Math.max(0.1, initialSize[0] + deltaX);
          newHeight = Math.max(0.1, initialSize[1] - deltaY);
          break;
        case "bottomLeft":
          newWidth = Math.max(0.1, initialSize[0] - deltaX);
          newHeight = Math.max(0.1, initialSize[1] + deltaY);
          break;
        case "bottomRight":
          newWidth = Math.max(0.1, initialSize[0] + deltaX);
          newHeight = Math.max(0.1, initialSize[1] + deltaY);
          break;
      }

      onUpdateImageSize(selectedImageIndex, [newWidth, newHeight]);
    },
    [
      isDragging,
      activeHandle,
      dragStartPosition,
      initialSize,
      selectedImageIndex,
      onUpdateImageSize,
    ]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setActiveHandle(null);
    setDragStartPosition({ x: 0, y: 0 });
    setInitialSize(null);

    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }

    window.removeEventListener("mousemove", handlePointerMove);
    window.removeEventListener("mouseup", handlePointerUp);
  }, [handlePointerMove]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveHandle(null);
        setIsResizing(false);
        setResizeDirection(null);
        setInitialPointerPosition(null);
        setInitialFrameSize(null);
        setIsDragging(false);
        setDragStart(null);
        setInitialSize(null);
        setActiveFrameResize(false); // Reset active resize state

        if (orbitControlsRef.current) {
          orbitControlsRef.current.enabled = true;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const renderImage = (image, index) => {
    const isFlipped = flippedImages[index];
    const position = [...image.position];
    position[2] = stoneDimensions.thickness / 2 + 0.01 + index * 0.001;

    return (
      <ImageRenderer
        key={image.id || index}
        image={{ ...image, position }}
        index={index}
        selectedImageIndex={selectedImageIndex}
        isFlipped={isFlipped}
        handleImagePointerDown={handleImagePointerDown}
        handleImagePointerMove={handleImagePointerMove}
        handleImagePointerUp={handleImagePointerUp}
        handleFlip={handleFlip}
        handleResizeIconClick={handleResizeIconClick}
        handlePointerDown={handlePointerDown}
        activeHandle={activeHandle}
        loadImageTexture={loadImageTexture}
        stopPropagation={stopPropagation}
      />
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isResizing) {
        setIsResizing(false);
        setResizeDirection(null);
        setInitialPointerPosition(null);
        setInitialSize(null);
        setActiveFrameResize(false); // Reset active resize state

        if (orbitControlsRef.current) {
          orbitControlsRef.current.enabled = true;
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isResizing]);

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />

      <Suspense fallback={null}>
        {visibleLayers.includes("texture") && memoizedTexture && (
          <Shape
            type={selectedObject}
            texture={memoizedTexture}
            dimensions={stoneDimensions}
          />
        )}

        {layerOrder.map((layer) => {
          if (!visibleLayers.includes(layer.id)) return null;

          if (layer.type === "image") {
            const imageIndex = uploadedImages.findIndex(
              (img) => `image-${img.id}` === layer.id
            );
            if (imageIndex === -1) return null;
            return renderImage(uploadedImages[imageIndex], imageIndex);
          }

          if (layer.type === "text") {
            const textIndex = texts.findIndex(
              (text) => `text-${text.id}` === layer.id
            );
            if (textIndex === -1) return null;
            const textConfig = texts[textIndex];
            const adjustedPosition = [...textConfig.position];
            adjustedPosition[2] = stoneDimensions.thickness / 2 + 0.1;

            return selectedObject === "Urns" && textConfig.isCylindrical ? (
              <CylindricalText
                key={layer.id}
                text={textConfig.text}
                font={textConfig.font || "helvetiker"}
                color={textConfig.color}
                fontSize={textConfig.height || 1}
                position={adjustedPosition}
                radius={stoneDimensions.width / 2}
                moveEnabled={moveEnabled}
                isSelected={selectedTextIndex === textIndex}
                onSelect={(selected) =>
                  setSelectedTextIndex(selected ? textIndex : null)
                }
                onPositionChange={(newPosition) =>
                  onUpdateTextPosition(textIndex, newPosition)
                }
                onRemove={() => handleTextRemove(textIndex)}
                onTextChange={(newText) => onUpdateText(textIndex, newText)}
                onUpdateHeight={(newHeight) =>
                  onUpdateTextHeight(textIndex, newHeight)
                }
              />
            ) : (
              <Text2DComponent
                key={layer.id}
                {...textConfig}
                font={textConfig.font || "helvetiker"}
                color={textConfig.color}
                height={textConfig.height || 0.2}
                position={adjustedPosition}
                stoneDimensions={stoneDimensions}
                moveEnabled={moveEnabled}
                objectType={selectedObject}
                onPositionChange={(newPosition) =>
                  onUpdateTextPosition(textIndex, newPosition)
                }
                isSelected={selectedTextIndex === textIndex}
                onSelect={(selected) =>
                  setSelectedTextIndex(selected ? textIndex : null)
                }
                onRemove={() => handleTextRemove(textIndex)}
                onUpdateHeight={(newHeight) =>
                  onUpdateTextHeight(textIndex, newHeight)
                }
                width={textWidth}
                onUpdateWidth={handleWidthUpdate}
              />
            );
          }
          return null;
        })}

        {frames.map((frame) => (
          <FrameShape
            key={frame.id}
            frameId={frame.id}
            shapeType={frame.type}
            size={frame.size}
            thickness={frame.thickness || frameThickness}
            frameWidth={frame.frameWidth || frameWidth}
            position={frame.position}
            isSelected={selectedFrameId === frame.id}
            onClick={() => setSelectedFrameId(frame.id)}
            onPointerDown={(e) => handleFramePointerDown(e, frame.id)}
            onPointerMove={handleFramePointerMove}
            onPointerUp={handleFramePointerUp}
            removeEnabled={removeEnabled}
            onResizeStart={handleFrameResizeStart}
            onResize={handleFrameResizeMove}
            onResizeEnd={handleFrameResizeEnd}
          />
        ))}

        {/* Show pending frame only if selectedShape is set and pendingFrame is true */}
        {selectedShape && pendingFrame && (
          <FrameShape
            frameId={`temp-${selectedShape}`}
            shapeType={selectedShape}
            size={frameSize}
            thickness={frameThickness}
            frameWidth={frameWidth}
            position={[0, 0, 0.26]}
            isSelected={selectedFrameId === `temp-${selectedShape}`}
            onClick={() => {
              // When clicked, add this frame to the frames array
              const newFrame = {
                id: `frame-${Date.now()}`,
                type: selectedShape,
                size: frameSize,
                thickness: frameThickness,
                frameWidth: frameWidth,
                position: [0, 0, 0.26],
                isPlaced: true,
              };
              setFrames([...frames, newFrame]);
              setSelectedFrameId(newFrame.id);
              // Set pendingFrame to false to prevent adding another frame
              setPendingFrame(false);
            }}
            onPointerDown={() => {}} // Empty functions since this is just a template
            onPointerMove={() => {}}
            onPointerUp={() => {}}
            removeEnabled={false}
          />
        )}

        <Plane
          args={[100, 100]}
          position={[0, 0, -1]}
          onClick={handleBackgroundClick}
        >
          <meshBasicMaterial visible={false} />
        </Plane>
      </Suspense>

      <OrbitControls
        ref={orbitControlsRef}
        makeDefault
        enableZoom={!isSceneLocked}
        enablePan={!isSceneLocked}
        enableRotate={!isSceneLocked}
        enabled={!isResizingFrame && !isSceneLocked}
      />
    </group>
  );
};

export default Scene;
