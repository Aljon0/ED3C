import * as THREE from 'three';
import { useMemo } from 'react';

const FramedShape = ({ 
    type, 
    size, 
    position, 
    rotation, 
    frameDepth = 0.01, 
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onClick,
    opacity = 1
  }) => {
    const frameWidth = 0.05; // Thickness of the frame
    const frameColor = 0x000000; // Black frame color

    const { frameGeometry, innerGeometry } = useMemo(() => {
        let frameGeometry, innerGeometry;

        switch (type) {
            case 'circle':
                // Create truly circular frame with precise circle geometry
                const circleRadius = size[0] / 2;
                frameGeometry = new THREE.RingGeometry(
                    circleRadius, 
                    circleRadius + frameWidth, 
                    64  // Increase segments for smoother circle
                );
                innerGeometry = new THREE.CircleGeometry(
                    circleRadius, 
                    64  // Matching segments for inner circle
                );
                break;

            case 'oval':
                // Create an oval with correct proportions
                const width = size[0];
                const height = size[1];
                
                // Custom shape path for oval
                const ovalShape = new THREE.Shape();
                ovalShape.moveTo(0, height / 2);
                ovalShape.absellipse(
                    0, 
                    0, 
                    width / 2, 
                    height / 2, 
                    0, 
                    Math.PI * 2
                );

                // Frame geometry based on oval shape
                const extrudeSettings = {
                    steps: 1,
                    depth: frameDepth,
                    bevelEnabled: false
                };

                frameGeometry = new THREE.ExtrudeGeometry(
                    ovalShape, 
                    {
                        ...extrudeSettings,
                        bevelThickness: frameWidth
                    }
                );
                
                // Inner oval geometry
                innerGeometry = new THREE.ExtrudeGeometry(
                    ovalShape, 
                    extrudeSettings
                );
                break;

            case 'square':
                // Standard square frame
                frameGeometry = new THREE.PlaneGeometry(
                    size[0] + frameWidth * 2, 
                    size[0] + frameWidth * 2
                );
                innerGeometry = new THREE.PlaneGeometry(size[0], size[0]);
                break;

            case 'rectangle':
                // Rectangular frame with distinct width and height
                frameGeometry = new THREE.PlaneGeometry(
                    size[0] + frameWidth * 2, 
                    size[1] + frameWidth * 2
                );
                innerGeometry = new THREE.PlaneGeometry(size[0], size[1]);
                break;

            default:
                // Fallback to square frame
                frameGeometry = new THREE.PlaneGeometry(
                    size[0] + frameWidth * 2, 
                    size[0] + frameWidth * 2
                );
                innerGeometry = new THREE.PlaneGeometry(size[0], size[0]);
        }

        return { frameGeometry, innerGeometry };
    }, [type, size, frameWidth, frameDepth]);

    const outerMaterial = new THREE.MeshStandardMaterial({ 
        color: frameColor,
        transparent: true,
        opacity: opacity
    });
    const innerMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: opacity
    });

    return (
        <group 
            position={position} 
            rotation={rotation}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={onClick}
        >
            <mesh geometry={frameGeometry} material={outerMaterial} />
            <mesh geometry={innerGeometry} material={innerMaterial} position={[0, 0, 0.001]} />
        </group>
    );
};

export default FramedShape;