import React, { useState } from "react";
import Tooltip from "./Tooltip";
import TextDialog from "./TextDialog";
import RemoveButton from "./RemoveButton";
import RotateButton from "./RotateButton";
import MoveButton from "./MoveButton";

function ManipulationTools({
  onAddText,
  onRemoveElement,
  rotateEnabled,
  toggleRotateMode,
  toggleMoveMode, // Add a toggle for movement
  moveEnabled,
  removeEnabled,
  toggleRemoveMode,
}) {
  const [showTextDialog, setShowTextDialog] = useState(false);

  const handleAddText = (textConfig) => {
    onAddText(textConfig);
    setShowTextDialog(false);
  };

  return (
    <div>
      <div className="absolute top-1/2 right-3 transform -translate-y-1/2 flex flex-col gap-2 bg-[#2F424B] p-2 rounded-lg">
        <Tooltip text="Add Text">
          <button
            className="w-8 h-8 cursor-pointer hover:opacity-80"
            onClick={() => setShowTextDialog(true)}
          >
            <img
              src="/assets/fluent--text-32-filled.svg"
              alt="Text"
              className="w-full h-full"
            />
          </button>
        </Tooltip>
        <MoveButton onClick={toggleMoveMode} isActive={moveEnabled} />
        <RotateButton
          onClick={toggleRotateMode}
          isActive={rotateEnabled}
        />
        <RemoveButton
          onClick={removeEnabled ? onRemoveElement : toggleRemoveMode}
          isActive={removeEnabled}
        />
      </div>

      {showTextDialog && (
        <TextDialog
          onClose={() => setShowTextDialog(false)}
          onAdd={handleAddText}
        />
      )}
    </div>
  );
}

export default ManipulationTools;
