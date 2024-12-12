import React, { useState, useEffect } from 'react';

const TextDialog = ({ onClose, onAdd }) => {
  const [text, setText] = useState('');
  const [font, setFont] = useState('TimesNewRomanCyr_Regular');
  const [color, setColor] = useState('white');
  const [height, setHeight] = useState(0.15);
  const [extrusion, setExtrusion] = useState(0.02);

  // Predefined colors
  const colors = [
    { id: 'gold', value: '#FFD700', label: 'Gold' },
    { id: 'black', value: '#000000', label: 'Black' },
    { id: 'white', value: '#FFFFFF', label: 'White' }
  ];

  // Available fonts 
  const fonts = [
    { value: 'EdwardianScriptITC_Regular', label: 'Edwardian Script' },
    { value: 'FuturaMdBT_Bold', label: 'Futura Bold' },
    { value: 'GreatVibes_Regular', label: 'Great Vibes' },
    { value: 'LavanderiaDelicate_Delicate', label: 'Lavanderia Delicate' },
    { value: 'LavanderiaRegular_Regular', label: 'Lavanderia Regular' },
    { value: 'LavanderiaSturdy_Sturdy', label: 'Lavanderia Sturdy' },
    { value: 'MissionScript_Regular', label: 'Mission Script' },
    { value: 'ScriptMTBold_Regular', label: 'Script MT Bold' },
    { value: 'TimesNewRomanCyr_Bold', label: 'Times New Roman Bold' }, 
    { value: 'TimesNewRomanCyr_Regular', label: 'Times New Roman' },
    { value: 'TimesNewRoman_Italic', label: 'Times New Roman Italic' },
    { value: 'Times_BoldItalic', label: 'Times Bold Italic' },
    { value: 'TirantiSolidLET_Plain', label: 'Tiranti Solid' },
    { value: 'Walnuts_Regular', label: 'Walnuts' },
    { value: 'ZapfinoForteLTPro_Regular', label: 'Zapfino Forte' }
  ];

  // Inject @font-face styles directly into the document
  useEffect(() => {
    // Create a style element
    const styleElement = document.createElement('style');
    
    // Construct @font-face rules
    const fontFaceRules = fonts.map(fontItem => `
      @font-face {
        font-family: '${fontItem.value}';
        src: url('/fonts/${fontItem.value}.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
    `).join('\n');

    // Set the style element's text content
    styleElement.textContent = fontFaceRules;

    // Append to the document head
    document.head.appendChild(styleElement);

    // Cleanup function to remove the style element
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('Please enter some text');
      return;
    }
    
    onAdd({
      text,
      font,
      color,
      height: Math.max(0.1, Number(height)),
      extrusion: Math.max(0.01, Number(extrusion))
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 w-96 space-y-4 shadow-xl">
        <h2 className="text-xl font-bold">Create a Text</h2>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Text</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Font</label>
          <select
            value={font}
            onChange={(e) => setFont(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{ fontFamily: font }}
          >
            {fonts.map((font) => (
              <option 
                key={font.value} 
                value={font.value}
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Color</label>
          <div className="flex gap-2">
            {colors.map(({ id, value, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setColor(id)}
                className={`flex-1 h-10 rounded-md border-2 transition-all ${
                  color === id ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'
                }`}
                style={{ 
                  backgroundColor: value,
                  color: id === 'white' ? '#000' : '#fff'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Size</label>
            <select
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="0.1">Small</option>
              <option value="0.15">Regular</option>
              <option value="0.2">Large</option>
              <option value="0.25">Extra Large</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Depth</label>
            <select
              value={extrusion}
              onChange={(e) => setExtrusion(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="0.01">Thin</option>
              <option value="0.02">Regular</option>
              <option value="0.03">Thick</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

export default TextDialog;