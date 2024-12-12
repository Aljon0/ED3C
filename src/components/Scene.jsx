import React, { useRef, useState, useEffect, Suspense, useMemo } from "react";
import { OrbitControls, Plane } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { TextureLoader } from "three";
import Shape from "./Shape";
import Text2DComponent from "./Text2DComponent";
import FramedShape from "./FramedShape";

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
  onUpdateImageRotation,
  rotateEnabled,
  removeEnabled,
  selectedTextIndex,
  setSelectedTextIndex,
  selectedImageIndex,
  setSelectedImageIndex,
  frames = [],
  setFrames,
  selectedFrame,
  setSelectedFrame,
  onUpdateFrameRotation,
}) => {
  const { camera, gl } = useThree();
  const orbitControlsRef = useRef(null);
  const imageRefs = useRef([]);
  
  const [movingImageIndex, setMovingImageIndex] = useState(null);
  const [movingTextIndex, setMovingTextIndex] = useState(null);
  const [movingFrameIndex, setMovingFrameIndex] = useState(null);

  const memoizedTexture = useMemo(() => {
    return selectedTexture
      ? new TextureLoader().load(`/textures/${selectedTexture}.jpg`)
      : null;
  }, [selectedTexture]);

  const IMAGE_Z_OFFSET = 0.001;

  const stopPropagation = (event) => {
    event.stopPropagation();
  };

  const handleImagePointerDown = (event, index) => {
    // Disable orbit controls when starting to move an image
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false;
    }

    event.stopPropagation();

    if (removeEnabled) {
      setSelectedImageIndex(null);
      setUploadedImages((prevImages) =>
        prevImages.filter((_, i) => i !== index)
      );
    } else {
      setSelectedImageIndex((prevIndex) =>
        prevIndex === index ? null : index
      );

      if (rotateEnabled) {
        const currentRotation = uploadedImages[index].rotation || 0;
        const newRotation = (currentRotation + 90) % 360;
        onUpdateImageRotation(index, newRotation);
      } else if (moveEnabled) {
        setMovingImageIndex(index);
      }
    }
  };

  const handleImagePointerMove = (event) => {
    if (movingImageIndex === null || !moveEnabled) return;

    event.stopPropagation();
    const point = event.point;

    const currentImage = uploadedImages[movingImageIndex];
    const newPosition = [point.x, point.y, currentImage.position[2]];

    onUpdateImagePosition(movingImageIndex, newPosition);
  };

  const handleImagePointerUp = () => {
    // Re-enable orbit controls when stopping image movement
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }
    setMovingImageIndex(null);
  };

  const handleFramePointerDown = (event, index) => {
    event.stopPropagation();

    if (removeEnabled) {
      // Remove frame when remove button is active
      setFrames((prevFrames) => prevFrames.filter((_, i) => i !== index));
      setSelectedFrame(null);
      return;
    }

    // Select frame
    setSelectedFrame((prevFrame) => (prevFrame === index ? null : index));

    if (rotateEnabled && frames[index].type === "oval") {
      // Rotate the oval frame if rotate mode is active
      const currentRotation = frames[index].rotation || 0;
      const newRotation = (currentRotation + 45) % 360; // Rotate by 45 degrees
      onUpdateFrameRotation(index, newRotation);
    } else if (moveEnabled) {
      // Move the frame
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = false; // Disable orbit controls
      }
      setMovingFrameIndex(index);
    }
  };

  const handleFramePointerMove = (event) => {
    if (movingFrameIndex === null || !moveEnabled) return;

    event.stopPropagation();
    const point = event.point;

    const currentFrame = frames[movingFrameIndex];
    const newPosition = [point.x, point.y, currentFrame.position[2]];

    // Update frame position
    setFrames((prevFrames) =>
      prevFrames.map((frame, index) =>
        index === movingFrameIndex
          ? { ...frame, position: newPosition }
          : frame
      )
    );
  };

  const handleFramePointerUp = () => {
    // Re-enable orbit controls when stopping frame movement
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }
    setMovingFrameIndex(null);
  };

  const handleTextPointerDown = (event, index) => {
    // Disable orbit controls when starting to move text
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false;
    }

    event.stopPropagation();

    if (removeEnabled) {
      setSelectedTextIndex(null);
      setTexts((prevTexts) => prevTexts.filter((_, i) => i !== index));
    } else {
      setSelectedTextIndex((prevIndex) => (prevIndex === index ? null : index));

      if (moveEnabled) {
        setMovingTextIndex(index);
      }
    }
  };

  const handleTextPointerMove = (event) => {
    if (movingTextIndex === null || !moveEnabled) return;

    event.stopPropagation();
    const point = event.point;

    const currentText = texts[movingTextIndex];

    const newPosition =
      selectedObject === "Urns"
        ? [point.x, point.y, currentText.position[2]]
        : [point.x, point.y, currentText.position[2]];

    onUpdateTextPosition(movingTextIndex, newPosition);
  };

  const handleTextPointerUp = () => {
    // Re-enable orbit controls when stopping text movement
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }
    setMovingTextIndex(null);
  };

  return (
    <>
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

        {frames.map((frame, index) => (
          <FramedShape
            key={frame.id || index}
            type={frame.type}
            size={
              frame.size ||
              {
                oval: [0.6, 0.3],
                square: [0.4, 0.4],
                circle: [0.4, 0.4],
                rectangle: [0.65, 0.5],
              }[frame.type] || [0.4, 0.4]
            }
            position={frame.position}
            rotation={[0, 0, (frame.rotation || 0) * (Math.PI / 180)]}
            onPointerDown={(event) => handleFramePointerDown(event, index)}
            onPointerMove={handleFramePointerMove}
            onPointerUp={handleFramePointerUp}
            onClick={stopPropagation}
            opacity={selectedFrame === index ? 0.5 : 1}
          />
        ))}

        {uploadedImages.map((image, index) => {
          const adjustedPosition = [
            image.position[0],
            image.position[1],
            image.position[2] + index * IMAGE_Z_OFFSET,
          ];

          return (
            <Plane
              key={image.id || index}
              args={image.size}
              position={adjustedPosition}
              rotation={[0, 0, (image.rotation || 0) * (Math.PI / 180)]}
              onPointerDown={(event) => handleImagePointerDown(event, index)}
              onPointerMove={handleImagePointerMove}
              onPointerUp={handleImagePointerUp}
              onClick={stopPropagation}
              onPointerEnter={stopPropagation}
              onPointerLeave={stopPropagation}
            >
              <meshStandardMaterial
                map={new TextureLoader().load(image.url)}
                transparent
                opacity={selectedImageIndex === index ? 0.5 : 1}
                color={0xffffff}
              />
            </Plane>
          );
        })}

        {texts.map((textConfig, index) => {
          const adjustedPosition = [...textConfig.position];
          adjustedPosition[2] = stoneDimensions.thickness / 2 + 0.1;

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
              onRemove={() => {
                setTexts((prev) => prev.filter((_, i) => i !== index));
                setSelectedTextIndex(null);
              }}
              onPointerDown={(event) => handleTextPointerDown(event, index)}
              onPointerMove={handleTextPointerMove}
              onPointerUp={handleTextPointerUp}
            />
          );
        })}
      </Suspense>

      <OrbitControls
        ref={orbitControlsRef}
        makeDefault
        enableZoom={true}
        enablePan={true}
        enabled={!(
          movingImageIndex !== null || 
          movingTextIndex !== null ||
          movingFrameIndex !== null
        )}
      />
    </>
  );
};

export default Scene;