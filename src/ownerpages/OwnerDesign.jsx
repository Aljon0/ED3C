import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";
import { NavLink } from "react-router-dom";
function OwnerDesign(){

    return(<>
            <OwnerHeader/>
            <OwnerSideBar/>
            <main className="ml-64 p-8 mt-16">
            <div className="flex items-center ml-16 ">
                <span className="font-bold text-[#37474F] text-7xl ml-48">CATALOG</span>
            </div>

            <div className="flex items-center justify-end mt-8 ml-16">
                <NavLink to="/owner/ElementsDesign" className="text-[#37474F] text-3xl underline">Gravestone Design Elements</NavLink>
            </div>

            {/* Main Container */}
            <div className="relative bg-[#2F424B] w-[700px] h-[500px] rounded mt-12 p-4 overflow-y-auto">
                    {/* Category Dropdown */}
                    <div
                        className="flex items-center cursor-pointer mb-4"
                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    >
                        <img
                            src="/assets/icon-park-outline--category-management.svg"
                            className="w-6 h-6 mr-2"
                            alt="Category"
                        />
                    </div>

                    <div className="relative mt-4 w-[150px] h-[100px] bg-[#DADADA] rounded cursor-pointer mr-4 mb-4">
                    </div>
                </div>

        </main>
          </>)
}
export default OwnerDesign;