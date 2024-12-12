import React from "react";
import Tooltip from "./Tooltip";

const MoveButton = ({ onClick, isActive }) => {
  return (
    <Tooltip text="Move">
      <button
        onClick={onClick}
        className={`w-8 h-8 cursor-pointer ${isActive ? "bg-blue-500 rounded" : ""}`}
      >
        <img
          src="/assets/iconamoon--move-fill.svg"
          alt="Move"
          className={`w-full h-full ${isActive ? "opacity-100" : "opacity-70"}`}
        />
      </button>
    </Tooltip>
  );
};

export default MoveButton;
