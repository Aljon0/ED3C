import React, { useRef, useState, useMemo, Suspense, useEffect, useCallback } from "react";
import { OrbitControls, Plane, Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { TextureLoader } from "three";
import Shape from "./Shape";
import Text2DComponent from "./Text2DComponent";
import * as THREE from 'three';
import CylindricalText from './CylindricalText';

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
  onUpdateTextHeight
}) => {
  const { camera, gl } = useThree();
  const groupRef = useRef();
  const orbitControlsRef = useRef(null);
  const imageRefs = useRef([]);
  const [sizeIndex, setSizeIndex] = useState(0);
  const [flippedImages, setFlippedImages] = useState({});
  const [movingImageIndex, setMovingImageIndex] = useState(null);
  const [movingTextIndex, setMovingTextIndex] = useState(null);
  const imageTexturesRef = useRef(new Map());
  const textureRef = useRef();
  const textureLoaderRef = useRef(new TextureLoader());
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [initialPointerPosition, setInitialPointerPosition] = useState(null);
  const [initialImageSize, setInitialImageSize] = useState(null);
  const [activeHandle, setActiveHandle] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [initialSize, setInitialSize] = useState(null);

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
      console.error('Error loading texture:', error);
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

  // Handle WebGL context restoration
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

    window.addEventListener('webglcontextrestored', handleContextRestored);
    return () => {
      window.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, []);

  // Update scene state when props change
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        if (child.isMesh) {
          child.material.needsUpdate = true;
        }
      });
    }
  }, [selectedObject, selectedTexture, texts, uploadedImages]);

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
      (error) => console.error('Error loading texture:', error)
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

  const IMAGE_Z_OFFSET = 0.001;
  
  const SIZE_STEPS = [
    [0.5, 0.5],
    [1.0, 1.0],
    [1.5, 1.5],
    [2.0, 2.0],
  ];

  const stopPropagation = (event) => {
    event.stopPropagation();
  };

  const handleResize = (e, index) => {
    e.stopPropagation();
    const nextSizeIndex = (sizeIndex + 1) % SIZE_STEPS.length;
    setSizeIndex(nextSizeIndex);
    onUpdateImageSize(index, SIZE_STEPS[nextSizeIndex]);
  };

  const handleBackgroundClick = (event) => {
    if (event.object.type === "Mesh" && !event.object.material.map) {
      setSelectedTextIndex(null);
      setSelectedImageIndex(null);
      setIsResizing(false);
      setResizeDirection(null);
      setInitialPointerPosition(null);
      setInitialImageSize(null);
      
      // Re-enable orbit controls
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
        uploadedImages[movingImageIndex].position[2]
      ]);
    }
  };

  const handleImagePointerUp = () => {
    setMovingImageIndex(null);
  };

  const handleFlip = (e, index) => {
    e.stopPropagation();
    setFlippedImages(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleResizeStart = (event, index, direction) => {
    event.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setInitialPointerPosition({ x: event.clientX, y: event.clientY });
    setInitialImageSize([...uploadedImages[index].size]);
    setSelectedImageIndex(index);

    // Disable orbit controls while resizing
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false;
    }

    // Add window event listeners
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = useCallback((event) => {
    if (!activeHandle || selectedImageIndex === null || !initialPointerPosition || !initialImageSize) return;

    const deltaX = (event.clientX - initialPointerPosition.x) * 0.01;
    const deltaY = (event.clientY - initialPointerPosition.y) * 0.01;

    let newWidth = initialImageSize[0];
    let newHeight = initialImageSize[1];

    switch (activeHandle) {
      case 'right':
        newWidth = Math.max(0.1, initialImageSize[0] + deltaX);
        break;
      case 'left':
        newWidth = Math.max(0.1, initialImageSize[0] - deltaX);
        break;
      case 'top':
        newHeight = Math.max(0.1, initialImageSize[1] + deltaY);
        break;
      case 'bottom':
        newHeight = Math.max(0.1, initialImageSize[1] - deltaY);
        break;
    }

    onUpdateImageSize(selectedImageIndex, [newWidth, newHeight]);
  }, [activeHandle, selectedImageIndex, initialPointerPosition, initialImageSize, onUpdateImageSize]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeDirection(null);
    setInitialPointerPosition(null);
    setInitialImageSize(null);

    // Re-enable orbit controls
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }

    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
  }, []);

  const handleResizeIconClick = (e, index, handle) => {
    e.stopPropagation();
    
    if (activeHandle === handle) {
      // Deactivate handle
      setActiveHandle(null);
      setIsDragging(false);
      setDragStart(null);
      setInitialSize(null);
      
      // Re-enable orbit controls
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = true;
      }
    } else {
      // Activate handle
      setActiveHandle(handle);
      setSelectedImageIndex(index);
      setInitialSize(uploadedImages[index].size);
    }
  };

  const handlePointerDown = (e) => {
    if (activeHandle && selectedImageIndex !== null) {
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      
      // Disable orbit controls while dragging
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = false;
      }

      // Add window event listeners for drag
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
    }
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging || !activeHandle || !dragStart || !initialSize) return;

    const deltaX = (e.clientX - dragStart.x) * 0.01;
    const deltaY = (e.clientY - dragStart.y) * 0.01;

    let newWidth = initialSize[0];
    let newHeight = initialSize[1];

    switch (activeHandle) {
      case 'right':
        newWidth = Math.max(0.1, initialSize[0] + deltaX);
        break;
      case 'left':
        newWidth = Math.max(0.1, initialSize[0] - deltaX);
        break;
      case 'top':
        newHeight = Math.max(0.1, initialSize[1] + deltaY);
        break;
      case 'bottom':
        newHeight = Math.max(0.1, initialSize[1] - deltaY);
        break;
    }

    onUpdateImageSize(selectedImageIndex, [newWidth, newHeight]);
  }, [isDragging, activeHandle, dragStart, initialSize, selectedImageIndex, onUpdateImageSize]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    
    // Re-enable orbit controls
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }

    // Remove window event listeners
    window.removeEventListener('mousemove', handlePointerMove);
    window.removeEventListener('mouseup', handlePointerUp);
  }, [handlePointerMove]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Clear any active handles or resize states
        setActiveHandle(null);
        setIsResizing(false);
        setResizeDirection(null);
        setInitialPointerPosition(null);
        setInitialImageSize(null);
        setIsDragging(false);
        setDragStart(null);
        setInitialSize(null);
        
        // Re-enable orbit controls if they were disabled
        if (orbitControlsRef.current) {
          orbitControlsRef.current.enabled = true;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modify the image rendering part to include resize handles
  const renderImage = (image, index) => {
    const isFlipped = flippedImages[index];
    const position = [...image.position];
    position[2] = stoneDimensions.thickness / 2 + 0.01 + (index * 0.001);

    return (
      <group key={image.id || index}>
        <group scale={[isFlipped ? -1 : 1, 1, 1]}>
          <Plane
            args={image.size}
            position={position}
            rotation={[0, 0, (image.rotation || 0) * (Math.PI / 180)]}
            onPointerDown={(event) => handleImagePointerDown(event, index)}
            onPointerMove={handleImagePointerMove}
            onPointerUp={handleImagePointerUp}
            onClick={stopPropagation}
          >
            <meshBasicMaterial
              map={loadImageTexture(image.url)}
              transparent
              opacity={selectedImageIndex === index ? 0.8 : 1}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </Plane>
        </group>

        {selectedImageIndex === index && (
          <>
            {/* Right resize handle */}
            <Html position={[position[0] + (image.size[0] / 2), position[1], position[2]]}>
              <div 
                className={`w-6 h-6 -mr-3 flex items-center justify-center cursor-pointer bg-[#2F424B] rounded-full shadow-lg transform translate-x-1/2 ${activeHandle === 'right' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={(e) => handleResizeIconClick(e, index, 'right')}
                onPointerDown={handlePointerDown}
                style={{ cursor: activeHandle === 'right' ? 'ew-resize' : 'pointer' }}
              >
                <img 
                  src="/assets/fontisto--arrow-h.svg" 
                  alt="resize"
                  className="w-4 h-4"
                />
              </div>
            </Html>

            {/* Left resize handle */}
            <Html position={[position[0] - (image.size[0] / 2), position[1], position[2]]}>
              <div 
                className={`w-6 h-6 -ml-3 flex items-center justify-center cursor-pointer bg-[#2F424B] rounded-full shadow-lg transform -translate-x-1/2 ${activeHandle === 'left' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={(e) => handleResizeIconClick(e, index, 'left')}
                onPointerDown={handlePointerDown}
                style={{ cursor: activeHandle === 'left' ? 'ew-resize' : 'pointer' }}
              >
                <img 
                  src="/assets/fontisto--arrow-h.svg" 
                  alt="resize"
                  className="w-4 h-4"
                />
              </div>
            </Html>

            {/* Top resize handle */}
            <Html position={[position[0], position[1] + (image.size[1] / 2), position[2]]}>
              <div 
                className={`w-6 h-6 -mt-3 flex items-center justify-center cursor-pointer bg-[#2F424B] rounded-full shadow-lg transform -translate-y-1/2 ${activeHandle === 'top' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={(e) => handleResizeIconClick(e, index, 'top')}
                onPointerDown={handlePointerDown}
                style={{ cursor: activeHandle === 'top' ? 'ns-resize' : 'pointer' }}
              >
                <img 
                  src="/assets/fontisto--arrow-v.svg" 
                  alt="resize"
                  className="w-4 h-4"
                />
              </div>
            </Html>

            {/* Bottom resize handle */}
            <Html position={[position[0], position[1] - (image.size[1] / 2), position[2]]}>
              <div 
                className={`w-6 h-6 -mb-3 flex items-center justify-center cursor-pointer bg-[#2F424B] rounded-full shadow-lg transform translate-y-1/2 ${activeHandle === 'bottom' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={(e) => handleResizeIconClick(e, index, 'bottom')}
                onPointerDown={handlePointerDown}
                style={{ cursor: activeHandle === 'bottom' ? 'ns-resize' : 'pointer' }}
              >
                <img 
                  src="/assets/fontisto--arrow-v.svg" 
                  alt="resize"
                  className="w-4 h-4"
                />
              </div>
            </Html>
          </>
        )}

        {selectedImageIndex === index && (
          <Html position={[
            position[0],
            position[1] - (image.size[1] / 2) - 0.2,
            position[2]
          ]}>
            <div className="flex gap-2">
              <div 
                className="px-3 py-1 rounded-lg cursor-pointer w-20 flex items-center gap-1 bg-[#2F424B] text-white hover:bg-[#435964]"
                onClick={(e) => handleFlip(e, index)}
              >
                <img 
                  src="/assets/material-symbols--flip.svg" 
                  alt="flip"
                  className="w-4 h-4"
                />
                <span className="text-xs">Flip</span>
              </div>
            </div>
          </Html>
        )}
      </group>
    );
  };

  // Add useEffect to handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isResizing) {
        setIsResizing(false);
        setResizeDirection(null);
        setInitialPointerPosition(null);
        setInitialImageSize(null);

        // Re-enable orbit controls
        if (orbitControlsRef.current) {
          orbitControlsRef.current.enabled = true;
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isResizing]);

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />

      <Suspense fallback={null}>
        {memoizedTexture && (
          <Shape
            type={selectedObject}
            texture={memoizedTexture}
            dimensions={stoneDimensions}
          />
        )}

        {uploadedImages.map((image, index) => renderImage(image, index))}
        
        {texts.map((textConfig, index) => {
          const adjustedPosition = [...textConfig.position];
          adjustedPosition[2] = stoneDimensions.thickness / 2 + 0.1;

          if (selectedObject === "Urns" && textConfig.isCylindrical) {
            return (
              <CylindricalText
                key={index}
                text={textConfig.text}
                color={textConfig.color}
                fontSize={textConfig.height || 1}
                position={adjustedPosition}
                radius={stoneDimensions.width / 2} // Use the urn's width for radius
                moveEnabled={moveEnabled}
                isSelected={selectedTextIndex === index}
                onSelect={(selected) => setSelectedTextIndex(selected ? index : null)}
                onPositionChange={(newPosition) => onUpdateTextPosition(index, newPosition)}
                onRemove={() => handleTextRemove(index)}
                onTextChange={(newText) => onUpdateText(index, newText)}
                onUpdateHeight={(newHeight) => onUpdateTextHeight(index, newHeight)}
              />
            );
          }

          return (
            <Text2DComponent
              key={index}
              {...textConfig}
              font={textConfig.font || "helvetiker"}
              color={textConfig.color}
              height={textConfig.height || 0.2}
              position={adjustedPosition}
              stoneDimensions={stoneDimensions}
              moveEnabled={moveEnabled}
              objectType={selectedObject}
              onPositionChange={(newPosition) =>
                onUpdateTextPosition(index, newPosition)
              }
              isSelected={selectedTextIndex === index}
              onSelect={(selected) => setSelectedTextIndex(selected ? index : null)}
              onRemove={() => handleTextRemove(index)}
              onUpdateHeight={(newHeight) => onUpdateTextHeight(index, newHeight)}
            />
          );
        })}

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
        enabled={!(movingImageIndex !== null || movingTextIndex !== null) && !isSceneLocked}
      />
    </group>
  );
};

export default Scene;