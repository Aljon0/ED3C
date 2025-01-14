import React, { useRef, useState, useEffect } from "react";
import { Text, Html } from "@react-three/drei";
import * as THREE from 'three';

const CylindricalText = ({
  text,
  radius = 0.5,
  height,
  color = "white",
  fontSize = 0.1,
  position,
  onPositionChange,
  moveEnabled,
  isSelected,
  onSelect,
  onRemove,
  onTextChange,
  onUpdateHeight, // New prop for handling font size updates
}) => {
  const groupRef = useRef();
  const [isMoving, setIsMoving] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(position);
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState(text);
  const [isResizing, setIsResizing] = useState(false);
  const [initialPointerY, setInitialPointerY] = useState(null);
  const [initialFontSize, setInitialFontSize] = useState(fontSize);
  
  const characterSpacing = fontSize * 0.2;
  const totalArcAngle = Math.PI * 0.6;
  const anglePerChar = totalArcAngle / Math.max(text.length - 1, 1);
  const startAngle = -totalArcAngle / 2;
  const textRadius = radius - 0.2;

  // Add resize handlers
  const handleResizeStart = (event) => {
    event.stopPropagation();
    setIsResizing(true);
    setInitialPointerY(event.clientY);
    setInitialFontSize(fontSize);
    
    // Add window event listeners for resize
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (event) => {
    if (!isResizing || initialPointerY === null) return;

    const deltaY = (event.clientY - initialPointerY) * -0.002;
    const newFontSize = Math.max(0.05, initialFontSize + deltaY); // Minimum size of 0.05
    
    if (onUpdateHeight) {
      onUpdateHeight(newFontSize);
    }
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setInitialPointerY(null);
    
    // Remove window event listeners
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
  };

  // ... (keep existing handlers)

  const handleDoubleClick = (event) => {
    event.stopPropagation();
    setIsEditing(true);
    onSelect?.(true);
  };

  const handleTextChange = (e) => {
    setEditingText(e.target.value);
  };

  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      setIsEditing(false);
      onTextChange?.(editingText);
    }
  };

  const handlePointerDown = (event) => {
    if (!moveEnabled || isEditing) return;
    event.stopPropagation();
    setIsMoving(true);
    onSelect?.(true);
  };

  const handlePointerMove = (event) => {
    if (!isMoving || !moveEnabled || isEditing) return;
    event.stopPropagation();

    const newY = event.point.y;
    const newPosition = [...currentPosition];
    newPosition[1] = newY;

    setCurrentPosition(newPosition);
    if (onPositionChange) onPositionChange(newPosition);
  };

  const handlePointerUp = () => {
    setIsMoving(false);
  };

  const handleClick = (event) => {
    event.stopPropagation();
    if (!isMoving && !isEditing) {
      onSelect?.(!isSelected);
    }
  };

  return (
    <group 
      ref={groupRef}
      position={currentPosition}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <Html position={[0, 0, textRadius]}>
          <input
            type="text"
            value={editingText}
            onChange={handleTextChange}
            onKeyDown={handleTextSubmit}
            onBlur={handleTextSubmit}
            autoFocus
            className="px-2 py-1 bg-inherit border-none rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
            style={{
              color: 'black',
              fontSize: '16px',
              minWidth: '100px'
            }}
          />
        </Html>
      ) : (
        text.split('').map((char, i) => {
          const angle = startAngle + (i * anglePerChar);
          const x = textRadius * Math.sin(angle);
          const z = textRadius * Math.cos(angle);
          
          const rotation = new THREE.Euler(0, angle, 0, 'XYZ');

          return (
            <Text
              key={i}
              color={color}
              fontSize={fontSize}
              position={[x, 0, z]}
              rotation={rotation}
              anchorX="center"
              anchorY="middle"
              letterSpacing={-0.15}
            >
              {char}
            </Text>
          );
        })
      )}

      {isSelected && !isEditing && (
        <>
          {/* Resize Handle */}
          <Html position={[-radius - 0.2, fontSize / 2, 0]}>
            <div 
              className="w-6 h-6 flex items-center justify-center cursor-ns-resize bg-[#2F424B] rounded-full shadow-lg transform -translate-y-1/2"
              onPointerDown={handleResizeStart}
            >
              <img 
                src="/assets/cil--resize-both.svg" 
                alt="resize"
                className="w-4 h-4"
              />
            </div>
          </Html>

          {/* Remove Button */}
          <mesh 
            position={[radius + 0.2, 0, 0]} 
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
          >
            <planeGeometry args={[0.1, 0.1]} />
            <meshBasicMaterial color="red" />
            <Text
              position={[0, 0, 0.01]}
              color="white"
              fontSize={0.05}
              anchorX="center"
              anchorY="middle"
            >
              ×
            </Text>
          </mesh>
        </>
      )}
    </group>
  );
};

export default CylindricalText;