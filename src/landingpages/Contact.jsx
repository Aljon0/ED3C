function Contact(){

    return(
            <section className="contact bg-[#CACACA] min-h-screen pt-20 pb-8 px-[9%]" id="contact">
                <div className="flex justify-between" data-aos="fade-left">
                    <div className="w-2/3 pr-8">
                        <span className="text-7xl font-semibold italic text-[#37474F]">CONTACT US</span>
                        <p className="text-[#333333] py-5 text-2xl">If you have any questions or need assistance, please do not hesitate to reach out. 
                            Our friendly and knowledgeable team is here to support you every step of the way.</p>
                        <p className="text-[#333333] py-5 text-2xl">Thank you for choosing Double Seven Lapida Maker Incorporation. We are honored to be a part of your journey in creating a lasting tribute.</p>
                    </div>
                    <div className="w-1/3 text-[#3333333] flex flex-col items-start">
                        <span className="text-[#37474F] text-3xl pt-24">PHONE:</span>
                        <p className="mb-4 text-3xl">(+63)966-920-6512</p>
                        <span className="text-[#37474F] text-3xl">EMAIL:</span>
                        <p className="mb-4 text-2xl">al-jon.santiago@cvsu.edu.ph</p>
                        <span className="text-[#37474F] text-3xl">SOCIAL:</span>
                        <div className="flex space-x-4 mt-2">
                            <a href=""><img src="/assets/la--facebook.svg" alt="" className="w-16 h-16"/></a>
                            <a href=""><img src="/assets/mdi--instagram.svg" alt="" className="w-16 h-16"/></a>
                            <a href=""><img src="/assets/mdi--twitter.svg" alt="" className="w-16 h-16"/></a>
                        </div>
                    </div>
                </div>
            </section>  
    )
}
export default Contact;