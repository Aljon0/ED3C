import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { notifySuccess, notifyError } from "../general/CustomToast.js";

const WalkInOrderModal = ({ isOpen, onClose }) => {
  const [orderData, setOrderData] = useState({
    customerName: '',
    customerContact: '',
    customerEmail: '',
    customerAddress: '',
    item: '',
    material: '',
    size: '',
    addOns: [],
    paymentType: 'Full Payment',
    status: 'Pending',
    totalAmount: '',
    baseCost: '',
    expectedDate: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddOnChange = (e) => {
    const value = e.target.value;
    setOrderData(prev => ({
      ...prev,
      addOns: prev.addOns.includes(value)
        ? prev.addOns.filter(addon => addon !== value)
        : [...prev.addOns, value]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderToSubmit = {
        ...orderData,
        dateOrdered: new Date().toISOString(),
        lastUpdated: serverTimestamp(),
        isArchived: false,
        customerId: 'WALK-IN-' + Date.now(),
      };

      await addDoc(collection(db, 'orders'), orderToSubmit);
      notifySuccess('Walk-in order added successfully');
      onClose();
    } catch (error) {
      notifyError('Error adding walk-in order');
      console.error('Error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#2F424B]">Add Walk-In Order</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                name="customerName"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={orderData.customerName}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="text"
                name="customerContact"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={orderData.customerContact}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="customerEmail"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={orderData.customerEmail}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="customerAddress"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={orderData.customerAddress}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <input
                type="text"
                name="item"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={orderData.item}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
              <input
                type="text"
                name="material"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={orderData.material}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <input
                type="text"
                name="size"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={orderData.size}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={orderData.status}
                onChange={handleInputChange}
              >
                <option value="Pending">Pending</option>
                <option value="1ST PAYMENT">1ST PAYMENT</option>
                <option value="Processing">Processing</option>
                <option value="2ND PAYMENT">2ND PAYMENT</option>
                <option value="Finished">Finished</option>
              </select>
            </div>
          </div>

          {/* Add-ons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add-ons</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="Picture"
                  checked={orderData.addOns.includes('Picture')}
                  onChange={handleAddOnChange}
                  className="mr-2"
                />
                Picture Frame
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="Gravestone Base"
                  checked={orderData.addOns.includes('Gravestone Base')}
                  onChange={handleAddOnChange}
                  className="mr-2"
                />
                Gravestone Base
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="Per Name"
                  checked={orderData.addOns.includes('Per Name')}
                  onChange={handleAddOnChange}
                  className="mr-2"
                />
                Per Name
              </label>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
              <select
                name="paymentType"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={orderData.paymentType}
                onChange={handleInputChange}
              >
                <option value="Full Payment">Full Payment</option>
                <option value="50% Down Payment">50% Down Payment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Cost</label>
              <input
                type="number"
                name="baseCost"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={orderData.baseCost}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <input
                type="number"
                name="totalAmount"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={orderData.totalAmount}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Completion Date</label>
              <input
                type="datetime-local"
                name="expectedDate"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={orderData.expectedDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2F424B] text-white rounded-md hover:bg-[#445166]"
            >
              Add Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WalkInOrderModal;