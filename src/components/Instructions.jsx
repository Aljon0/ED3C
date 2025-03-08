import React, { useState } from 'react';
import Tooltip from './Tooltip';

const Instructions = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Question mark icon button - positioned in the top-right of the canvas area */}
      <div className="absolute right-4 top-24">
        <Tooltip text="Instructions">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="w-8 h-8 cursor-pointer hover:opacity-80 bg-[#2F424B] rounded-lg p-2"
          >
            <img 
              src="/assets/rivet-icons--question-mark-solid.svg" 
              alt="Help" 
              className="w-full h-full filter-white"
            />
          </button>
        </Tooltip>
      </div>

      {/* Modal */}
      {isOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 shadow-md max-h-[90vh] overflow-y-auto w-full max-w-[400px] relative">
            {/* Close button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold mb-4 text-[#2F424B]">How to Use the 3D Customizer</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-semibold text-lg mb-2">Step 1: Prepare Your Design</h3>
                <p className="mb-2">Visit the <span className="font-semibold">CATALOG</span> section first to:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Download border designs</li>
                  <li>Get corner designs</li>
                  <li>Browse other designs</li>
                  <li>Use available templates</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Step 2: Create Your Design</h3>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="mb-2">1. Select a shape from the top-left toolbar</p>
                  <p className="mb-2">2. Choose your texture <img src="/assets/icon-park--texture-theme.svg" className="inline h-5 w-5 mx-1" /></p>
                  <p>3. Add content using either method:</p>
                  <ul className="list-disc ml-5 mt-2">
                    <li>Upload designs <img src="/assets/material-symbols--upload-theme.svg" className="inline h-5 w-5 mx-1" /></li>
                    <li>Add text using the text tool</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Step 3: Customize Your Design</h3>
                
                <div className="bg-gray-50 p-4 rounded-md space-y-3">
                  <div>
                    <span className="font-medium">Resize Elements:</span>
                    <p>Select element + click resize <img src="/assets/gridicons--resize-theme.svg" className="inline h-5 w-5 mx-1" /> and drag</p>
                  </div>
                  
                  <div>
                    <span className="font-medium">Move & Rotate:</span>
                    <ol className="ml-5 list-decimal mt-1">
                      <li>Lock the scene first <img src="/assets/material-symbols--lock-theme.svg" className="inline h-5 w-5 mx-1" /></li>
                      <li>Activate move <img src="/assets/mingcute--move-line-theme.svg" className="inline h-5 w-5 mx-1" /> or rotate <img src="/assets/tabler--rotate-theme.svg" className="inline h-5 w-5 mx-1" /></li>
                      <li>Blue background indicates active tool</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Additional Controls</h3>
                
                <div className="bg-gray-50 p-4 rounded-md space-y-2">
                  <p>
                    <img src="/assets/tdesign--adjustment-theme.svg" className="inline h-5 w-5 mx-1" />
                    Adjust stone dimensions using bottom-left controls
                  </p>
                  
                  <p>
                    <img src="/assets/fa--remove-theme.svg" className="inline h-5 w-5 mx-1" />
                    Delete uploaded images (texts have built-in delete button)
                  </p>
                  
                  <p>
                    <img src="/assets/material-symbols--undo-theme.svg" className="inline h-5 w-5 mx-1" />
                    <img src="/assets/material-symbols--redo-theme.svg" className="inline h-5 w-5 mx-1" />
                    Undo/Redo changes to text and images
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Instructions;