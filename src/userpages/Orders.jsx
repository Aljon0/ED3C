import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from "react";
import { auth, db, storage } from '../firebase';
import { notifyError, notifySuccess } from "../general/CustomToast.js";
import notifications from '../components/notifications.jsx';
import Navigation from '../components/Navigation.jsx';
import CustomerReceipt from '../components/CustomerReceipt.jsx';

function Orders() {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [receiptImage, setReceiptImage] = useState(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [secondReceiptImage, setSecondReceiptImage] = useState(null);
    const [secondUploadLoading, setSecondUploadLoading] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [receiptData, setReceiptData] = useState({
        customerName: '',
        price: 0,
        paymentMethod: '',
        receiptImage: '',
        date: new Date().toISOString(),
        status: 'Pending', // or 'Verified'
        isSecondReceipt: false // true for second payment
    });

    const handleViewReceipt = (order, isSecondReceipt = false) => {
        setReceiptData({
            customerName: order.customerName,
            price: isSecondReceipt ? order.secondAmount : order.amount,
            paymentMethod: order.paymentType,
            receiptImage: isSecondReceipt ? order.secondReceiptImage : order.receiptImage,
            date: isSecondReceipt ? order.secondReceiptUploadDate : order.receiptUploadDate,
            status: isSecondReceipt ? order.secondPaymentStatus : order.paymentStatus,
            isSecondReceipt
        });
        setIsReceiptOpen(true);
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        let unsubscribeOrders;

        if (user) {
            setLoading(true);
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where("customerEmail", "==", user.email));

            unsubscribeOrders = onSnapshot(q, (snapshot) => {
                const ordersData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setOrders(ordersData);
                setLoading(false);
            }, (error) => {
                notifyError("Error fetching orders: ", error);
                setLoading(false);
            });
        }

        return () => {
            if (unsubscribeOrders) {
                unsubscribeOrders();
            }
        };
    }, [user]);

    // Add a function to get status display style
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
                return 'text-gray-600';
            default:
                return 'text-gray-600';
        }
    };

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) {
            return;
        }

        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists()) {
                notifyError("Order not found");
                return;
            }

            const orderData = orderSnap.data();

            // Create a transaction record for the cancelled order
            await addDoc(collection(db, 'transactions'), {
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

            // Update the order status and archive it
            await updateDoc(orderRef, {
                status: 'Cancelled',
                lastUpdated: serverTimestamp(),
                isArchived: true
            });

            // Create notification for owner
            await notifications.createOwnerNotification(
                `Order #${orderId.slice(0, 8)} has been cancelled by the customer.`,
                orderId
            );

            setIsModalOpen(false);
            notifySuccess("Order cancelled successfully");
        } catch (error) {
            notifyError("Error cancelling order:", error);
            notifyError("Error cancelling order: " + error.message);
        }
    };

    const handleImageUpload = async (orderId) => {
        if (!receiptImage) {
            notifyError("Please select an image first");
            return;
        }

        setUploadLoading(true);
        try {
            // Get the order details first
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            const orderData = orderSnap.exists() ? orderSnap.data() : null;

            if (!orderData) {
                notifyError("Order not found");
                return;
            }

            // Upload image
            const imageRef = ref(storage, `receipts/${orderId}_first_${Date.now()}`);
            await uploadBytes(imageRef, receiptImage);
            const imageUrl = await getDownloadURL(imageRef);

            // Update order document
            await updateDoc(orderRef, {
                receiptImage: imageUrl,
                receiptUploadDate: new Date().toISOString(),
                status: 'Processing',
                lastUpdated: serverTimestamp()
            });

            // Create notification for owner with detailed information
            await notifications.createOwnerNotification(
                `First payment receipt uploaded for Order #${orderId.slice(0, 8)} by ${orderData.customerName || 'Customer'}. Please verify the Payment.`,
                orderId
            );

            notifySuccess("Receipt uploaded successfully");
            setReceiptImage(null);
            setIsModalOpen(false);
        } catch (error) {
            notifyError("Error in handleImageUpload:", error);
            notifyError("Error uploading receipt. Please try again.");
        } finally {
            setUploadLoading(false);
        }
    };

    const handleSecondImageUpload = async (orderId) => {
        if (!secondReceiptImage) {
            notifyError("Please select an image first");
            return;
        }

        setSecondUploadLoading(true);
        try {
            // Get the order details first
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            const orderData = orderSnap.exists() ? orderSnap.data() : null;

            if (!orderData) {
                notifyError("Order not found");
                return;
            }

            // Upload image
            const imageRef = ref(storage, `receipts/${orderId}_second_${Date.now()}`);
            await uploadBytes(imageRef, secondReceiptImage);
            const imageUrl = await getDownloadURL(imageRef);

            // Update order document
            await updateDoc(orderRef, {
                secondReceiptImage: imageUrl,
                secondReceiptUploadDate: new Date().toISOString(),
                status: 'Processing',
                lastUpdated: serverTimestamp()
            });

            // Create notification for owner with more detailed information
            await notifications.createOwnerNotification(
                `Second payment receipt uploaded for Order #${orderId.slice(0, 8)} by ${orderData.customerName || 'Customer'}. Please verify the Payment.`,
                orderId
            );

            notifySuccess("Second receipt uploaded successfully");
            setSecondReceiptImage(null);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error in handleSecondImageUpload:", error);
            notifyError("Error uploading second receipt. Please try again.");
        } finally {
            setSecondUploadLoading(false);
        }
    };

    useEffect(() => {
        if (location.state?.highlightOrderId) {
            const orderToHighlight = orders.find(order => order.id === location.state.highlightOrderId);
            if (orderToHighlight) {
                handleViewOrder(orderToHighlight);
                // Optional: Clear the state to prevent re-highlighting
                history.replace('/orders', null);
            }
        }
    }, [location.state, orders]);

    if (loading) {
        return (
            <>
                <Navigation />
                <main className="ml-64 p-8 mt-16">
                    <div className="w-[950px] h-[670px] bg-[#FAFAFA] rounded-md p-6 flex items-center justify-center">
                        <p className="text-xl text-gray-600">Loading orders...</p>
                    </div>
                </main>
            </>
        );
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 mt-16">
            <Navigation />
            <main className="flex-1 p-4 md:p-8">
                <div className="w-full bg-[#FAFAFA] rounded-md p-4 md:p-6">
                    <h1 className="text-2xl md:text-4xl text-[#2F424B] font-semibold mb-4">ORDER STATUS</h1>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">ITEM NAME</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">MATERIAL</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">SIZE</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">DATE ORDERED</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">AMOUNT</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">STATUS</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                                            No orders found
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {order.item}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {order.material}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {order.size}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(order.dateOrdered).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ₱{order.amount?.toLocaleString() ?? '0'}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={getStatusColor(order.status)}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm flex space-x-2">
                                                <button
                                                    onClick={() => handleViewOrder(order)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <img src="/assets/mdi--eye.svg" alt="View" className="w-5 h-5" />
                                                </button>
                                                {order.status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col relative overflow-hidden">
                        <button
                            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
                            onClick={() => setIsModalOpen(false)}
                        >
                            <img src="/assets/line-md--remove.svg" alt="Close" className="w-6 h-6" />
                        </button>

                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-[#2F424B]">Order Details</h2>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                            <div className="grid grid-cols-2 gap-4">
                            {selectedOrder.sceneImage && (
                                <div className="w-full mb-6">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Design Preview</p>
                                    <div className="relative w-full">
                                        <img
                                            src={selectedOrder.sceneImage}
                                            alt="Design Preview"
                                            className="w-full h-auto rounded-lg shadow-sm"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-4xl font-bold text-white/50 transform -rotate-45 select-none pointer-events-none">
                                                DOUBLE SEVEN
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}


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
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Date Ordered</p>
                                    <p className="text-lg">{new Date(selectedOrder.dateOrdered).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Status</p>
                                    <p className="text-lg">{selectedOrder.status}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Payment Type</p>
                                    <p className="text-lg">{selectedOrder.paymentType}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Amount</p>
                                    <p className="text-lg">₱{selectedOrder.amount?.toLocaleString() ?? '0'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                                    <p className="text-lg">₱{selectedOrder.totalAmount?.toLocaleString() ?? '0'}</p>
                                </div>
                            </div>

                            <div className="mt-6 border-t pt-4">
                                <h3 className="text-lg font-semibold text-[#2F424B] mb-4">Price Breakdown</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Base Price</p>
                                        <p className="text-lg">₱{selectedOrder.baseCost?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Add-ons Cost</p>
                                        <p className="text-lg">₱{((selectedOrder.totalAmount || 0) - (selectedOrder.baseCost || 0)).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Amount</p>
                                        <p className="text-lg">₱{selectedOrder.totalAmount?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Price Breakdown Comments</p>
                                        <div className="bg-gray-50 p-4 rounded-md">
                                            <p className="text-gray-700">
                                                {selectedOrder.priceComments || "No comments provided."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isReceiptOpen && (
                                <CustomerReceipt
                                    receiptData={receiptData}
                                    onClose={() => setIsReceiptOpen(false)}
                                />
                            )}



                            <button
                                onClick={() => handleViewReceipt(selectedOrder, false)}
                                className="mr-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                View First Receipt
                            </button>
                            {selectedOrder.paymentType === '50% Down Payment' && (
                                <button
                                    onClick={() => handleViewReceipt(selectedOrder, true)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    View Second Receipt
                                </button>
                            )}

                            {/* Table Sign Design Section */}
                            {selectedOrder.item === "table-signs" && selectedOrder.design && (
                                <div className="mt-6">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Design</p>
                                    <div className="relative">
                                        <img
                                            src={selectedOrder.design.url}
                                            alt={selectedOrder.design.name}
                                            className="w-full max-w-md h-auto rounded-lg shadow-sm"
                                        />
                                        <p className="text-sm text-gray-500 mt-2">
                                            Design Name: {selectedOrder.design.name}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Add-ons Section with Enhanced Display */}
                            {selectedOrder.addOns && selectedOrder.addOns.length > 0 && (
                                <div className="mt-6">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Add-ons</p>
                                    <div className="space-y-4">
                                        {selectedOrder.addOns.map((addon, index) => (
                                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="font-medium text-gray-900">{addon}</h4>
                                                {addon === "Picture" && (
                                                    <div className="mt-2 space-y-2">
                                                        {selectedOrder.pictureFrameSize && (
                                                            <p className="text-sm text-gray-600">
                                                                Size: {selectedOrder.pictureFrameSize}
                                                            </p>
                                                        )}
                                                        {selectedOrder.pictureFrameImage && (
                                                            <div className="relative group">
                                                                <img
                                                                    src={selectedOrder.pictureFrameImage}
                                                                    alt="Picture Frame"
                                                                    className="max-w-[200px] h-auto rounded-md shadow-sm"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {addon === "Gravestone Base" && selectedOrder.selectedBaseSize && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Base Size: {selectedOrder.selectedBaseSize}
                                                    </p>
                                                )}
                                                {addon === "Per Name" && selectedOrder.nameCount && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Number of Names: {selectedOrder.nameCount}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedOrder.status === '1ST PAYMENT' && !selectedOrder.receiptImage && (
                                <div className="mt-6">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Upload First Payment Receipt</p>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setReceiptImage(e.target.files[0])}
                                            className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-[#2F424B] file:text-white
                                        hover:file:bg-[#445166]"
                                        />
                                        <button
                                            onClick={() => handleImageUpload(selectedOrder.id)}
                                            disabled={uploadLoading || !receiptImage}
                                            className="px-4 py-2 bg-[#2F424B] text-white rounded-md hover:bg-[#445166] 
                                             disabled:bg-gray-300 disabled:cursor-not-allowed"
                                        >
                                            {uploadLoading ? "Uploading..." : "Upload"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {selectedOrder.status === '2ND PAYMENT' && !selectedOrder.secondReceiptImage && (
                                <div className="mt-6">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Upload Second Payment Receipt</p>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setSecondReceiptImage(e.target.files[0])}
                                            className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                         file:bg-[#2F424B] file:text-white
                                         hover:file:bg-[#445166]"
                                        />
                                        <button
                                            onClick={() => handleSecondImageUpload(selectedOrder.id)}
                                            disabled={secondUploadLoading || !secondReceiptImage}
                                            className="px-4 py-2 bg-[#2F424B] text-white rounded-md hover:bg-[#445166] 
                                             disabled:bg-gray-300 disabled:cursor-not-allowed"
                                        >
                                            {secondUploadLoading ? "Uploading..." : "Upload"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {selectedOrder.receiptImage && (
                                <div className="mt-6">
                                    <p className="text-sm font-medium text-gray-700 mb-2">First Payment Receipt</p>
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

                            {selectedOrder.secondReceiptImage && (
                                <div className="mt-6">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Second Payment Receipt</p>
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
                        </div>

                        <div className="p-6 border-t border-gray-200">
                            <div className="flex justify-end space-x-4">
                                {selectedOrder.status === 'Pending' && (
                                    <button
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200"
                                        onClick={() => handleCancelOrder(selectedOrder.id)}
                                    >
                                        Cancel Order
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Orders;