import React, { useState, useEffect } from 'react';
import UserHeader from "../components/UserHeader.jsx";
import UserSideBar from "../components/UserSideBar.jsx";
import PreviewArea from '../components/PreviewArea.jsx';

const Create = () => {
  return (
    <>
      <UserHeader />
      <UserSideBar />
      <main className="ml-64 p-8 mt-16">
            <div className="max-w-7xl mx-auto ">
              <div className="grid grid-cols-12 gap-8">
                {/* Full width preview area */}
                <div className="col-span-12">
                  <PreviewArea />
                </div>
                
                <div className="flex justify-end mt-8 w-full">
                  <button className="bg-[#2F424B] text-white text-2xl px-6 py-2 rounded hover:bg-[#445166] transition-colors">
                    Place Order
                  </button>
                </div>
              </div>
            </div>
          </main>
        </>
    );
}

export default Create;