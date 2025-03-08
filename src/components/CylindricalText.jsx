import React, { useRef, useState, useEffect } from "react";
import { Text, Html } from "@react-three/drei";
import * as THREE from 'three';

const CylindricalText = ({
  text,
  font = "helvetiker", // Add font prop with default value
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
  onUpdateHeight,
}) => {
  const groupRef = useRef();
  const textEditRef = useRef();
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

  // Handle clicking outside of text edit
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEditing && textEditRef.current && !textEditRef.current.contains(event.target)) {
        setIsEditing(false);
        onTextChange?.(editingText);
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, editingText, onTextChange]);

  // Add escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isEditing) {
        setIsEditing(false);
        onTextChange?.(editingText);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editingText, onTextChange]);

  const handleResizeStart = (event) => {
    event.stopPropagation();
    setIsResizing(true);
    setInitialPointerY(event.clientY);
    setInitialFontSize(fontSize);
    
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (event) => {
    if (!isResizing || initialPointerY === null) return;

    const deltaY = (event.clientY - initialPointerY) * -0.002;
    const newFontSize = Math.max(0.05, initialFontSize + deltaY);
    
    if (onUpdateHeight) {
      onUpdateHeight(newFontSize);
    }
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setInitialPointerY(null);
    
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
  };

  const handleDoubleClick = (event) => {
    event.stopPropagation();
    if (!isEditing) {
      setIsEditing(true);
      onSelect?.(true);
    }
  };

  const handleTextChange = (e) => {
    setEditingText(e.target.value);
  };

  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' || (e.key === 'Enter' && e.shiftKey)) {
      e.preventDefault();
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
          <textarea
            ref={textEditRef}
            value={editingText}
            onChange={handleTextChange}
            onKeyDown={handleTextSubmit}
            autoFocus
            style={{
              position: 'absolute',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              minHeight: '50px',
              backgroundColor: 'white',
              border: '2px solid #2F424B',
              borderRadius: '4px',
              padding: '10px',
              resize: 'vertical',
              outline: 'none',
              color: '#000',
              zIndex: 1000,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
              pointerEvents: 'none'
            }}
          >
            Press Enter or Esc to save
          </div>
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
              font={`/fonts/${font}.ttf`} // Add font path here
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