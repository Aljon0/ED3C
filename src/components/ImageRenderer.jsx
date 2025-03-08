import React from 'react';
import { Plane, Html } from "@react-three/drei";
import * as THREE from 'three';

const ImageRenderer = ({
  image,
  index,
  selectedImageIndex,
  isFlipped,
  handleImagePointerDown,
  handleImagePointerMove,
  handleImagePointerUp,
  handleFlip,
  handleResizeIconClick,
  handlePointerDown,
  activeHandle,
  loadImageTexture,
  stopPropagation
}) => {
  const position = [...image.position];
  position[2] = position[2] || 0;

  const ResizeHandle = ({ position, type, icon, rotation = 0 }) => (
    <Html position={position}>
      <div 
        className={`w-6 h-6 flex items-center justify-center cursor-pointer bg-[#2F424B] rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 ${activeHandle === type ? 'ring-2 ring-blue-500' : ''}`}
        onClick={(e) => handleResizeIconClick(e, index, type)}
        onPointerDown={handlePointerDown}
        style={{ cursor: getCursor(type) }}
      >
        <img 
          src={icon}
          alt="resize"
          className="w-4 h-4"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </div>
    </Html>
  );

  const getCursor = (type) => {
    const cursors = {
      right: 'ew-resize',
      left: 'ew-resize',
      top: 'ns-resize',
      bottom: 'ns-resize',
      topLeft: 'nw-resize',
      topRight: 'ne-resize',
      bottomLeft: 'sw-resize',
      bottomRight: 'se-resize'
    };
    return cursors[type] || 'pointer';
  };

  return (
    <group key={image.id || index}>
      <group scale={[isFlipped ? -1 : 1, 1, 1]} position={position}>
        <Plane
          args={image.size}
          position={[0, 0, 0]}
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

        {selectedImageIndex === index && (
          <>
            {/* Edge Handles */}
            <ResizeHandle
              position={[image.size[0] / 2, 0, 0]}
              type="right"
              icon="/assets/fontisto--arrow-h.svg"
            />
            <ResizeHandle
              position={[-image.size[0] / 2, 0, 0]}
              type="left"
              icon="/assets/fontisto--arrow-h.svg"
            />
            <ResizeHandle
              position={[0, image.size[1] / 2, 0]}
              type="top"
              icon="/assets/fontisto--arrow-v.svg"
            />
            <ResizeHandle
              position={[0, -image.size[1] / 2, 0]}
              type="bottom"
              icon="/assets/fontisto--arrow-v.svg"
            />

            {/* Corner Handles */}
            <ResizeHandle
              position={[-image.size[0] / 2, image.size[1] / 2, 0]}
              type="topLeft"
              icon="/assets/line-md--arrows-long-diagonal-rotated.svg"
              rotation={0}
            />
            <ResizeHandle
              position={[image.size[0] / 2, image.size[1] / 2, 0]}
              type="topRight"
              icon="/assets/line-md--arrows-long-diagonal.svg"
              rotation={0}
            />
            <ResizeHandle
              position={[-image.size[0] / 2, -image.size[1] / 2, 0]}
              type="bottomLeft"
              icon="/assets/line-md--arrows-long-diagonal.svg"
              rotation={0}
            />
            <ResizeHandle
              position={[image.size[0] / 2, -image.size[1] / 2, 0]}
              type="bottomRight"
              icon="/assets/line-md--arrows-long-diagonal-rotated.svg"
            />

            {/* Flip Button */}
            <Html position={[0, -image.size[1] / 2 - 0.2, 0]}>
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
          </>
        )}
      </group>
    </group>
  );
};

export default ImageRenderer;