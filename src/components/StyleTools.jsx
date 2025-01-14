import React, { useState, useEffect } from "react";
import Tooltip from "../components/Tooltip";

const TextureOption = ({ texture, label, selected, onClick}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative w-12 h-12 cursor-pointer rounded-lg overflow-hidden border-2 ${
        selected ? "border-blue-500" : "border-transparent"
      } hover:border-blue-300 transition-all duration-200`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={`/textures/${texture}.jpg`}
        alt={label}
        className="w-full h-full object-cover"
      />
      {isHovered && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-sm text-white bg-gray-900 rounded whitespace-nowrap">
          {label}
        </div>
      )}
    </div>
  );
};

const StyleTools = ({
  selectedObject,
  selectedTexture,
  setSelectedTexture,
  onImageUpload,
}) => {
  const [showTextureMenu, setShowTextureMenu] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const textureMenu = document.getElementById("texture-menu");
      const colorLensButton = document.getElementById("color-lens-button");

      if (
        textureMenu &&
        !textureMenu.contains(event.target) &&
        colorLensButton &&
        !colorLensButton.contains(event.target)
      ) {
        setShowTextureMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTextureOptions = () => {
    switch (selectedObject) {
      case "gravestone":
        return [
          { id: "black_galaxy", label: "Black Galaxy" },
          { id: "ceramic_tiles", label: "Ceramic Tiles" },
          { id: "biege", label: "Biege"},
          { id: "giraffe", label: "giraffe"},
          { id: "plain black", label: "Plain Black"},
          { id: "plain white", label: "Plain White"},
          { id: "Ilauran Tiles", label: "ilauran tiles"},
        ];
      case "base":
        return [
          { id: "black_galaxy", label: "Black Galaxy" },
          { id: "ceramic_tiles", label: "Ceramic Tiles" },
        ];
      case "Urns":
        return [
          { id: "marble", label: "Marble" },
          { id: "bamboo", label: "Bamboo" },
        ];
      case "table-signs":
        return [
          { id: "marble", label: "Marble" },
          { id: "black_galaxy", label: "Black Galaxy" },
        ];
      default:
        return [
          { id: "marble", label: "Marble" },
          { id: "black_galaxy", label: "Black Galaxy" },
          { id: "ceramic_tiles", label: "Ceramic Tiles" },
          { id: "bamboo", label: "Bamboo" },
        ];
    }
  };

  const textureOptions = getTextureOptions();

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if file is PNG
      if (file.type !== 'image/png') {
        alert('Please upload a PNG file with transparent background');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create a canvas to check transparency
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          // Convert to base64 and pass to parent
          onImageUpload(e.target.result);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="absolute top-4 right-3 flex gap-2 bg-[#2F424B] p-2 rounded-lg">
      <div className="relative">
        <Tooltip text="Change Texture">
          <button
            id="color-lens-button"
            className="w-8 h-8 cursor-pointer hover:opacity-80"
            onClick={() => setShowTextureMenu(!showTextureMenu)}
          >
            <img
              src="/assets/icon-park--texture.svg"
              alt="Color"
              className="w-full h-full"
            />
          </button>
        </Tooltip>
        {showTextureMenu && (
          <div
            id="texture-menu"
            className="absolute top-10 right-0 bg-[#2F424B] rounded-lg shadow-lg p-3 z-50"
          >
            <div className="grid grid-cols-2 gap-2 min-w-[120px]">
              {textureOptions.map((option) => (
                <TextureOption
                  key={option.id}
                  texture={option.id}
                  label={option.label}
                  selected={selectedTexture === option.id}
                  onClick={() => {
                    setSelectedTexture(option.id);
                    setShowTextureMenu(false);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Tooltip text="Upload PNG Image">
        <label htmlFor="file-upload" className="cursor-pointer w-8 h-8">
          <img
            src="/assets/material-symbols--upload.svg"
            alt="Upload"
            className="w-8 h-8"
          />
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/png"
          className="hidden"
          onChange={handleImageUpload}
        />
      </Tooltip>
    </div>
  );
};

export default StyleTools;