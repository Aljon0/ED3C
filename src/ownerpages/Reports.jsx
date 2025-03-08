import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";
import SearchBar from "../components/SearchBar.jsx";
import GenerateReports from "../components/GenerateReports.jsx";
import IncomeAndSupplies from "../components/IncomeAndSupplies.jsx";

function Reports() {
    const [transactions, setTransactions] = useState([]);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Updated useEffect to properly handle Firestore timestamps
    useEffect(() => {
        const transactionsQuery = query(
            collection(db, 'transactions'),
            orderBy('completedDate', 'desc')
        );

        const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
            const transactionsData = snapshot.docs.map(doc => {
                const data = doc.data();

                const convertTimestamp = (timestamp) => {
                    if (!timestamp) return null;
                    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                        return timestamp.toDate();
                    }
                    if (typeof timestamp === 'string') {
                        const date = new Date(timestamp);
                        return isNaN(date.getTime()) ? null : date;
                    }
                    if (typeof timestamp === 'number') {
                        return new Date(timestamp);
                    }
                    return null;
                };

                return {
                    id: doc.id,
                    customerName: data.customerName || 'No Name',
                    customerContact: data.customerContact || 'No Contact',
                    customerEmail: data.customerEmail || 'No Email',
                    customerAddress: data.customerAddress || 'No Address',
                    item: data.item || 'No Item',
                    material: data.material || 'Not Specified',
                    size: data.size || 'Not Specified',
                    status: data.status || 'Finished',
                    completedDate: convertTimestamp(data.completedDate),
                    dateOrdered: convertTimestamp(data.dateOrdered),
                    lastUpdated: convertTimestamp(data.lastUpdated),
                    transactionDate: convertTimestamp(data.transactionDate),
                    receiptUploadDate: convertTimestamp(data.receiptUploadDate),
                    secondReceiptUploadDate: convertTimestamp(data.secondReceiptUploadDate),
                    baseCost: data.baseCost || 0,
                    totalAmount: data.totalAmount || 0,
                    addOns: Array.isArray(data.addOns) ? data.addOns : [],
                    paymentType: data.paymentType || 'Not Specified',
                    sceneImage: data.sceneImage || null,
                    receiptImage: data.receiptImage || null,
                    secondReceiptImage: data.secondReceiptImage || null,
                    design: data.design || null,
                    pictureFrameSize: data.pictureFrameSize || null,
                    pictureFrameImage: data.pictureFrameImage || null,
                    selectedBaseSize: data.selectedBaseSize || null,
                    nameCount: data.nameCount || 0
                };
            });
            setTransactions(transactionsData);
        }, (error) => {
            console.error("Error fetching transactions: ", error);
        });

        return () => unsubscribe();
    }, []);

    const handleSearch = (query) => {
        setSearchQuery(query.toLowerCase());
    };

    const handleViewTransaction = (transaction) => {
        setSelectedTransaction(transaction);
        setIsModalOpen(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Finished':
                return 'text-green-600';
            case 'Cancelled':
                return 'text-gray-600';
            default:
                return 'text-green-600';
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Not Available';
        try {
            return date instanceof Date ?
                date.toLocaleString() :
                new Date(date).toLocaleString();
        } catch (error) {
            console.error("Error formatting date:", error);
            return 'Invalid Date';
        }
    };

    const formatCurrency = (amount) => {
        return `₱${(amount || 0).toLocaleString()}`;
    };

    const formatAddOns = (transaction) => {
        if (!transaction.addOns || !Array.isArray(transaction.addOns) || transaction.addOns.length === 0) {
            return <div>No Add-ons</div>;
        }

        return transaction.addOns.map((addon, index) => {
            switch (addon) {
                case "Picture Frame":
                    return (
                        <div key={`addon-${index}`} className="space-y-2">
                            <p>Picture Frame ({transaction.pictureFrameSize || 'Size not specified'})</p>
                            {transaction.pictureFrameImage && (
                                <img
                                    src={transaction.pictureFrameImage}
                                    alt="Picture Frame"
                                    className="max-w-[200px] h-auto rounded-md shadow-sm"
                                />
                            )}
                        </div>
                    );
                case "Gravestone Base":
                    return (
                        <div key={`addon-${index}`}>
                            Gravestone Base ({transaction.selectedBaseSize || 'Size not specified'})
                        </div>
                    );
                case "Per Name":
                    return (
                        <div key={`addon-${index}`}>
                            Names ({transaction.nameCount || 0} names)
                        </div>
                    );
                default:
                    return <div key={`addon-${index}`}>{addon}</div>;
            }
        });
    };

    const filterTransactions = (transaction) => {
        const nameMatch = transaction.customerName.toLowerCase().includes(searchQuery);

        switch (statusFilter) {
            case "ALL":
                return nameMatch;
            case "Finished":
            case "Cancelled":
                return nameMatch && transaction.status === statusFilter;
            default:
                return nameMatch;
        }
    };

    const StatusFilterButton = ({ status, currentFilter, onClick }) => (
        <button
            onClick={() => onClick(status)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${currentFilter === status
                    ? 'bg-[#2F424B] text-white'
                    : 'bg-white text-[#2F424B] hover:bg-gray-100'
                } border border-[#2F424B]`}
        >
            <img src="/assets/openmoji--sort.svg" alt="sort" className="w-4 h-4 mr-2" />
            {status}
        </button>
    );

    return (
        <>
            <OwnerHeader />
            <OwnerSideBar />
            <main className="p-8 ml-64 mt-16">
                <IncomeAndSupplies />
                <div className="w-full min-h-[670px] bg-[#D3D3D3] rounded-md p-6">

                    <div className="flex items-center mb-4">
                        <span className="text-4xl text-[#2F424B] font-semibold">Transaction History</span>
                        <GenerateReports transactions={transactions} />
                    </div>

                    {/* Status Filter Buttons */}
                    <div className="flex gap-4 mb-4">
                        <StatusFilterButton
                            status="ALL"
                            currentFilter={statusFilter}
                            onClick={setStatusFilter}
                        />
                        <StatusFilterButton
                            status="Finished"
                            currentFilter={statusFilter}
                            onClick={setStatusFilter}
                        />
                        <StatusFilterButton
                            status="Cancelled"
                            currentFilter={statusFilter}
                            onClick={setStatusFilter}
                        />
                    </div>

                    <SearchBar onSearch={handleSearch} />

                    <div className="max-h-[500px] overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">CUSTOMER'S NAME</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">DATE ORDERED</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">STATUS</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">COMPLETED TIME</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions
                                    .filter(filterTransactions)
                                    .map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {transaction.customerName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(transaction.dateOrdered)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={getStatusColor(transaction.status)}>
                                                    {transaction.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(transaction.completedDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center space-x-4">
                                                <img
                                                    src="/assets/mdi--eye.svg"
                                                    alt="View"
                                                    className="w-5 h-5 cursor-pointer"
                                                    onClick={() => handleViewTransaction(transaction)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Transaction Details Modal */}
            {isModalOpen && selectedTransaction && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 relative">
                            <h2 className="text-2xl font-bold text-[#2F424B]">Transaction Details</h2>
                            <img
                                src="/assets/line-md--remove.svg"
                                alt="Close"
                                className="w-6 h-6 absolute top-6 right-6 cursor-pointer"
                                onClick={() => setIsModalOpen(false)}
                            />
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                            <div className="grid grid-cols-2 gap-4">
                                {selectedTransaction.sceneImage && (
                                    <div className="col-span-2 mb-6">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Design Preview</p>
                                        <img
                                            src={selectedTransaction.sceneImage}
                                            alt="Design Preview"
                                            className="w-full max-w-md h-auto rounded-lg shadow-sm mx-auto"
                                        />
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm font-medium text-gray-500">Customer Name</p>
                                    <p className="text-lg">{selectedTransaction.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Contact</p>
                                    <p className="text-lg">{selectedTransaction.customerContact}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                    <p className="text-lg">{selectedTransaction.customerEmail}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Address</p>
                                    <p className="text-lg">{selectedTransaction.customerAddress}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Item</p>
                                    <p className="text-lg">{selectedTransaction.item}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Material</p>
                                    <p className="text-lg">{selectedTransaction.material}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Size</p>
                                    <p className="text-lg">{selectedTransaction.size}</p>
                                </div>

                                {/* Order Details */}
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Date Ordered</p>
                                    <p className="text-lg">{formatDate(selectedTransaction.dateOrdered)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Completed Date</p>
                                    <p className="text-lg">{formatDate(selectedTransaction.completedDate)}</p>
                                </div>

                                {/* Table Signs Design Section */}
                                {selectedTransaction.item === 'table-signs' && selectedTransaction.design && (
                                    <div className="col-span-2">
                                        <p className="text-sm font-medium text-gray-500">Selected Design</p>
                                        <div className="mt-2">
                                            <p className="text-lg mb-2">{selectedTransaction.design.name}</p>
                                            <img
                                                src={selectedTransaction.design.url}
                                                alt={selectedTransaction.design.name}
                                                className="max-w-[300px] h-auto rounded-lg shadow-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Add-ons Section */}
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Add-ons</p>
                                    <div className="space-y-4">
                                        {formatAddOns(selectedTransaction)}
                                    </div>
                                </div>

                                {/* Pricing Details */}
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Base Price</p>
                                    <p className="text-lg">{formatCurrency(selectedTransaction.baseCost)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Add-ons Cost</p>
                                    <p className="text-lg">{formatCurrency((selectedTransaction.totalAmount || 0) - (selectedTransaction.baseCost || 0))}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Payment Type</p>
                                    <p className="text-lg">{selectedTransaction.paymentType}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                                    <p className="text-lg">{formatCurrency(selectedTransaction.totalAmount)}</p>
                                </div>
                            </div>

                            {/* First Receipt */}
                            {selectedTransaction.receiptImage && (
                                <div className="mt-6">
                                    <p className="text-sm font-medium text-gray-700 mb-2">First Payment Receipt</p>
                                    <img
                                        src={selectedTransaction.receiptImage}
                                        alt="First Payment Receipt"
                                        className="max-w-full h-auto rounded-md shadow-sm"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Uploaded on: {formatDate(selectedTransaction.receiptUploadDate)}
                                    </p>
                                </div>
                            )}

                            {/* Second Receipt */}
                            {selectedTransaction.secondReceiptImage && (
                                <div className="mt-6">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Second Payment Receipt</p>
                                    <img
                                        src={selectedTransaction.secondReceiptImage}
                                        alt="Second Payment Receipt"
                                        className="max-w-full h-auto rounded-md shadow-sm"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Uploaded on: {formatDate(selectedTransaction.secondReceiptUploadDate)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Reports;