import Tooltip from "./Tooltip";

function Frame({ onSelectShape, selectedShape, frames, onClearFrames }) {
  const shapes = [
    { id: "circle", icon: "/assets/circle.svg", label: "Circle" },
    { id: "rectangle", icon: "/assets/gis--rectangle.svg", label: "Rectangle" },
    {
      id: "square",
      icon: "/assets/mingcute--square-fill.svg",
      label: "Square",
    },
  ];

  const handleShapeSelect = (shapeId) => {
    console.log("Shape selected:", shapeId);
    onSelectShape(shapeId);
  };

  return (
    <div className="absolute top-4 left-64 flex flex-col gap-2">
      <div className="bg-[#2F424B] p-2 rounded-lg flex gap-2">
        {shapes.map((shape) => (
          <Tooltip key={shape.id} text={shape.label}>
            <div
              className={`cursor-pointer p-1 rounded-md ${
                selectedShape === shape.id ? "bg-[#435964]" : ""
              }`}
              onClick={() => handleShapeSelect(shape.id)}
            >
              <img src={shape.icon} alt={shape.label} className="w-10 h-10" />
            </div>
          </Tooltip>
        ))}
      </div>

      {frames.length > 0 && (
        <div className="bg-[#2F424B] p-2 rounded-lg flex justify-between items-center">
          <span className="text-white text-sm">Frames: {frames.length}</span>
          <button
            className="bg-red-500 text-white px-2 py-1 rounded text-sm"
            onClick={onClearFrames}
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

export default Frame;
