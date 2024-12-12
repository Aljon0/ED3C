import React, { useState, useRef, useEffect } from "react";
import { Text } from "@react-three/drei";

const Text2DComponent = ({
  text,
  font,
  color,
  height = 0.2,
  position,
  onPositionChange,
  moveEnabled,
  objectType,
  onRemove,
  stoneDimensions = { thickness: 0.5 },
}) => {
  const textRef = useRef();
  const [isSelected, setIsSelected] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(position);

  const validColors = {
    gold: "#FFD700",
    black: "#000000",
    white: "#FFFFFF",
  };

  const getZOffset = (type, thickness) => {
    switch (type) {
      case "gravestone":
        return thickness / 2 + 0.05;
      case "table-signs":
        return thickness / 2 + 0.01;
      case "Urns":
        return thickness / 2 + 0.01; // Consistent Z-offset for floating
      default:
        return 0.2;
    }
  };

  useEffect(() => {
    const newZOffset = getZOffset(objectType, stoneDimensions.thickness);
    const updatedPosition = [...currentPosition];
    updatedPosition[2] = newZOffset;

    setCurrentPosition(updatedPosition);
    if (onPositionChange) {
      onPositionChange(updatedPosition);
    }
  }, [stoneDimensions.thickness, objectType]);

  const handlePointerMove = (event) => {
    if (!moveEnabled || !isSelected) return;

    event.stopPropagation();
    const point = event.point;
    const newPosition = [
      point.x,
      point.y,
      getZOffset(objectType, stoneDimensions.thickness),
    ];
    setCurrentPosition(newPosition);
    if (onPositionChange) onPositionChange(newPosition);
  };

  return (
    <group position={currentPosition}>
      <Text
        ref={textRef}
        font={`/fonts/${font}.ttf`}
        fontSize={height}
        maxWidth={2}
        lineHeight={1}
        letterSpacing={0.02}
        textAlign="center"
        color={validColors[color] || validColors.white}
        anchorX="center"
        anchorY="middle"
        onClick={() => setIsSelected(!isSelected)}
        onPointerMove={handlePointerMove}
      >
        {text}
      </Text>

      {isSelected && onRemove && (
        <group position={[1, height, 0.02]}>
          {/* Red Remove Button */}
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <planeGeometry args={[0.2, 0.2]} />
            <meshBasicMaterial color="red" />
          </mesh>

          {/* × Symbol on the Button */}
          <Text
            fontSize={0.15}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            position={[0, 0, 0.01]} // Slightly above the button to prevent z-fighting
          >
            &times;
          </Text>
        </group>
      )}
    </group>
  );
};

export default Text2DComponent;
