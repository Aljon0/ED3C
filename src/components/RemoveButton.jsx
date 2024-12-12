import React from 'react';
import Tooltip from './Tooltip';

const RemoveButton = ({ onClick, isActive }) => {
  return (
    <Tooltip text={isActive ? "Click to Remove" : "Enter Remove Mode"}>
      <button
        onClick={isActive ? onClick : () => onClick(true)}
        className={`w-8 h-8 ${isActive ? 'bg-red-500 rounded' : ''}`}
      >
        <img
          src="/assets/fa--remove.svg"
          alt="Remove"
          className="w-full h-full"
        />
      </button>
    </Tooltip>
  );
};

export default RemoveButton;
