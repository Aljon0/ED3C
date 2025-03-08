import React from 'react';
import Header from "../components/Header";
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div className="min-h-screen bg-[#CACACA] overflow-x-hidden">
            <Header />
            <section className="flex flex-col lg:flex-row justify-center items-center min-h-screen pt-20 pb-8 px-4 md:px-[5%]" id="home">
                <div className="home-content mb-8 lg:mb-0 lg:mr-8 text-center lg:text-left" data-aos="fade-down">
                    <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold italic text-[#37474F]">WELCOME TO</h3>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-8">DOUBLE SEVEN LAPIDA MAKER INCORPORATION!</p>
                    <Link
                        to="/login"
                        className="inline-block rounded bg-[#2F424B] font-semibold p-2 sm:p-3 text-sm sm:text-base text-white hover:text-gray-300"
                    >
                        Get Started
                    </Link>
                </div>
                <div className="home-img w-full sm:w-3/4 md:w-2/3 lg:w-1/2 max-w-2xl">
                    <img src="/assets/landingpage.avif" className="rounded w-full" alt="Landing page" />
                </div>
            </section>
        </div>
    );
}

export default Home;