import { Html, Text } from "@react-three/drei";
import React, { useEffect, useRef, useState } from "react";

const Text2DComponent = ({
  text,
  font,
  color,
  height = 0.2,
  width = 2, // Add width prop with default
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
  onUpdateWidth, // Add width update handler
}) => {
  const textRef = useRef();
  const textEditRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(position);
  const [editingText, setEditingText] = useState(text);
  const [isMoving, setIsMoving] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [initialPointerPosition, setInitialPointerPosition] = useState({
    x: null,
    y: null,
  });
  const [initialDimensions, setInitialDimensions] = useState({ width, height });

  // Update editingText when text prop changes
  useEffect(() => {
    setEditingText(text);
  }, [text]);

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

  // Handle clicking outside of text edit
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isEditing &&
        textEditRef.current &&
        !textEditRef.current.contains(event.target)
      ) {
        setIsEditing(false);
        if (onTextChange && editingText !== text) {
          onTextChange(editingText);
        }
      }
    };

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, editingText, onTextChange, text]);

  // Add escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isEditing) {
        setIsEditing(false);
        if (onTextChange && editingText !== text) {
          onTextChange(editingText);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, editingText, onTextChange, text]);

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

  const handleClick = (event) => {
    event.stopPropagation();
    if (!isMoving && !isEditing) {
      onSelect?.(!isSelected);
    }
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      if (onTextChange && editingText !== text) {
        onTextChange(editingText);
      }
    }
  };

  const handleRemoveClick = (event) => {
    event.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };

  const handleResizeStart = (event, direction) => {
    event.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setInitialPointerPosition({ x: event.clientX, y: event.clientY });
    setInitialDimensions({ width, height });

    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", handleResizeEnd);
  };

  const handleResizeMove = (event) => {
    if (!isResizing || !initialPointerPosition.x || !initialPointerPosition.y)
      return;

    const deltaX = (event.clientX - initialPointerPosition.x) * 0.002;
    const deltaY = (event.clientY - initialPointerPosition.y) * -0.002;

    let newWidth = initialDimensions.width;
    let newHeight = initialDimensions.height;

    switch (resizeDirection) {
      case "top":
        newHeight = Math.max(0.1, initialDimensions.height + deltaY);
        break;
      case "bottom":
        newHeight = Math.max(0.1, initialDimensions.height - deltaY);
        break;
      case "left":
        newWidth = Math.max(0.5, initialDimensions.width - deltaX);
        break;
      case "right":
        newWidth = Math.max(0.5, initialDimensions.width + deltaX);
        break;
      case "topLeft":
        newWidth = Math.max(0.5, initialDimensions.width - deltaX);
        newHeight = Math.max(0.1, initialDimensions.height + deltaY);
        break;
      case "topRight":
        newWidth = Math.max(0.5, initialDimensions.width + deltaX);
        newHeight = Math.max(0.1, initialDimensions.height + deltaY);
        break;
      case "bottomLeft":
        newWidth = Math.max(0.5, initialDimensions.width - deltaX);
        newHeight = Math.max(0.1, initialDimensions.height - deltaY);
        break;
      case "bottomRight":
        newWidth = Math.max(0.5, initialDimensions.width + deltaX);
        newHeight = Math.max(0.1, initialDimensions.height - deltaY);
        break;
    }

    if (onUpdateHeight) onUpdateHeight(newHeight);
    if (onUpdateWidth) onUpdateWidth(newWidth);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeDirection(null);
    setInitialPointerPosition({ x: null, y: null });

    window.removeEventListener("mousemove", handleResizeMove);
    window.removeEventListener("mouseup", handleResizeEnd);
  };

  const ResizeHandle = ({ position, direction, icon, rotation = 0 }) => (
    <Html position={position}>
      <div
        className="w-6 h-6 flex items-center justify-center cursor-pointer bg-[#2F424B] rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2"
        style={{ cursor: getCursor(direction) }}
        onPointerDown={(e) => handleResizeStart(e, direction)}
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

  const getCursor = (direction) => {
    const cursors = {
      top: "ns-resize",
      bottom: "ns-resize",
      left: "ew-resize",
      right: "ew-resize",
      topLeft: "nw-resize",
      topRight: "ne-resize",
      bottomLeft: "sw-resize",
      bottomRight: "se-resize",
    };
    return cursors[direction] || "pointer";
  };

  return (
    <group position={currentPosition}>
      <Text
        ref={textRef}
        font={`/fonts/${font}.ttf`}
        fontSize={height}
        maxWidth={width}
        lineHeight={1}
        letterSpacing={0.02}
        textAlign="center"
        color={validColors[color] || validColors.white}
        anchorX="center"
        anchorY="middle"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {editingText}
      </Text>

      {isSelected && !isEditing && (
        <>
          {/* Corner handles */}
          <ResizeHandle
            position={[-width / 2, height / 2, 0]}
            direction="topLeft"
            icon="/assets/line-md--arrows-long-diagonal.svg"
            rotation={90}
          />
          <ResizeHandle
            position={[width / 2, height / 2, 0]}
            direction="topRight"
            icon="/assets/line-md--arrows-long-diagonal.svg"
            rotation={180}
          />
          <ResizeHandle
            position={[-width / 2, -height / 2, 0]}
            direction="bottomLeft"
            icon="/assets/line-md--arrows-long-diagonal.svg"
            rotation={180}
          />
          <ResizeHandle
            position={[width / 2, -height / 2, 0]}
            direction="bottomRight"
            icon="/assets/line-md--arrows-long-diagonal-rotated.svg"
          />

          {/* Edge handles */}
          <ResizeHandle
            position={[0, height / 2, 0]}
            direction="top"
            icon="/assets/fontisto--arrow-v.svg"
          />
          <ResizeHandle
            position={[0, -height / 2, 0]}
            direction="bottom"
            icon="/assets/fontisto--arrow-v.svg"
          />
          <ResizeHandle
            position={[-width / 2, 0, 0]}
            direction="left"
            icon="/assets/fontisto--arrow-h.svg"
          />
          <ResizeHandle
            position={[width / 2, 0, 0]}
            direction="right"
            icon="/assets/fontisto--arrow-h.svg"
          />

          {/* Remove button */}
          <group position={[width / 2 + 0.2, height / 2, 0.02]}>
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

      {isEditing && (
        <Html
          position={[0, 0, 0.1]}
          distanceFactor={5}
          transform
          occlude={false}
          center // Added center prop
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            pointerEvents: "none", // This ensures the HTML container doesn't interfere with interactions
          }}
        >
          <div
            style={{
              position: "relative",
              width: "200px",
              height: "100%",
              pointerEvents: "auto", // Re-enable pointer events for the inner content
              transform: "translate(-50%, -50%)", // Center the container
            }}
          >
            <textarea
              ref={textEditRef}
              value={editingText}
              onChange={handleTextChange}
              onKeyDown={handleTextSubmit}
              style={{
                width: "100%",
                minHeight: "50px",
                backgroundColor: "white",
                border: "2px solid #2F424B",
                borderRadius: "4px",
                padding: "10px",
                resize: "vertical",
                outline: "none",
                color: "#000",
                zIndex: 1000,
              }}
              autoFocus
            />
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                color: "white",
                fontSize: "12px",
                whiteSpace: "nowrap",
                textShadow: "1px 1px 1px rgba(0,0,0,0.5)",
                pointerEvents: "none",
                marginTop: "30px",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                padding: "4px 8px",
                borderRadius: "4px",
              }}
            >
              Press Enter to save, Shift+Enter for new line
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

export default Text2DComponent;
