import Tooltip from "./Tooltip";

function UndoRedo({ onUndo, onRedo }) {
  return (
    <>
      {/* Undo/Redo Tools */}
      <div className="absolute bottom-4 right-4 flex gap-2 bg-[#2F424B] p-2 rounded-lg">
        <Tooltip text="Undo">
          <button
            className="w-8 h-8 cursor-pointer hover:opacity-80"
            onClick={onUndo}
          >
            <img
              src="/assets/material-symbols--undo.svg"
              alt="Undo"
              className="w-full h-full"
            />
          </button>
        </Tooltip>
        <Tooltip text="Redo">
          <button
            className="w-8 h-8 cursor-pointer hover:opacity-80"
            onClick={onRedo}
          >
            <img
              src="/assets/material-symbols--redo.svg"
              alt="Redo"
              className="w-full h-full"
            />
          </button>
        </Tooltip>
      </div>
    </>
  );
}

export default UndoRedo;
