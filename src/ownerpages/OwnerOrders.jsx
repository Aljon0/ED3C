import React, { useState, useEffect, useCallback } from "react";
import { collection, getDoc, doc, updateDoc, deleteDoc, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { notifySuccess, notifyError, notifyWarning } from "../general/CustomToast.js"
import notifications from "../components/notifications.jsx";
import { Download } from 'lucide-react';
import { NewOrdersTable, ProcessingOrdersTable, FinishedOrdersTable, CancelledOrdersTable } from '../components/OrderTables';
import debounce from 'lodash/debounce';
import PrintableReceipt from '../components/PrintableReceipt';
import WalkInOrderModal from "../components/WalkInOrderModal.jsx";

function OwnerOrders() {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [expectedDate, setExpectedDate] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [imageUrls, setImageUrls] = useState({});
    const [editableTotal, setEditableTotal] = useState('');
    const [priceComments, setPriceComments] = useState('');
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
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

    const handleSaveReceipt = async ({ price, status }) => {
        try {
            const orderRef = doc(db, 'orders', selectedOrder.id);
            await updateDoc(orderRef, {
                [receiptData.isSecondReceipt ? 'secondAmount' : 'amount']: price,
                [receiptData.isSecondReceipt ? 'secondPaymentStatus' : 'paymentStatus']: status
            });
            notifySuccess("Receipt details updated successfully");
        } catch (error) {
            notifyError("Error updating receipt details");
        }
    };

    useEffect(() => {
        if (selectedOrder) {
            setEditableTotal(selectedOrder.totalAmount?.toString() || '0');
            setPriceComments(selectedOrder.priceComments || '');
        }
    }, [selectedOrder]);

    // Debounced update functions
    const debouncedUpdateTotal = useCallback(
        debounce(async (orderId, newTotal) => {
            try {
                await updateDoc(doc(db, 'orders', orderId), {
                    totalAmount: parseFloat(newTotal),
                    lastUpdated: serverTimestamp()
                });
                notifySuccess("Total amount updated successfully");
            } catch (error) {
                notifyError("Error updating total amount");
            }
        }, 1000), // 1 second delay
        []
    );

    const debouncedUpdateComments = useCallback(
        debounce(async (orderId, comments) => {
            try {
                await updateDoc(doc(db, 'orders', orderId), {
                    priceComments: comments,
                    lastUpdated: serverTimestamp()
                });
                notifySuccess("Price comments updated successfully");
            } catch (error) {
                notifyError("Error updating price comments");
            }
        }, 1000), // 1 second delay
        []
    );

    // Cleanup debounced functions
    useEffect(() => {
        return () => {
            debouncedUpdateTotal.cancel();
            debouncedUpdateComments.cancel();
        };
    }, [debouncedUpdateTotal, debouncedUpdateComments]);

    const getImageTypeFromUrl = (url) => {
        const extension = url.split('.').pop().toLowerCase();
        switch (extension) {
            case 'png':
                return 'image/png';
            case 'gif':
                return 'image/gif';
            case 'svg':
                return 'image/svg+xml';
            case 'webp':
                return 'image/webp';
            default:
                return 'image/jpeg';
        }
    };

    const getFileExtension = (url) => {
        const extension = url.split('.').pop().toLowerCase();
        return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension) ? extension : 'jpg';
    };

    const createDownloadableUrl = async (imageUrl, orderId) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            setImageUrls(prev => ({
                ...prev,
                [orderId]: blobUrl
            }));
            return blobUrl;
        } catch (error) {
            console.error('Error creating downloadable URL:', error);
            return imageUrl;
        }
    };

    // Cleanup function for blob URLs
    useEffect(() => {
        return () => {
            // Cleanup blob URLs when component unmounts
            Object.values(imageUrls).forEach(url => {
                URL.revokeObjectURL(url);
            });
        };
    }, [imageUrls]);

    const downloadImage = async (imageUrl, fileName) => {
        try {
            const response = await fetch(imageUrl);
            const contentType = response.headers.get('content-type') || getImageTypeFromUrl(imageUrl);
            const blob = await response.blob();
            const extension = getFileExtension(imageUrl);

            // Create a new blob with the correct content type
            const blobWithType = new Blob([blob], { type: contentType });
            const url = URL.createObjectURL(blobWithType);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName || 'picture-frame-image'}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            notifySuccess("Image downloaded successfully");
        } catch (error) {
            console.error('Error downloading image:', error);
            notifyError("Failed to download image");
        }
    };

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

            if (newStatus === 'Finished' || newStatus === 'Cancelled') {
                // Only update the status and lastUpdated fields
                await updateDoc(orderRef, {
                    status: newStatus,
                    lastUpdated: serverTimestamp()
                });

                // Send notification
                await notifications.createCustomerNotification(
                    orderData.customerId,
                    `Your order #${orderId.slice(0, 8)} has been ${newStatus.toLowerCase()}.`,
                    orderId
                );

                notifySuccess(`Order status updated to ${newStatus}`);
            } else {
                await updateDoc(orderRef, {
                    status: newStatus,
                    lastUpdated: serverTimestamp()
                });

                let message = '';
                switch (newStatus) {
                    case '1ST PAYMENT':
                        message = `Your order #${orderId.slice(0, 8)} has been accepted. Please upload your first payment receipt.`;
                        break;
                    case 'Processing':
                        message = `Your order #${orderId.slice(0, 8)} is now being processed.`;
                        break;
                    case '2ND PAYMENT':
                        message = `Your order #${orderId.slice(0, 8)} requires second payment. Please upload the receipt.`;
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
        const unsubscribe = onSnapshot(collection(db, 'orders'), async (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Get finished and cancelled orders
            const finishedOrders = ordersData
                .filter(order => order.status === 'Finished' && !order.isArchived)
                .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

            const cancelledOrders = ordersData
                .filter(order => order.status === 'Cancelled' && !order.isArchived)
                .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

            // Process orders that need to be moved to transaction history
            const processOrdersToArchive = async (orders, startIndex) => {
                for (const order of orders.slice(startIndex)) {
                    try {
                        // Create transaction document
                        await addDoc(collection(db, 'transactions'), {
                            // Customer Information
                            customerId: order.customerId || '',
                            customerName: order.customerName || '',
                            customerEmail: order.customerEmail || '',
                            customerContact: order.customerContact || '',
                            customerAddress: order.customerAddress || '',

                            // Order Details
                            orderId: order.id,
                            item: order.item || '',
                            material: order.material || '',
                            size: order.size || '',
                            design: order.design || null,

                            // Dates
                            dateOrdered: order.dateOrdered || new Date().toISOString(),
                            completedDate: order.lastUpdated || serverTimestamp(),
                            lastUpdated: serverTimestamp(),
                            transactionDate: serverTimestamp(),
                            expectedDate: order.expectedDate || null,

                            // Payment Information
                            paymentType: order.paymentType || '',
                            amount: order.amount || 0,
                            baseCost: order.baseCost || 0,
                            totalAmount: order.totalAmount || 0,

                            // Status
                            status: order.status,

                            // Add-ons
                            addOns: order.addOns || [],
                            pictureFrameSize: order.pictureFrameSize || null,
                            pictureFrameImage: order.pictureFrameImage || null,
                            selectedBaseSize: order.selectedBaseSize || null,
                            nameCount: order.nameCount || null,

                            // Images
                            sceneImage: order.sceneImage || null,
                            receiptImage: order.receiptImage || null,
                            receiptUploadDate: order.receiptUploadDate || null,
                            secondReceiptImage: order.secondReceiptImage || null,
                            secondReceiptUploadDate: order.secondReceiptUploadDate || null
                        });

                        // Mark original order as archived
                        await updateDoc(doc(db, 'orders', order.id), {
                            isArchived: true,
                            lastUpdated: serverTimestamp()
                        });
                    } catch (error) {
                        console.error('Error archiving order:', error);
                        notifyError(`Error archiving order ${order.id}`);
                    }
                }
            };

            // Archive orders beyond the 10-order limit
            if (finishedOrders.length > 10) {
                await processOrdersToArchive(finishedOrders, 10);
            }

            if (cancelledOrders.length > 10) {
                await processOrdersToArchive(cancelledOrders, 10);
            }

            // Update state with remaining orders
            setOrders(ordersData.filter(order => !order.isArchived));
        }, (error) => {
            notifyError("Error fetching orders: ", error);
        });

        return () => unsubscribe();
    }, []);

    const filteredOrders = orders.filter(order =>
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAcceptOrder = async () => {
        if (!expectedDate) {
            notifyWarning("Please set an expected completion date");
            return;
        }

        try {
            // Fetch current materials to check and update inventory
            const materialsSnapshot = await getDocs(collection(db, "materials"));
            const materials = materialsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Find the material that matches the order's item
            const matchingMaterial = materials.find(material =>
                material.itemName.toLowerCase() === selectedOrder.item.toLowerCase()
            );

            if (!matchingMaterial) {
                notifyError(`No matching material found for ${selectedOrder.item}`);
                return;
            }

            // Calculate new quantity (subtract order quantity)
            const newQuantity = matchingMaterial.quantity - 1; // Assuming 1 item per order

            // Update material quantity
            const materialRef = doc(db, "materials", matchingMaterial.id);
            await updateDoc(materialRef, {
                quantity: newQuantity
            });

            // Update the order status, expected date, and total amount
            await updateDoc(doc(db, 'orders', selectedOrder.id), {
                status: '1ST PAYMENT',
                expectedDate: expectedDate,
                totalAmount: parseFloat(editableTotal),
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
            notifyError("Error processing order. Please try again.");
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

    const formatAddOns = (orderData) => {
        if (!orderData.addOns || !Array.isArray(orderData.addOns)) return "None";

        return orderData.addOns.map((addon, index) => {
            switch (addon) {
                case "Picture":
                    return (
                        <div key={index} className="space-y-2">
                            <p className="font-medium">Picture Frame ({orderData.pictureFrameSize || 'Size not specified'})</p>
                            {orderData.pictureFrameImage && (
                                <div className="relative group">
                                    <a
                                        href={orderData.pictureFrameImage}
                                        download={`picture-frame-${orderData.id}.${getFileExtension(orderData.pictureFrameImage)}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            downloadImage(
                                                orderData.pictureFrameImage,
                                                `picture-frame-${orderData.id}`
                                            );
                                        }}
                                    >
                                        <img
                                            src={orderData.pictureFrameImage}
                                            alt="Picture Frame"
                                            className="max-w-[200px] h-auto rounded-md shadow-sm cursor-pointer"
                                        />
                                    </a>
                                    <button
                                        onClick={() => downloadImage(
                                            orderData.pictureFrameImage,
                                            `picture-frame-${orderData.id}`
                                        )}
                                        className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100"
                                        title="Download image"
                                    >
                                        <Download className="w-4 h-4 text-gray-700" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                case "Gravestone Base":
                    return (
                        <p key={index}>
                            Gravestone Base ({orderData.selectedBaseSize || 'Size not specified'})
                        </p>
                    );
                case "Per Name":
                    return (
                        <p key={index}>
                            Names ({orderData.nameCount || 0} names)
                        </p>
                    );
                default:
                    return <p key={index}>{addon}</p>;
            }
        });
    };

    useEffect(() => {
        if (location.state?.highlightOrderId) {
            const orderToHighlight = orders.find(order => order.id === location.state.highlightOrderId);
            if (orderToHighlight) {
                handleViewOrder(orderToHighlight);
                // Optional: Clear the state to prevent re-highlighting
                history.replace('/owner/orders', null);
            }
        }
    }, [location.state, orders]);

    return (
        <>
            <OwnerHeader />
            <OwnerSideBar />
            <main className="ml-64 p-8 mt-16">
                <div className="w-full bg-[#D3D3D3] rounded-md p-6 backdrop-blur-lg">
                    <span className="text-4xl text-[#2F424B] font-semibold mb-4 block">ORDER STATUS</span>
                    <div className="flex justify-between items-center mb-4">
                        <SearchBar onSearch={setSearchQuery} />
                        <button
                            onClick={() => setIsWalkInModalOpen(true)}
                            className="px-4 py-2 bg-[#2F424B] text-white rounded-md hover:bg-[#445166] transition-colors duration-200 ml-4"
                        >
                            Add Walk In Order
                        </button>
                    </div>

                    <NewOrdersTable
                        orders={filteredOrders}
                        getStatusColor={getStatusColor}
                        handleViewOrder={handleViewOrder}
                        handleDeleteOrder={handleDeleteOrder}
                        handleStatusChange={updateOrderStatus}
                    />

                    <ProcessingOrdersTable
                        orders={filteredOrders}
                        getStatusColor={getStatusColor}
                        handleViewOrder={handleViewOrder}
                        handleDeleteOrder={handleDeleteOrder}
                        handleStatusChange={updateOrderStatus}
                    />

                    <FinishedOrdersTable
                        orders={filteredOrders}
                        getStatusColor={getStatusColor}
                        handleViewOrder={handleViewOrder}
                        handleDeleteOrder={handleDeleteOrder}
                    />

                    <CancelledOrdersTable
                        orders={filteredOrders}
                        getStatusColor={getStatusColor}
                        handleViewOrder={handleViewOrder}
                        handleDeleteOrder={handleDeleteOrder}
                    />

                    <WalkInOrderModal
                        isOpen={isWalkInModalOpen}
                        onClose={() => setIsWalkInModalOpen(false)}
                    />
                </div>
            </main>

            {/* Order Details Modal */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
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
                            {/* Design Preview Section - Full Width */}
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

                            <div className="grid grid-cols-2 gap-4">

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

                                {/* Pricing Section with Editable Total */}
                                <div className="mt-6 border-t pt-4">
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
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F424B]"
                                                value={editableTotal}
                                                onChange={(e) => {
                                                    const newValue = e.target.value;
                                                    setEditableTotal(newValue);
                                                    debouncedUpdateTotal(selectedOrder.id, newValue);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Price Breakdown Comments</p>
                                            <textarea
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F424B]"
                                                rows="4"
                                                placeholder="Enter price breakdown details..."
                                                value={priceComments}
                                                onChange={(e) => {
                                                    const newValue = e.target.value;
                                                    setPriceComments(newValue);
                                                    debouncedUpdateComments(selectedOrder.id, newValue);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {isReceiptOpen && (
                                    <PrintableReceipt
                                        receiptData={receiptData}
                                        onClose={() => setIsReceiptOpen(false)}
                                        onSave={handleSaveReceipt}
                                    />
                                )}

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