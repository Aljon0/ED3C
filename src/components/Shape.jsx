// Shape.jsx
import React from "react";
import * as THREE from "three";

const Shape = React.forwardRef(({ type, texture, dimensions = {} }, ref) => {
  const { 
    width = 2, 
    height = 2, 
    thickness = 0.5 
  } = dimensions;

  const material = React.useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.01,
      metalness: 0.01,
    });
    // Ensure the material doesn't interfere with other layers
    mat.side = THREE.DoubleSide;
    mat.depthTest = true;
    mat.depthWrite = true;
    mat.transparent = false;
    mat.renderOrder = 0;
    return mat;
  }, [texture]);

  const getGeometry = () => {
    switch (type) {
      case "gravestone":
        return <boxGeometry args={[width, height, thickness]} />;
      case "base":
        return <boxGeometry args={[width, 0.5, thickness]} />;
      case "Urns":
        return <cylinderGeometry args={[width/2, width/2, height, 32]} />;
      case "table-signs":
        return <boxGeometry args={[width, height, thickness]} />;
      default:
        return null;
    }
  };

  return (
    <group>
      <mesh ref={ref} position={[0, 0, 0]} material={material}>
        {getGeometry()}
      </mesh>
    </group>
  );
});

export default Shape;