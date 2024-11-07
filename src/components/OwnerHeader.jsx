import { Link, useNavigate } from "react-router-dom";

function OwnerHeader() {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/login');  // Navigate to login page when logout is clicked
    };

    return (
        <>
            <header className="text-white fixed w-full flex items-center z-[50] px-[5%] py-6 left-0 top-0 border-b-[0.1rem] border-b-[rgba(0,0,0,0.2)] border-solid bg-[#2F424B] rounded-md h-18">
                {/* Logo */}
                <img src="/assets/logo2.png" className="size-10" alt="Logo" />

                {/* Name with increased size */}
                <h1 className="text-4xl font-bold italic ml-4">DOUBLE SEVEN</h1>

                {/* Icons aligned to the right */}
                <div className="ml-auto flex items-center space-x-4"> {/* Space between icons */}
                    <img src="/assets/mdi--bell-outline.svg" className="size-8 cursor-pointer" alt="Notifications" />
                    <img 
                        src="/assets/line-md--log-out.svg" 
                        className="size-8 cursor-pointer" 
                        alt="Logout"
                        onClick={handleLogout}  // Log out on click
                    />
                </div>
            </header>
        </>
    );
}

export default OwnerHeader;
