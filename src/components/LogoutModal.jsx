import React from "react";

function LogoutModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#2F424B] rounded-lg shadow-lg w-96 p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Confirm Logout</h2>
                <p className="text-gray-300 mb-6">Are you sure you want to log out of Double Seven?</p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[#4C6B7A] text-white rounded-lg hover:bg-[#5c809b]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-[#E74C3C] text-white rounded-lg hover:bg-[#c0392b]"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LogoutModal;