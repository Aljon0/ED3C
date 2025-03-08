import React from "react";

const CustomerReceipt = ({ receiptData, onClose }) => {
    // Add null checks and provide default values
    const { 
        customerName = 'N/A', 
        price = 0, 
        paymentMethod = 'N/A', 
        receiptImage, 
        date, 
        status = 'N/A', 
        isSecondReceipt 
    } = receiptData || {};

    const handlePrint = () => {
        const printContent = document.getElementById("printable-receipt-content");
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <html>
                <head>
                    <title>Payment Receipt</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .receipt { max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; }
                        .receipt img { max-width: 100%; height: auto; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 border-4 border-dashed border-gray-300">
                <div className="text-center mb-6 border-b-2 border-black pb-4">
                    <h1 className="text-3xl font-bold text-[#2F424B]">Payment Receipt</h1>
                    <p className="text-sm text-gray-600">
                        {isSecondReceipt ? "Second Payment" : "First Payment"}
                    </p>
                </div>

                <div id="printable-receipt-content" className="space-y-4">
                    <div className="flex justify-between border-b py-2">
                        <span className="font-medium text-gray-700">Customer Name:</span>
                        <span>{customerName}</span>
                    </div>
                    <div className="flex justify-between border-b py-2">
                        <span className="font-medium text-gray-700">Amount Paid:</span>
                        <span>₱{(typeof price === 'number' ? price : 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b py-2">
                        <span className="font-medium text-gray-700">Payment Method:</span>
                        <span>{paymentMethod}</span>
                    </div>
                    <div className="flex justify-between border-b py-2">
                        <span className="font-medium text-gray-700">Date:</span>
                        <span>{date ? new Date(date).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b py-2">
                        <span className="font-medium text-gray-700">Status:</span>
                        <span>{status}</span>
                    </div>
                </div>

                <div className="mt-6 text-center border-t-2 border-black pt-4">
                    <p className="text-sm text-gray-600">Thank You for Your Purchase!</p>
                </div>

                <div className="mt-4 flex justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-[#2F424B] text-white rounded-md hover:bg-[#445166]"
                    >
                        Print Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerReceipt;