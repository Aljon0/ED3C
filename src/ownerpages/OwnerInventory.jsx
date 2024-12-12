import React, { useState, useEffect } from "react";
import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";

function OwnerInventory() {
  return (
    <>
      <OwnerHeader />
      <OwnerSideBar />
      <main className="ml-64 p-8 mt-16">
        <div className="bg-[#37474F] p-6 rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold text-white mb-6">MATERIALS INVENTORY</h1>
          <div className="flex justify-between items-center mb-8">
            <div className="w-60 h-8 bg-white rounded-md flex items-center px-2">
              <img src="/assets/heroicons--magnifying-glass-16-solid.svg" alt="Search" className="mr-2 w-4 h-4" />
              <input type="text" placeholder="Search Item Name" className="rounded-md w-full h-full focus:outline-none" />
            </div>
            <div className="flex items-center text-white">
              <span className="mr-2">Add New Item</span>
              <img src="/assets/typcn--plus-outline.svg" alt="Add" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#263238] p-6 rounded-lg shadow-lg text-white">
              <h2 className="text-2xl font-bold mb-4"></h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-lg font-medium mb-2">Stock</p>
                  <p className="text-2xl font-bold"></p>
                </div>
                <div>
                  <p className="text-lg font-medium mb-2">Stock Value</p>
                  <p className="text-2xl font-bold"></p>
                </div>
                <div>
                  <p className="text-lg font-medium mb-2">Drack Stock</p>
                  <p className="text-2xl font-bold"></p>
                </div>
                <div>
                  <p className="text-lg font-medium mb-2">Price</p>
                  <p className="text-2xl font-bold"></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default OwnerInventory;