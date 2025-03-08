import React from 'react';

function Contact() {
  return (
    <section className="bg-[#CACACA] min-h-screen py-10 px-4 md:px-[5%] overflow-x-hidden" id="contact">
      <div className="flex flex-col lg:flex-row lg:justify-between max-w-6xl mx-auto" data-aos="fade-left">
        <div className="w-full lg:w-2/3 lg:pr-8 mb-8 lg:mb-0">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold italic text-[#37474F]">
            CONTACT US
          </h2>
          <p className="text-[#333333] py-3 md:py-5 text-sm sm:text-base md:text-lg">
            If you have any questions or need assistance, please do not hesitate to reach out.
            Our friendly and knowledgeable team is here to support you every step of the way.
          </p>
          <p className="text-[#333333] py-3 md:py-5 text-sm sm:text-base md:text-lg">
            Thank you for choosing Double Seven Lapida Maker Incorporation. We are honored to be a part of your journey in creating a lasting tribute.
          </p>
        </div>

        <div className="w-full lg:w-1/3 text-[#333333] flex flex-col items-start">
          <div className="space-y-4 w-full">
            <div className="group">
              <span className="text-[#37474F] text-sm sm:text-base md:text-lg block">PHONE:</span>
              <p className="text-lg sm:text-xl md:text-2xl hover:text-[#37474F] transition-colors duration-300">
                (+63)966-920-6512
              </p>
            </div>

            <div className="group">
              <span className="text-[#37474F] text-sm sm:text-base md:text-lg block">EMAIL:</span>
              <a
                href="mailto:al-jon.santiago@cvsu.edu.ph"
                className="text-lg sm:text-xl md:text-2xl hover:text-[#37474F] transition-colors duration-300 block"
              >
                al-jon.santiago@cvsu.edu.ph
              </a>
            </div>

            <div>
              <span className="text-[#37474F] text-sm sm:text-base md:text-lg block mb-2">SOCIAL:</span>
              <div className="flex space-x-4">
                <a
                  href="https://www.facebook.com/doublesevenlapidamakerandmarbleworks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transform transition-transform duration-300 hover:scale-110"
                >
                  <img
                    src="/assets/la--facebook.svg"
                    alt="Facebook"
                    className="w-8 h-8 sm:w-10 sm:h-10"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;