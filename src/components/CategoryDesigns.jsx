import React, { useState } from 'react';

function CategoryDesigns({
    categories,
    imageContainers,
    selectedCategory,
    setSelectedCategory,
}) {
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setIsCategoryDropdownOpen(false);
    };

    // Filter images based on selected category
    const filteredImages = selectedCategory
        ? imageContainers.filter(
              (container) => container.image && container.category === selectedCategory
          )
        : imageContainers.filter((container) => container.image);

    return (
        <div className="w-full">
            {/* Category Dropdown Toggle */}
            <div
                className="relative flex items-center cursor-pointer mb-4"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            >
                <img
                    src="/assets/icon-park-outline--category-management.svg"
                    className="w-6 h-6 mr-2"
                    alt="Category"
                />
                <span className="text-white text-lg font-semibold">
                    {selectedCategory || 'Filter by Category'}
                </span>
            </div>

            {/* Category Dropdown */}
            {isCategoryDropdownOpen && (
                <div className="absolute z-10 bg-white rounded shadow-md p-2 w-[200px]">
                    <button
                        className={`w-full text-left px-3 py-2 rounded ${
                            selectedCategory === null
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                        }`}
                        onClick={() => handleCategorySelect(null)}
                    >
                        All
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category}
                            className={`w-full text-left px-3 py-2 rounded ${
                                selectedCategory === category
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700'
                            }`}
                            onClick={() => handleCategorySelect(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            )}

            {/* Filtered Images */}
            <div className="flex flex-wrap">
                {filteredImages.map((container) => (
                    <div
                        key={container.id}
                        className="relative mt-4 w-[150px] h-[100px] bg-[#DADADA] rounded mr-4 mb-4"
                    >
                        <img
                            src={container.image}
                            alt={`Uploaded ${container.category}`}
                            className="w-full h-full object-cover rounded"
                        />
                        {container.category && (
                            <span className="absolute top-1 left-1 bg-white/75 px-2 py-1 rounded text-xs">
                                {container.category}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CategoryDesigns;
