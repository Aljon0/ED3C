    import React, { useState, useEffect } from 'react';

    export const Alert = ({
        type = 'success',
        message,
        isOpen,
        onClose,
        duration = 3000
    }) => {
        useEffect(() => {
            if (isOpen) {
                const timer = setTimeout(onClose, duration);
                return () => clearTimeout(timer);
            }
        }, [isOpen, onClose, duration]);

        if (!isOpen) return null;

        // Define color and icon based on type
        const alertStyles = {
            success: {
                bg: 'bg-green-700',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                )
            },
            error: {
                bg: 'bg-red-700',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            }
        };

        const { bg, icon } = alertStyles[type];

        return (
            <div className="fixed top-4 right-4 z-50">
                <div className={`${bg} text-white px-6 py-4 rounded-lg shadow-xl flex items-center space-x-3 animate-slide-in-right`}>
                    {icon}
                    <div>
                        <p className="font-semibold">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 hover:text-gray-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    };

    export const DeletionAlert = ({
        isOpen,
        onClose,
        onConfirm,
        title = "Confirm Deletion",
        message = "Are you sure you want to delete this item?",
        confirmText = "Delete",
        cancelText = "Cancel"
    }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-[#2F424B] rounded-lg shadow-xl w-[400px] p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-300 transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <p className="text-gray-300 mb-6">{message}</p>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        );
    };