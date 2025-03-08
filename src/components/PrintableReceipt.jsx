import React, { useState } from "react";

const PrintableReceipt = ({ receiptData, onClose, onSave }) => {
    const { customerName, price, paymentMethod, receiptImage, date, status, isSecondReceipt } = receiptData;
    const [editablePrice, setEditablePrice] = useState(price);
    const [editableStatus, setEditableStatus] = useState(status);

    // Function to handle saving the edited amount and status
    const handleSave = () => {
        onSave({
            price: editablePrice,
            status: editableStatus,
        });
        onClose();
    };

    // Function to handle printing
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
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-8 border-4 border-dashed border-gray-300">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-[#2F424B]">
                {isSecondReceipt ? "Second Payment Receipt" : "First Payment Receipt"}
              </h1>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <img src="/assets/line-md--remove.svg" alt="Close" className="w-6 h-6" />
              </button>
            </div>
    
            <div id="printable-receipt-content" className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Customer Name</p>
                <input
                  type="text"
                  value={customerName}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2F424B]"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Amount Paid</p>
                <input
                  type="text"
                  value={editablePrice}
                  onChange={(e) => setEditablePrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F424B]"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Payment Method</p>
                <input
                  type="text"
                  value={paymentMethod}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2F424B]"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                <select
                  value={editableStatus}
                  onChange={(e) => setEditableStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F424B]"
                >
                  <option value="Unverified">Unverified</option>
                  <option value="Verified">Verified</option>
                </select>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Date</p>
                <input
                  type="text"
                  value={new Date(date).toLocaleString()}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2F424B]"
                />
              </div>
            </div>
    
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Save
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

export default PrintableReceipt;