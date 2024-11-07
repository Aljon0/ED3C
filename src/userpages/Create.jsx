import UserHeader from "../components/UserHeader.jsx";
import UserSideBar from "../components/UserSideBar.jsx";

function Create(){

    return(<>
            <UserHeader/>
            <UserSideBar/>
            <main className="ml-64 p-8 mt-16">
                <span className="font-bold text-[#37474F] text-4xl">Customize Your Own</span>
                {/*Corrected border and rounded class*/}
                <a href="Payment.html" className="text-[#333333] text-2xl bg-[#FAFAFA] border border-solid border-black rounded flex mt-[550px] ml-[650px] p-2">Proceed To Payment</a>
            </main>
          </>)
}
export default Create;