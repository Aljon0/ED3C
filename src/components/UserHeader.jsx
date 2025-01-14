import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import LogoutModal from "./LogoutModal"; // Import the modal component
import UserNotifications from "./UserNotifications";

function UserHeader() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();
    const auth = getAuth();

    const handleLogout = () => {
        signOut(auth)
            .then(() => {
                navigate("/login");
            })
            .catch((error) => {
                console.error("Error logging out: ", error);
            });
    };

    return (
        <>
            <header className="text-white fixed w-full flex items-center z-[50] px-[5%] py-6 left-0 top-0 border-b-[0.1rem] border-b-[rgba(0,0,0,0.2)] border-solid bg-[#2F424B] rounded-md h-18">
                {/* Logo */}
                <img src="/assets/logo2.png" className="size-10" alt="Logo" />

                {/* Name with increased size */}
                <h1 className="text-4xl font-bold italic ml-4">DOUBLE SEVEN</h1>

                {/* Icons aligned to the right */}
                <div className="ml-auto flex items-center space-x-4">
                    <UserNotifications/>
                    <img
                        src="/assets/line-md--log-out.svg"
                        className="size-8 cursor-pointer"
                        alt="Logout"
                        onClick={() => setIsModalOpen(true)}
                    />
                </div>
            </header>

            {/* Logout Modal */}
            <LogoutModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => {
                    setIsModalOpen(false);
                    handleLogout();
                }}
            />
        </>
    );
}

export default UserHeader;
