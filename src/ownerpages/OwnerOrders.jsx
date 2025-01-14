import React, { useState, useEffect } from "react";
import { collection, getDoc, doc, updateDoc, deleteDoc, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { notifySuccess, notifyError, notifyWarning } from "../general/CustomToast.js"
import notifications from "../components/notifications.jsx";

    function OwnerOrders() {
        const [orders, setOrders] = useState([]);
        const [selectedOrder, setSelectedOrder] = useState(null);
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
        const [orderToDelete, setOrderToDelete] = useState(null);
        const [expectedDate, setExpectedDate] = useState("");
        const [rejectReason, setRejectReason] = useState("");
        const [searchQuery, setSearchQuery] = useState("");

        const createNotification = async (userId, message, orderId) => {
            if (!userId) {
                notifyError("No userId provided for notification");
                return;
            }
            
            try {
                await addDoc(collection(db, 'notifications'), {
                    userId, // The customer's ID who placed the order
                    message,
                    orderId,
                    timestamp: serverTimestamp(),
                    read: false,
                    type: 'order',
                    recipientType: 'customer' // Indicates this notification is for a customer
                });
            } catch (error) {
                notifyError("Error creating notification:", error);
                throw error;
            }
        };
        
        // Use onSnapshot for real-time updates
        useEffect(() => {
            const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
                const ordersData = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(order => 
                        // Only show orders that are:
                        // 1. Not archived AND
                        // 2. Not cancelled AND
                        // 3. Not finished
                        !order.isArchived && 
                        order.status !== 'Cancelled' &&
                        order.status !== 'Finished'
                    );
                setOrders(ordersData);
            }, (error) => {
                notifyError("Error fetching orders: ", error);
            });
        
            return () => unsubscribe();
        }, []);

        const handleDeleteOrder = async () => {
            if (!orderToDelete) return;

            try {
                await deleteDoc(doc(db, 'orders', orderToDelete));
                setIsDeleteModalOpen(false);
                setOrderToDelete(null);
                notifySuccess("Order deleted successfully");
            } catch (error) {
                notifyError("Error deleting order: ", error);
                notifyError("Error deleting order. Please try again.");
            }
        };
        
        const handleCancelOrder = async (orderId) => {
            try {
                const orderRef = doc(db, 'orders', orderId);
                const orderSnap = await getDoc(orderRef);
                
                if (!orderSnap.exists()) {
                    notifyError("Order not found");
                    return;
                }
        
                const orderData = { id: orderSnap.id, ...orderSnap.data() };
        
                // Create a transaction record for the cancelled order
                const transactionRef = await addDoc(collection(db, 'transactions'), {
                    // Customer Information
                    customerId: orderData.customerId || '',
                    customerName: orderData.customerName || '',
                    customerEmail: orderData.customerEmail || '',
                    customerContact: orderData.customerContact || '',
                    customerAddress: orderData.customerAddress || '',
        
                    // Order Details
                    orderId: orderId,
                    item: orderData.item || '',
                    material: orderData.material || '',
                    size: orderData.size || '',
                    design: orderData.design || null,
                    
                    // Dates
                    dateOrdered: orderData.dateOrdered || new Date().toISOString(),
                    completedDate: serverTimestamp(),
                    lastUpdated: serverTimestamp(),
                    transactionDate: serverTimestamp(),
                    expectedDate: orderData.expectedDate || null,
                    
                    // Payment Information
                    paymentType: orderData.paymentType || '',
                    amount: orderData.amount || 0,
                    baseCost: orderData.baseCost || 0,
                    totalAmount: orderData.totalAmount || 0,
                    
                    // Status
                    status: 'Cancelled',
                    
                    // Add-ons
                    addOns: orderData.addOns || [],
                    pictureFrameSize: orderData.pictureFrameSize || null,
                    pictureFrameImage: orderData.pictureFrameImage || null,
                    selectedBaseSize: orderData.selectedBaseSize || null,
                    nameCount: orderData.nameCount || null,
                    
                    // Images
                    sceneImage: orderData.sceneImage || null,
                    receiptImage: orderData.receiptImage || null,
                    receiptUploadDate: orderData.receiptUploadDate || null,
                    secondReceiptImage: orderData.secondReceiptImage || null,
                    secondReceiptUploadDate: orderData.secondReceiptUploadDate || null
                });
        
                if (transactionRef) {
                    // Update the order status and archive it
                    await updateDoc(orderRef, {
                        status: 'Cancelled',
                        lastUpdated: serverTimestamp(),
                        isArchived: true // This will remove it from the orders view
                    });
        
                    // Create notification for the customer
                    await createNotification(
                        orderData.customerId,
                        `Your order #${orderId.slice(0, 8)} has been cancelled.`,
                        orderId
                    );
        
                    notifySuccess("Order cancelled and moved to Transaction History");
                    
                    // Close modal if it's open
                    if (isModalOpen) {
                        setIsModalOpen(false);
                    }
                }
            } catch (error) {
                notifyError("Error cancelling order:", error);
                notifyError("Error cancelling order. Please try again.");
            }
        };

        const handleSearch = (query) => {
            setSearchQuery(query);
        };

        const handleViewOrder = (order) => {
            setSelectedOrder(order);
            setIsModalOpen(true);
            setExpectedDate(order.expectedDate || "");
        };

        const updateOrderStatus = async (orderId, newStatus) => {
            try {
                const orderRef = doc(db, 'orders', orderId);
                const orderSnap = await getDoc(orderRef);
                
                if (!orderSnap.exists()) {
                    notifyError("Order not found");
                    return;
                }
        
                const orderData = { id: orderSnap.id, ...orderSnap.data() };
        
                if (!orderData.customerId) {
                    notifyError("Customer ID not found on order");
                    return;
                }
        
                if (newStatus === 'Finished') {
                    // Create transaction document but don't delete the order
                    const transactionRef = await addDoc(collection(db, 'transactions'), {
                        customerId: orderData.customerId || '',
                        customerName: orderData.customerName || '',
                        customerEmail: orderData.customerEmail || '',
                        customerContact: orderData.customerContact || '',
                        customerAddress: orderData.customerAddress || '',
            
                        // Order Details
                        orderId: orderId,
                        item: orderData.item || '',
                        material: orderData.material || '',
                        size: orderData.size || '',
                        design: orderData.design || null,
                        
                        // Dates
                        dateOrdered: orderData.dateOrdered || new Date().toISOString(),
                        completedDate: serverTimestamp(),
                        lastUpdated: serverTimestamp(),
                        transactionDate: serverTimestamp(),
                        expectedDate: orderData.expectedDate || null,
                        
                        // Payment Information
                        paymentType: orderData.paymentType || '',
                        amount: orderData.amount || 0,
                        baseCost: orderData.baseCost || 0,
                        totalAmount: orderData.totalAmount || 0,
                        
                        // Status
                        status: newStatus,
                        
                        // Add-ons
                        addOns: orderData.addOns || [],
                        pictureFrameSize: orderData.pictureFrameSize || null,
                        pictureFrameImage: orderData.pictureFrameImage || null,
                        selectedBaseSize: orderData.selectedBaseSize || null,
                        nameCount: orderData.nameCount || null,
                        
                        // Images
                        sceneImage: orderData.sceneImage || null,
                        receiptImage: orderData.receiptImage || null,
                        receiptUploadDate: orderData.receiptUploadDate || null,
                        secondReceiptImage: orderData.secondReceiptImage || null,
                        secondReceiptUploadDate: orderData.secondReceiptUploadDate || null
                    });
                    
                    if (transactionRef) {
                        // Update the order status instead of deleting it
                        await updateDoc(orderRef, {
                            status: newStatus,
                            lastUpdated: serverTimestamp(),
                            isArchived: true // Add this field to filter out finished orders from owner view
                        });
        
                        // Send notification
                        await notifications.createCustomerNotification(
                            orderData.customerId,
                            `Your order #${orderId.slice(0, 8)} has been completed! You can now pick up your order.`,
                            orderId
                        );
                        
                        notifySuccess('Order marked as finished and moved to Transaction History');
                    }
                } else {
                    
                    await updateDoc(orderRef, {
                        status: newStatus,
                        lastUpdated: serverTimestamp()
                    });
        
                    let message = '';
                    switch(newStatus) {
                        case '1ST PAYMENT':
                            message = `Your order #${orderId.slice(0, 8)} has been accepted. Please upload your first payment receipt.`;
                            break;
                        case 'Processing':
                            message = `Your order #${orderId.slice(0, 8)} is now being processed.`;
                            break;
                        case '2ND PAYMENT':
                            message = `Your order #${orderId.slice(0, 8)} requires second payment. Please upload the receipt.`;
                            break;
                        case 'Finished':
                            message = `Your order #${orderId.slice(0, 8)} has been completed! You can now pick up your order.`;
                            break;
                        default:
                            message = `Your order #${orderId.slice(0, 8)} status has been updated to ${newStatus}.`;
                    }
        
                    await notifications.createCustomerNotification(
                        orderData.customerId,
                        message,
                        orderId
                    );
        
                    notifySuccess(`Order status updated to ${newStatus}`);
                    }
                } catch (error) {
                    notifyError("Error updating order status:", error);
                    notifyError("Error updating order status. Please try again.");
                }
            };
            
        useEffect(() => {
            const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
                const ordersData = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(order => !order.isArchived); // Filter out archived orders from owner view
                setOrders(ordersData);
            }, (error) => {
                notifyError("Error fetching orders: ", error);
            });
        
            return () => unsubscribe();
        }, []);
        
        const filteredOrders = orders.filter(order => 
            order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
            order.status !== 'Finished'
        );

        const handleAcceptOrder = async () => {
            if (!expectedDate) {
                notifyWarning("Please set an expected completion date");
                return;
            }
        
            try {
                await updateDoc(doc(db, 'orders', selectedOrder.id), {
                    status: '1ST PAYMENT',
                    expectedDate: expectedDate,
                    lastUpdated: serverTimestamp()
                });
        
                // Notify customer about order acceptance and payment requirement
                await createNotification(
                    selectedOrder.customerId,
                    `Your order #${selectedOrder.id.slice(0, 8)} has been accepted. Please upload your first payment receipt.`,
                    selectedOrder.id
                );
        
                setIsModalOpen(false);
                notifySuccess("Order accepted and awaiting first payment");
            } catch (error) {
                notifyError("Error accepting order: ", error);
                notifyError("Error accepting order. Please try again.");
            }
        };

        const handleRejectOrder = async () => {
            if (!rejectReason.trim()) {
                notifyWarning("Please provide a reason for rejecting the order");
                return;
            }

            try {
                await updateDoc(doc(db, 'orders', selectedOrder.id), {
                    status: 'Rejected',
                    rejectionReason: rejectReason,
                    lastUpdated: serverTimestamp()
                });
        
                // Only notify the specific customer about their order rejection
                await createNotification(
                    selectedOrder.customerId,
                    `Your order #${selectedOrder.id.slice(0, 8)} has been rejected. Reason: ${rejectReason}`,
                    selectedOrder.id
                );
        
                setIsModalOpen(false);
                setRejectReason("");
                notifySuccess("Order rejected successfully");
            } catch (error) {
                notifyError("Error rejecting order: ", error);
                notifyError("Error rejecting order. Please try again.");
            }
        };

        const getStatusColor = (status) => {
            switch (status) {
                case 'Pending':
                    return 'text-yellow-600';
                case '1ST PAYMENT':
                    return 'text-orange-600';
                case 'Processing':
                    return 'text-blue-600';
                case '2ND PAYMENT':
                    return 'text-purple-600';
                case 'Finished':
                    return 'text-green-600';
                case 'Rejected':
                    return 'text-red-600';
                case 'Cancelled':
                    return 'text-red-600';
                default:
                    return 'text-gray-600';
            }
        };

        const formatAddOns = (order) => {
            if (!order.addOns || !Array.isArray(order.addOns)) return "None";

            return order.addOns.map(addon => {
                switch (addon) {
                    case "Picture Frame":
                        return (
                            <div className="space-y-2">
                                <p>Picture Frame ({order.pictureFrameSize || 'Size not specified'})</p>
                                {order.pictureFrameImage && (
                                    <img 
                                        src={order.pictureFrameImage} 
                                        alt="Picture Frame" 
                                        className="max-w-[200px] h-auto rounded-md shadow-sm"
                                    />
                                )}
                            </div>
                        );
                    case "Gravestone Base":
                        return `Gravestone Base (${order.selectedBaseSize || 'Size not specified'})`;
                    case "Per Name":
                        return `Names (${order.nameCount || 0} names)`;
                    default:
                        return addon;
                }
            });
        };

        return (
            <>
                <OwnerHeader />
                <OwnerSideBar />
                <main className="ml-64 p-8 mt-16">
                    <div className="w-[950px] h-[670px] bg-[#FAFAFA] rounded-md p-6">
                        <span className="text-4xl text-[#2F424B] font-semibold mb-4 block">ORDER STATUS</span>

                        <SearchBar onSearch={handleSearch} />

                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">CUSTOMER'S NAME</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">DATE ORDERED</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">STATUS</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">EXPECTED DATE/TIME</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders
                                    .filter(order => 
                                        order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    .map((order) => (
                                    <tr key={order.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {order.customerName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(order.dateOrdered).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <select
                                                value={order.status}
                                                onChange={(e) => e.target.value === 'Cancelled' ? 
                                                    handleCancelOrder(order.id) : 
                                                    updateOrderStatus(order.id, e.target.value)
                                                }
                                                className={`border rounded-md px-2 py-1 ${getStatusColor(order.status)}`}
                                                disabled={order.status === 'Cancelled' || order.status === 'Rejected' || order.status === 'Finished'}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="1ST PAYMENT">1ST PAYMENT</option>
                                                <option value="Processing">Processing</option>
                                                <option value="2ND PAYMENT">2ND PAYMENT</option>
                                                <option value="Finished">Finished</option>
                                                <option value="Cancelled">Cancel Order</option>
                                                {(order.status === 'Rejected') && (
                                                    <option value="Rejected">Rejected</option>
                                                )}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.expectedDate ? new Date(order.expectedDate).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 cursor-pointer flex items-center space-x-2">
                                            <img
                                                src="/assets/mdi--eye.svg"
                                                alt="View"
                                                className="w-5 h-5 cursor-pointer"
                                                onClick={() => handleViewOrder(order)}
                                            />
                                            <img
                                                src="/assets/bx--trash.svg"
                                                alt="Delete"
                                                className="w-5 h-5 cursor-pointer text-red-500"
                                                onClick={() => {
                                                    setOrderToDelete(order.id);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
        
                {/* Order Details Modal */}
                {isModalOpen && selectedOrder && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                            <div className="p-6 border-b border-gray-200 relative">
                                <h2 className="text-2xl font-bold text-[#2F424B]">Order Details</h2>
                                <img
                                    src="/assets/line-md--remove.svg"
                                    alt="Close"
                                    className="w-6 h-6 absolute top-6 right-6 cursor-pointer"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setRejectReason("");
                                    }}
                                />
                            </div>
                    
                            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedOrder.sceneImage && (
                                        <div className="mb-6">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Design Preview</p>
                                            <img 
                                                src={selectedOrder.sceneImage}
                                                alt="Design Preview" 
                                                className="w-full max-w-md h-auto rounded-lg shadow-sm mx-auto"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Customer Name</p>
                                        <p className="text-lg">{selectedOrder.customerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Contact</p>
                                        <p className="text-lg">{selectedOrder.customerContact}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Email</p>
                                        <p className="text-lg">{selectedOrder.customerEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Address</p>
                                        <p className="text-lg">{selectedOrder.customerAddress}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Item</p>
                                        <p className="text-lg">{selectedOrder.item}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Material</p>
                                        <p className="text-lg">{selectedOrder.material}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Size</p>
                                        <p className="text-lg">{selectedOrder.size}</p>
                                    </div>

                                    {/* Order Details */}
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Date Ordered</p>
                                        <p className="text-lg">{new Date(selectedOrder.dateOrdered).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Status</p>
                                        <p className={`text-lg ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</p>
                                    </div>

                                    {/* Product Details */}
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Item</p>
                                        <p className="text-lg">{selectedOrder.item}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Material</p>
                                        <p className="text-lg">{selectedOrder.material}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Size</p>
                                        <p className="text-lg">{selectedOrder.size}</p>
                                    </div>

                                    {selectedOrder.item === 'table-signs' && selectedOrder.design && (
                                        <div className="col-span-2">
                                            <p className="text-sm font-medium text-gray-500">Selected Design</p>
                                            <div className="mt-2">
                                                <p className="text-lg mb-2">{selectedOrder.design.name}</p>
                                                <img 
                                                    src={selectedOrder.design.url} 
                                                    alt={selectedOrder.design.name}
                                                    className="max-w-[300px] h-auto rounded-lg shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Add-ons Section */}
                                    <div className="col-span-2">
                                        <p className="text-sm font-medium text-gray-500 mb-2">Add-ons</p>
                                        <div className="space-y-4">
                                            {formatAddOns(selectedOrder).map((addon, index) => (
                                                <div key={index} className="text-lg">
                                                    {addon}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pricing Details */}
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Base Price</p>
                                        <p className="text-lg">₱{selectedOrder.baseCost?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Add-ons Cost</p>
                                        <p className="text-lg">₱{((selectedOrder.totalAmount || 0) - (selectedOrder.baseCost || 0)).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Payment Type</p>
                                        <p className="text-lg">{selectedOrder.paymentType}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Amount Due</p>
                                        <p className="text-lg">₱{selectedOrder.amount?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Amount</p>
                                        <p className="text-lg">₱{selectedOrder.totalAmount?.toLocaleString()}</p>
                                    </div>
                                </div>

                                {selectedOrder.receiptImage && (
                                    <div className="mt-6">
                                        <p className="text-sm font-medium text-gray-700 mb-2">First Receipt</p>
                                        <img 
                                            src={selectedOrder.receiptImage} 
                                            alt="Payment Receipt" 
                                            className="max-w-full h-auto rounded-md shadow-sm"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Uploaded on: {new Date(selectedOrder.receiptUploadDate).toLocaleString()}
                                        </p>
                                    </div>
                                )}

                                {/* Add Second Receipt Section */}
                                {selectedOrder.secondReceiptImage && (
                                    <div className="mt-6">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Second Receipt</p>
                                        <img 
                                            src={selectedOrder.secondReceiptImage} 
                                            alt="Second Payment Receipt" 
                                            className="max-w-full h-auto rounded-md shadow-sm"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Uploaded on: {new Date(selectedOrder.secondReceiptUploadDate).toLocaleString()}
                                        </p>
                                    </div>
                                )}

                                {selectedOrder.status === 'Pending' && (
                                    <>
                                        <div className="mt-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Expected Completion Date
                                            </label>
                                            <input
                                                type="datetime-local"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F424B] focus:border-transparent"
                                                value={expectedDate}
                                                onChange={(e) => setExpectedDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Rejection Reason
                                            </label>
                                            <textarea
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F424B] focus:border-transparent"
                                                rows="4"
                                                placeholder="Enter reason for rejection..."
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                    
                            {/* Footer */}
                            <div className="p-6 border-t border-gray-200">
                                <div className="flex justify-end space-x-4">
                                    {selectedOrder.status === 'Pending' && (
                                        <>
                                            <button
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200"
                                                onClick={handleRejectOrder}
                                            >
                                                Reject Order
                                            </button>
                                            <button
                                                className="px-4 py-2 bg-[#2F424B] hover:bg-[#445166] text-white rounded-md transition-colors duration-200"
                                                onClick={handleAcceptOrder}
                                            >
                                                Accept Order
                                            </button>
                                        </>
                                    )}
                                    {selectedOrder.status !== 'Cancelled' && 
                                    selectedOrder.status !== 'Rejected' && 
                                    selectedOrder.status !== 'Finished' && (
                                        <button
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200"
                                            onClick={() => {
                                                handleCancelOrder(selectedOrder.id);
                                                setIsModalOpen(false);
                                            }}
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>            
                )}
        
                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Delete Order</h2>
                                <p className="text-gray-600 mb-6">Are you sure you want to delete this order?</p>
        
                                <div className="flex justify-end space-x-4">
                                    <button
                                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                                        onClick={() => {
                                            setIsDeleteModalOpen(false);
                                            setOrderToDelete(null);
                                        }}
                                    >
                                        No, Cancel
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                                        onClick={handleDeleteOrder}
                                    >
                                        Yes, Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    export default OwnerOrders;