import React from 'react';

const Sample = () => {
  return (
    <section className="flex justify-center min-h-screen py-20 px-4 md:px-[10%] bg-[#2F424B] overflow-x-hidden" id="sample">
      <div className="text-white text-center max-w-7xl w-full" data-aos="fade-up">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold italic text-white mb-16 tracking-wider">
          SAMPLE
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 mt-8">
          {[1, 2, 3].map((num) => (
            <div key={num} className="group relative">
              <div className="bg-white/10 rounded-lg p-8 transition-all duration-300 hover:bg-white/20 hover:transform hover:scale-105">
                <div className="flex justify-center items-center h-full">
                  <img
                    src={`/assets/Sample ${num}.png`}
                    alt={`Sample ${num}`}
                    className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
              </div>
              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-xl font-medium text-white">Sample {num}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Sample;