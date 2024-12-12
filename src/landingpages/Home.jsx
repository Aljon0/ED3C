function Home() {

    return (
        <section className="home flex justify-center items-center min-h-screen pt-20 pb-8 px-[9%] bg-[#CACACA]" id="home">
            <div className="home-content mr-16" data-aos="fade-down">
                <h3 className="text-[3.2rem] font-bold italic text-[#37474F]">WELCOME TO</h3>
                <p className="text-4xl mb-16">DOUBLE SEVEN LAPIDA MAKER INCORPORATION!</p>
                <a href="#get-starter" className="rounded bg-[#2F424B] font-semibold p-4 text-white hover:text-gray-300">Get Started</a>
            </div>
            <div className="home-img w-full">
                <img src="/assets/landingpage.avif" className="rounded" />
            </div>
        </section>
    );
}

export default Home;
