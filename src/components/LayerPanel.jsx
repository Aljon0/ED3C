import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Layers, Image, Type, Grid3X3, ChevronDown, ChevronUp } from 'lucide-react';

const LayerPanel = ({
  texts,
  images,
  selectedTexture,
  onReorder,
  onLayerSelect,
  selectedLayer,
  onLayerVisibilityToggle,
  visibleLayers
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getAllLayers = () => {
    const layers = [
      { id: 'texture', type: 'texture', name: 'Stone Texture', icon: <Grid3X3 size={16} /> },
      ...images.map((img, index) => ({
        id: `image-${img.id || index}`,
        type: 'image',
        name: `Image ${index + 1}`,
        icon: <Image size={16} />,
        data: img
      })),
      ...texts.map((text, index) => ({
        id: `text-${text.id || index}`,
        type: 'text',
        name: `Text: ${text.text.substring(0, 15)}${text.text.length > 15 ? '...' : ''}`,
        icon: <Type size={16} />,
        data: text
      }))
    ];
    return layers;
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const layers = getAllLayers();
    const reorderedLayers = Array.from(layers);
    const [reorderedItem] = reorderedLayers.splice(result.source.index, 1);
    reorderedLayers.splice(result.destination.index, 0, reorderedItem);
    
    onReorder(reorderedLayers);
  };

  return (
    <div className="absolute right-48 top-4 w-64 bg-white rounded-lg shadow-lg overflow-hidden">
      <button 
        className="w-full p-3 bg-[#2F424B] text-white flex items-center justify-between cursor-pointer hover:bg-[#3a4f58] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Layers size={16} />
          <span className="font-medium">Layers</span>
        </div>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {isExpanded && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="layers">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="max-h-64 overflow-y-auto"
              >
                {getAllLayers().map((layer, index) => (
                  <Draggable key={layer.id} draggableId={layer.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`
                          flex items-center gap-2 p-2 border-b cursor-pointer
                          ${selectedLayer === layer.id ? 'bg-blue-50' : 'hover:bg-gray-50'}
                          ${snapshot.isDragging ? 'bg-gray-100' : ''}
                        `}
                        onClick={() => onLayerSelect(layer.id)}
                      >
                        <button
                          className={`w-4 h-4 rounded-sm border ${
                            visibleLayers.includes(layer.id) ? 'bg-blue-500' : 'bg-gray-200'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onLayerVisibilityToggle(layer.id);
                          }}
                        />
                        {layer.icon}
                        <span className="text-sm truncate">{layer.name}</span>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
};

export default LayerPanel;