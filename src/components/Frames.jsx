import React from 'react';
import Tooltip from "./Tooltip";

const FRAME_SHAPES = [
  { id: 'oval', icon: '/assets/tabler--oval-filled.svg', alt: 'Oval' },
  { id: 'square', icon: '/assets/mingcute--square-fill.svg', alt: 'Square' },
  { id: 'circle', icon: '/assets/material-symbols--circle.svg', alt: 'Circle' },
  { id: 'rectangle', icon: '/assets/gis--rectangle.svg', alt: 'Rectangle' },
];

function Frames({ 
  onFrameSelect, 
  selectedFrame, 
  isFrameSelectionOpen, 
  toggleFrameSelection 
}) {
  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2 bg-[#2F424B] p-2 rounded-lg ml-44">
      <Tooltip text="Frames">
        <img 
          src="/assets/fluent-emoji-high-contrast--framed-picture.svg" 
          alt="Frames" 
          className="cursor-pointer w-9 h-10"
          onClick={toggleFrameSelection}
        />
      </Tooltip>

      {isFrameSelectionOpen && (
        <div className="flex gap-2 mt-2">
          {FRAME_SHAPES.map((shape) => (
            <div 
              key={shape.id}
              className={`relative w-12 h-12 cursor-pointer rounded-lg overflow-hidden border-2 ${
                selectedFrame === shape.id ? 'border-white' : 'border-transparent'
              } hover:border-white transition-all duration-200`}
              onClick={() => onFrameSelect(shape.id)}
            >
              <img 
                src={shape.icon} 
                alt={shape.alt} 
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Frames;
