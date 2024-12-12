import React, { useState } from 'react';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

// Predefined gravestone sizes in inches
const GRAVESTONE_SIZES = {
  small: [
    { width: 20, height: 30 },
    { width: 15, height: 24 },
    { width: 18, height: 24 }
  ],
  medium: [
    { width: 20, height: 40 },
    { width: 30, height: 40 },
    { width: 40, height: 50 },
    { width: 50, height: 60 }
  ],
  large: [
    { width: 20, height: 50 },
    { width: 40, height: 60 },
    { width: 60, height: 60 },
    { width: 60, height: 70 },
    { width: 80, height: 80 },
    { width: 80, height: 90 }
  ]
};

const DimensionControls = ({ 
  stoneDimensions, 
  onDimensionChange, 
  selectedObject 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stoneSize, setStoneSize] = useState('medium'); // Default size

  // Limit dimensions based on object type
  const getDimensionLimits = (type) => {
    switch(type) {
      case 'Urns':
        return { 
          width: { min: 0.2, max: 1 }, 
          height: { min: 0.5, max: 2 },
          thickness: { min: 0.1, max: 0.5 }
        };
      case 'table-signs':
        return { 
          width: { min: 0.5, max: 2 }, 
          height: { min: 0.2, max: 1 },
          thickness: { min: 0.05, max: 0.2 }
        };
      case 'gravestones':
        return { 
          width: { min: 15, max: 90 }, 
          height: { min: 24, max: 90 },
          thickness: { min: 0.1, max: 1 }
        };
      default:
        return { 
          width: { min: 0.5, max: 5 }, 
          height: { min: 0.5, max: 5 },
          thickness: { min: 0.1, max: 1 }
        };
    }
  };

  // Handle size category change
  const handleStoneSizeChange = (size) => {
    setStoneSize(size);
    // Automatically select the first dimension in the category
    const selectedDimension = GRAVESTONE_SIZES[size][0];
    onDimensionChange('width', selectedDimension.width);
    onDimensionChange('height', selectedDimension.height);
  };

  const limits = getDimensionLimits(selectedObject);

  return (
    <div className="absolute bottom-4 left-4 z-10">
      {/* Toggle Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#2F424B] p-2 rounded-full hover:bg-[#3F5B6B] transition-colors"
      >
        <AdjustmentsHorizontalIcon className="w-6 h-6 text-white" />
      </button>
      
      {/* Dimension Controls */}
      {isOpen && (
        <div className="absolute bottom-16 left-0 bg-[#2F424B] p-4 rounded-lg text-white shadow-lg">
          {/* Close Button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-2xl leading-none text-white hover:text-gray-300"
          >
            &times;
          </button>
          
          <h3 className="text-sm mb-3">Stone Dimensions</h3>
          
          {/* Size Category Selector (for gravestones) */}
          {selectedObject === 'gravestones' && (
            <div className="mb-3">
              <label className="block text-xs mb-1">Stone Size</label>
              <div className="flex space-x-2">
                {['small', 'medium', 'large'].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleStoneSizeChange(size)}
                    className={`px-2 py-1 rounded text-xs ${
                      stoneSize === size 
                        ? 'bg-blue-600' 
                        : 'bg-[#1F2937] hover:bg-[#2F424B]'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
              
              {/* Predefined Size Dropdown */}
              <div className="mt-2">
                <label className="block text-xs mb-1">Predefined Sizes</label>
                <select
                  value={`${stoneDimensions.width}x${stoneDimensions.height}`}
                  onChange={(e) => {
                    const [width, height] = e.target.value.split('x').map(Number);
                    onDimensionChange('width', width);
                    onDimensionChange('height', height);
                  }}
                  className="w-full bg-[#1F2937] rounded px-2 py-1 text-xs"
                >
                  {GRAVESTONE_SIZES[stoneSize].map((size, index) => (
                    <option 
                      key={index} 
                      value={`${size.width}x${size.height}`}
                    >
                      {`${size.width}" x ${size.height}"`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {/* Width Control */}
            <div>
              <label className="block text-xs mb-1">Width</label>
              <input 
                type="number" 
                min={limits.width.min} 
                max={limits.width.max} 
                step="1" 
                value={stoneDimensions.width}
                onChange={(e) => onDimensionChange('width', parseFloat(e.target.value))}
                className="w-full bg-[#1F2937] rounded px-2 py-1"
              />
            </div>
            
            {/* Height Control */}
            <div>
              <label className="block text-xs mb-1">Height</label>
              <input 
                type="number" 
                min={limits.height.min} 
                max={limits.height.max} 
                step="1" 
                value={stoneDimensions.height}
                onChange={(e) => onDimensionChange('height', parseFloat(e.target.value))}
                className="w-full bg-[#1F2937] rounded px-2 py-1"
              />
            </div>
            
            {/* Thickness Control */}
            <div>
              <label className="block text-xs mb-1">Thickness</label>
              <input 
                type="range" 
                min={limits.thickness.min} 
                max={limits.thickness.max} 
                step="0.1" 
                value={stoneDimensions.thickness}
                onChange={(e) => onDimensionChange('thickness', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-xs">{stoneDimensions.thickness.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DimensionControls;