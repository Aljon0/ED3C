import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase"; // Adjust the import path
import LogoutModal from "./LogoutModal"; // Import the modal component

function OwnerHeader() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/login");
        } catch (error) {
            console.error("Error signing out:", error);
            alert("Failed to log out. Please try again.");
        }
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
                    <img
                        src="/assets/mdi--bell-outline.svg"
                        className="size-8 cursor-pointer"
                        alt="Notifications"
                    />
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

export default OwnerHeader;
