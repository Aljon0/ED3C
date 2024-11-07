function Sample(){

    return(
            <section className="sample flex justify-center min-h-screen pt-20 pb-8 px-[9%] bg-[#CACACA]" id="sample">
                <div className="text-black text-center " data-aos="fade-up">
                    <span className="text-7xl font-semibold italic text-center text-[#37474F]">SAMPLE</span>
                    <div className="flex flex-wrap justify-center mt-8 space-x-8">
                        <div className="flex flex-col items-center w-64">
                            <img src="/assets/bi--badge-3d.svg" alt="" className="w-16 h-16"/>
                            <span className="mt-4 text-xl font-semibold">Interactive 3D Customization</span>
                            <p className="mt-2 text-lg text-center">ED3C allows you to design memorials in a fully interactive 3D environment. 
                            You can visualize every detail, from the material and texture to the inscription and decorative elements, ensuring that the final product perfectly matches your vision.</p>
                        </div>
                        <div className="flex flex-col items-center w-64">
                            <img src="/assets/mdi--user-multiple-check-outline.svg" alt="" className="w-16 h-16"/>
                            <span className="mt-4 text-xl font-semibold">User Collaboration</span>
                            <p className="mt-2 text-lg text-center">Collaborate with others in real-time to create the perfect memorial. Share your designs and receive instant feedback from family and friends.</p>
                        </div>
                        <div className="flex flex-col items-center w-64">
                            <img src="/assets/solar--high-quality-broken.svg" alt="" className="w-16 h-16"/>
                            <span className="mt-4 text-xl font-semibold">High Quality</span>
                            <p className="mt-2 text-lg text-center">We use the highest quality materials and craftsmanship to ensure that your memorial is durable and beautiful.</p>
                        </div>
                    </div>
                </div>
            </section>
    )
}
export default Sample;