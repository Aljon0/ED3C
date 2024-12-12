// Tooltip.jsx
import React, { useState } from 'react';

const Tooltip = ({ text, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div 
          className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 px-3 py-1.5 bg-black text-white text-sm rounded whitespace-nowrap z-[1000]"
          style={{ pointerEvents: 'none' }}
        >
          {text}
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-full w-0 h-0 border-solid border-4 border-transparent border-t-black" />
        </div>
      )}
    </div>
  );
};

export default Tooltip;