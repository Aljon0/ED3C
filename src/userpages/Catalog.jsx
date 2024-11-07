import UserHeader from "../components/UserHeader";
import UserSideBar from "../components/UserSideBar";

function Catalog(){
    
    return(<>
            <UserHeader/>
            <UserSideBar/>
            {/*Main Content*/}
            <main className="ml-64 p-8 mt-16">
                <span className="font-bold text-[#37474F] text-7xl ml-64">CATALOG</span>
                <p className="text-3xl text-[#333333] font-bold ml-16 mt-8">Gravestone</p>
            
                {/*Grid Layout for Boxes*/}
                <div className="flex items-center mt-8">
                    <img src="/assets/flowbite--angle-left-outline.svg" className="cursor-pointer mr-4"/>
            
                    {/* Grid container for the boxes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
            
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
            
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
                    </div>
            
                    <img src="/assets/flowbite--angle-right-outline.svg" className="cursor-pointer ml-4"/>
                </div>

                <p className="text-3xl text-[#333333] font-bold ml-16 mt-8">Gravestone Base</p>
                {/*Grid Layout for Boxes*/}
                <div className="flex items-center mt-8">
                    <img src="/assets/flowbite--angle-left-outline.svg" className="cursor-pointer mr-4"/>
            
                    {/*Grid container for the boxes*/}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
            
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
            
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
                    </div>
            
                    <img src="/assets/flowbite--angle-right-outline.svg" className="cursor-pointer ml-4"/>
                </div>

                <p className="text-3xl text-[#333333] font-bold ml-16 mt-8">Urns</p>
                {/*Grid Layout for Boxes*/}
                <div className="flex items-center mt-8">
                    <img src="/assets/flowbite--angle-left-outline.svg" className="cursor-pointer mr-4"/>
            
                    {/*Grid container for the boxes*/}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
            
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
            
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
                    </div>
            
                    <img src="/assets/flowbite--angle-right-outline.svg" className="cursor-pointer ml-4"/>
                </div>

                <p className="text-3xl text-[#333333] font-bold ml-16 mt-8">Table Signs</p>
                {/*Grid Layout for Boxes*/}
                <div className="flex items-center mt-8">
                    <img src="/assets/flowbite--angle-left-outline.svg" className="cursor-pointer mr-4"/>
            
                    {/*Grid container for the boxes*/}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
            
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
            
                        <div className="relative w-[200px] h-[150px] bg-[#FAFAFA] rounded shadow">
                            <img src="/assets/ph--dots-three.svg" className="absolute bottom-2 right-2"/>
                        </div>
                    </div>
            
                    <img src="/assets/flowbite--angle-right-outline.svg" className="cursor-pointer ml-4"/>
                </div>
            </main>
          </>)
}
export default Catalog; 