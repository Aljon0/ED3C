import React from 'react';

function Features() {
  return (
    <section className="flex justify-center min-h-screen py-10 px-4 md:px-[5%] bg-[#2F424B] overflow-x-hidden" id="features">
      <div className="text-white text-center max-w-6xl" data-aos="fade-right">
        <span className="text-2xl sm:text-3xl md:text-4xl font-semibold italic text-center text-white">FEATURES</span>
        <h1 className="text-xs sm:text-sm md:text-base pt-2">ETERNAL DESIGN: INTERACTIVE 3D CUSTOMIZATION FOR
          DOUBLE SEVEN LAPIDA MAKER INCORPORATION (ED3C)</h1>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center mt-8 gap-8">
          <div className="flex flex-col items-center w-full sm:w-[calc(50%-1rem)] md:w-64">
            <img src="/assets/bi--badge-3d.svg" alt="" className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" />
            <span className="mt-4 text-base sm:text-lg md:text-xl font-semibold">Interactive 3D Customization</span>
            <p className="mt-2 text-xs sm:text-sm md:text-base text-center">ED3C allows you to design memorials in a fully interactive 3D environment.
              You can visualize every detail, from the material and texture to the inscription and decorative elements, ensuring that the final product perfectly matches your vision.</p>
          </div>
          <div className="flex flex-col items-center w-full sm:w-[calc(50%-1rem)] md:w-64">
            <img src="/assets/mdi--user-multiple-check-outline.svg" alt="" className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" />
            <span className="mt-4 text-base sm:text-lg md:text-xl font-semibold">User Collaboration</span>
            <p className="mt-2 text-xs sm:text-sm md:text-base text-center">Collaborate with others in real-time to create the perfect memorial. Share your designs and receive instant feedback from family and friends.</p>
          </div>
          <div className="flex flex-col items-center w-full sm:w-[calc(50%-1rem)] md:w-64">
            <img src="/assets/solar--high-quality-broken.svg" alt="" className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" />
            <span className="mt-4 text-base sm:text-lg md:text-xl font-semibold">High Quality</span>
            <p className="mt-2 text-xs sm:text-sm md:text-base text-center">We use the highest quality materials and craftsmanship to ensure that your memorial is durable and beautiful.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features;