import { Html } from "@react-three/drei";
import React, { useCallback, useMemo, useState } from "react";
import {
  CircleGeometry,
  Path,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
} from "three";

const FrameShape = ({
  shapeType,
  size = [0.4, 0.4],
  thickness = 0.02,
  frameWidth = 0.02,
  position = [0, 0, 0.26],
  isSelected = false,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  removeEnabled = false,
  frameId,
}) => {
  const [hovered, setHovered] = useState(false);

  const handlePointerOver = () => setHovered(true);
  const handlePointerOut = () => setHovered(false);

  // Create detailed shape path with holes for frames
  const getShapePath = useCallback(() => {
    const shapePath = new Shape();

    switch (shapeType) {
      case "circle":
        // Outer circle (frame)
        shapePath.absarc(0, 0, size[0] / 2, 0, Math.PI * 2, false);
        // Inner circle (counter-clockwise for hole)
        const hole = new Path();
        hole.absarc(0, 0, size[0] / 2 - frameWidth, 0, Math.PI * 2, true);
        shapePath.holes.push(hole);
        break;

      case "rectangle":
        const width = size[0];
        const height = size[1];
        // Outer rectangle (frame)
        shapePath.moveTo(-width / 2, -height / 2);
        shapePath.lineTo(width / 2, -height / 2);
        shapePath.lineTo(width / 2, height / 2);
        shapePath.lineTo(-width / 2, height / 2);
        shapePath.lineTo(-width / 2, -height / 2);

        // Inner rectangle (counter-clockwise for hole)
        const innerWidth = width - 2 * frameWidth;
        const innerHeight = height - 2 * frameWidth;
        const innerHole = new Path();
        innerHole.moveTo(-innerWidth / 2, -innerHeight / 2);
        innerHole.lineTo(-innerWidth / 2, innerHeight / 2);
        innerHole.lineTo(innerWidth / 2, innerHeight / 2);
        innerHole.lineTo(innerWidth / 2, -innerHeight / 2);
        innerHole.lineTo(-innerWidth / 2, -innerHeight / 2);
        shapePath.holes.push(innerHole);
        break;

      case "square":
        const side = size[0];
        // Outer square (frame)
        shapePath.moveTo(-side / 2, -side / 2);
        shapePath.lineTo(side / 2, -side / 2);
        shapePath.lineTo(side / 2, side / 2);
        shapePath.lineTo(-side / 2, side / 2);
        shapePath.lineTo(-side / 2, -side / 2);

        // Inner square (counter-clockwise for hole)
        const innerSide = side - 2 * frameWidth;
        const squareHole = new Path();
        squareHole.moveTo(-innerSide / 2, -innerSide / 2);
        squareHole.lineTo(-innerSide / 2, innerSide / 2);
        squareHole.lineTo(innerSide / 2, innerSide / 2);
        squareHole.lineTo(innerSide / 2, -innerSide / 2);
        squareHole.lineTo(-innerSide / 2, -innerSide / 2);
        shapePath.holes.push(squareHole);
        break;

      default:
        console.warn("Unknown shape type:", shapeType);
        return shapePath;
    }

    return shapePath;
  }, [shapeType, size, frameWidth]);

  // Create a shape for the background that matches the inner shape
  const getBackgroundGeometry = useMemo(() => {
    switch (shapeType) {
      case "circle":
        return new CircleGeometry(size[0] / 2 - frameWidth, 32);

      case "rectangle":
        const width = size[0] - 2 * frameWidth;
        const height = size[1] - 2 * frameWidth;
        return new PlaneGeometry(width, height);

      case "square":
        const side = size[0] - 2 * frameWidth;
        return new PlaneGeometry(side, side);

      case "oval":
        // For oval, we create a custom shape geometry
        const backgroundShape = new Shape();
        const ovalWidth = size[0] - 2 * frameWidth;
        const ovalHeight = size[1] - 2 * frameWidth;

        const rx = ovalWidth / 2;
        const ry = ovalHeight / 2;
        const controlPoint = 0.5522847498 * rx;
        const controlPointY = 0.5522847498 * ry;

        backgroundShape.moveTo(-rx, 0);
        backgroundShape.bezierCurveTo(
          -rx,
          controlPointY,
          -controlPoint,
          ry,
          0,
          ry
        );
        backgroundShape.bezierCurveTo(
          controlPoint,
          ry,
          rx,
          controlPointY,
          rx,
          0
        );
        backgroundShape.bezierCurveTo(
          rx,
          -controlPointY,
          controlPoint,
          -ry,
          0,
          -ry
        );
        backgroundShape.bezierCurveTo(
          -controlPoint,
          -ry,
          -rx,
          -controlPointY,
          -rx,
          0
        );

        return new ShapeGeometry(backgroundShape);

      default:
        return new PlaneGeometry(1, 1);
    }
  }, [shapeType, size, frameWidth]);

  const extrudeSettings = {
    steps: 1,
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3,
  };

  if (!shapeType) return null;

  return (
    <group position={position}>
      {/* Background/container that matches the frame shape */}
      <mesh
        position={[0, 0, -thickness / 2]}
        geometry={getBackgroundGeometry}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) onClick(e);
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <meshStandardMaterial color="#f0f0f0" metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Frame */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) onClick(e);
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <extrudeGeometry args={[getShapePath(), extrudeSettings]} />
        <meshStandardMaterial
          color={isSelected ? "#FFD700" : hovered ? "#A67C52" : "#8B4513"}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Remove button (keeping just this part of the selection UI) */}
      {isSelected && removeEnabled && (
        <Html position={[size[0] / 2 + 0.1, size[1] / 2 + 0.1, 0]}>
          <div
            className="w-6 h-6 flex items-center justify-center cursor-pointer bg-red-500 rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2"
            onClick={(e) => {
              e.stopPropagation();
              if (removeEnabled && onClick) {
                onClick(e, "remove");
              }
            }}
          >
            <span className="text-white font-bold text-lg">×</span>
          </div>
        </Html>
      )}
    </group>
  );
};

export default FrameShape;
