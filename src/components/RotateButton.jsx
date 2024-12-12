import React from 'react';
import Tooltip from './Tooltip';

const RotateButton = ({ onClick, isActive }) => {
  return (
    <Tooltip text="Rotate">
      <button
        onClick={onClick}
        className={`w-8 h-8 ${isActive ? 'bg-blue-500 rounded' : ''}`}
      >
        <img
          src="/assets/tabler--rotate.svg"
          alt="Rotate"
          className={`w-full h-full ${isActive ? 'opacity-100' : 'opacity-70'}`}
        />
      </button>
    </Tooltip>
  );
};

export default RotateButton;
