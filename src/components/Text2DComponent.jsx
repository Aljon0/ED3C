import React, { useState, useRef, useEffect } from "react";
import { Text, Html } from "@react-three/drei";


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
  onTextChange,
  isSelected,
  onSelect,
  onUpdateHeight,
}) => {
  const textRef = useRef();
  const textareaRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(position);
  const [currentText, setCurrentText] = useState(text);
  const [isMoving, setIsMoving] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [initialPointerY, setInitialPointerY] = useState(null);
  const [initialHeight, setInitialHeight] = useState(height);

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
        return thickness / 2 + 0.01;
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEditing && textareaRef.current && !textareaRef.current.contains(event.target)) {
        setIsEditing(false);
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing]);

  const handlePointerDown = (event) => {
    if (!moveEnabled || isEditing) return;
    
    event.stopPropagation();
    setIsMoving(true);
    setDragStartPosition(event.point);
    onSelect?.(true);
  };

  const handlePointerMove = (event) => {
    if (!isMoving || !dragStartPosition) return;

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

  const handlePointerUp = (event) => {
    event.stopPropagation();
    setIsMoving(false);
    setDragStartPosition(null);
  };

  const handleTextClick = (event) => {
    event.stopPropagation();
    if (!isEditing) {
      onSelect?.(!isSelected);
    }
  };

  const handleTextDoubleClick = (event) => {
    event.stopPropagation();
    setIsEditing(true);
    onSelect?.(true);
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setCurrentText(newText);
    if (onTextChange) {
      onTextChange(newText);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' || (e.key === 'Enter' && e.shiftKey)) {
      setIsEditing(false);
      e.preventDefault();
    }
  };

  const handleRemoveClick = (event) => {
    event.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };

  const handleResizeStart = (event) => {
    event.stopPropagation();
    setIsResizing(true);
    setInitialPointerY(event.clientY);
    setInitialHeight(height);
    
    // Add window event listeners for resize
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (event) => {
    if (!isResizing || initialPointerY === null) return;

    const deltaY = (event.clientY - initialPointerY) * -0.002; // Adjust sensitivity as needed
    const newHeight = Math.max(0.1, initialHeight + deltaY); // Minimum size of 0.1
    
    if (onUpdateHeight) {
      onUpdateHeight(newHeight);
    }
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setInitialPointerY(null);
    
    // Remove window event listeners
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
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
        onClick={handleTextClick}
        onDoubleClick={handleTextDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {currentText}
      </Text>

      {isSelected && !isEditing && (
        <>
          {/* Resize Handle */}
          <Html position={[-1, height / 2, 0]}>
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
          <group position={[1, height, 0.02]}>
            <mesh onClick={handleRemoveClick}>
              <planeGeometry args={[0.2, 0.2]} />
              <meshBasicMaterial color="red" />
            </mesh>
            <Text
              fontSize={0.15}
              color="#FFFFFF"
              anchorX="center"
              anchorY="middle"
              position={[0, 0, 0.01]}
            >
              &times;
            </Text>
          </group>
        </>
      )}

      {/* ... (keep existing editing textarea HTML) */}
      {isEditing && (
        <Html
          occlude
          transform
          position={[0, 0, 0.1]}
          distanceFactor={5}
          wrapperClass="text-edit-wrapper"
        >
          <textarea
            ref={textareaRef}
            value={currentText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            style={{
              position: 'absolute',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              minHeight: '50px',
              zIndex: 1000,
              backgroundColor: 'white',
              border: '2px solid transparent',
              borderRadius: '4px',
              padding: '10px',
              resize: 'vertical',
              outline: 'none',
              color: '#000',
            }}
            autoFocus
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
            Press Esc or Shift + Enter to save
          </div>
        </Html>
      )}
    </group>
  );
};

export default Text2DComponent;