import React from "react";
import * as THREE from "three";

const Shape = React.forwardRef(({ type, texture, dimensions = {} }, ref) => {
  const { 
    width = 2, 
    height = 2, 
    thickness = 0.5 
  } = dimensions;

  const material = React.useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.01,
      metalness: 0.01,
    });
  }, [texture]);

  switch (type) {
    case "gravestone":
      return (
        <mesh ref={ref} position={[0, 0, 0]} material={material}>
          <boxGeometry args={[width, height, thickness]} />
        </mesh>
      );
    case "base":
      return (
        <mesh ref={ref} position={[0, 0, 0]} material={material}>
          <boxGeometry args={[width, 0.5, thickness]} />
        </mesh>
      );
    case "Urns":
      return (
        <mesh ref={ref} position={[0, 0, 0]} material={material}>
          <cylinderGeometry args={[width/2, width/2, height, 32]} />
        </mesh>
      );
    case "table-signs":
      return (
        <mesh ref={ref} position={[0, 0, 0]} material={material}>
          <boxGeometry args={[width, height, thickness]} />
        </mesh>
      );
    default:
      return null;
  }
});

export default Shape;