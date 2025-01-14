import React from 'react';

const SearchBar = ({ onSearch }) => {
  return (
    <div className="mb-6 relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Search by customer name..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-[500px] pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2F424B] focus:border-transparent bg-white"
        />
        <div className="absolute inset-y-0 left-3 flex items-center">
          <img
            src="/assets/heroicons--magnifying-glass-16-solid.svg"
            alt="Search"
            className="w-4 h-4 text-gray-500"
          />
        </div>
      </div>
    </div>
  );
};

export default SearchBar;