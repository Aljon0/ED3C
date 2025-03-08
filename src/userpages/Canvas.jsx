import React from 'react';
import Navigation from "../components/Navigation";

function Canvas() {
  return (
    <>

      <Navigation />
      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8 mt-8">
        {/* Updated layout for Images */}
        <span className="font-bold text-[#37474F] text-4xl lg:text-7xl block mb-4">CANVAS</span>
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <img src="/assets/CANVAS.jpg" className="w-full lg:w-[450px] h-auto lg:h-[450px] object-cover rounded-lg" alt="Canvas" />
          <img src="/assets/GRAVESTONES-CANVAS.jpg" className="w-full lg:w-[450px] h-auto lg:h-[450px] object-cover rounded-lg" alt="Gravestones Canvas" />
        </div>
      </main>
    </>
  );
}

export default Canvas;