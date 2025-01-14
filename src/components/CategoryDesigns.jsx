import React, { useState } from 'react';

function CategoryDesigns({
    categories,
    selectedCategory,
    setSelectedCategory,
}) {
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const safeCategories = categories || [];

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setIsCategoryDropdownOpen(false);
    };

    return (
        <div className="w-full relative">
            {/* Category Dropdown Toggle */}
            <div
                className="flex items-center cursor-pointer"
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
                <div className="absolute z-10 bg-white rounded shadow-md p-2 w-[200px] top-full mt-2">
                    <button
                        className={`w-full text-left px-3 py-2 rounded ${
                            selectedCategory === null
                                ? 'bg-gray-200 text-gray-700'
                                : 'hover:bg-gray-200 text-gray-700'
                        }`}
                        onClick={() => handleCategorySelect(null)}
                    >
                        All
                    </button>
                    {safeCategories.map((category) => (
                        <button
                            key={category}
                            className={`w-full text-left px-3 py-2 rounded ${
                                selectedCategory === category
                                    ? 'bg-gray-200 text-gray-700'
                                    : 'hover:bg-gray-200 text-gray-700'
                            }`}
                            onClick={() => handleCategorySelect(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CategoryDesigns;