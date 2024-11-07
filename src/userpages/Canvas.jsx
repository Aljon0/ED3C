import UserHeader from "../components/UserHeader.jsx";
import UserSideBar from "../components/UserSideBar.jsx";

function Canvas(){
    return(<>
            <UserHeader/>
            <UserSideBar/>
            {/*Main Content */}
            <main className="ml-64 p-8 mt-16">
                {/*Updated layout for Images */}
                <span className="font-bold text-[#37474F] text-7xl ">CANVAS</span>
                <div className="flex flex-row mt-8">
                    <img src="/assets/CANVAS.jpg" className="h-[450px] w-[450px]"/>
                    <img src="/assets/GRAVESTONES-CANVAS.jpg" className="ml-14 h-[450px] w-[450px]"/>
                </div>
            </main>
          </>)
}

export default Canvas;