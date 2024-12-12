import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import UserHeader from "../components/UserHeader.jsx";
import UserSideBar from "../components/UserSideBar.jsx";

function Payment() {
    const [gcashAccounts, setGcashAccounts] = useState([]);
    const [bpiAccount, setBpiAccount] = useState({ name: "", accountNumber: "" });
    const [gcashImage, setGcashImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [paymentType, setPaymentType] = useState("Partial");
    const [cost, setCost] = useState(250);
    const [selectedItem, setSelectedItem] = useState("gravestone");

    const itemTypes = [
        { value: "gravestone", label: "Gravestone" },
        { value: "gravestone-base", label: "Gravestone Base" },
        { value: "urns", label: "Urns" },
        { value: "table-signs", label: "Table Signs" }
    ];

    useEffect(() => {
        const fetchPaymentData = async () => {
            const docRef = doc(db, "payments", "paymentMethods");
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setGcashImage(data.gcashImage || null);
                    setGcashAccounts(data.gcashAccounts || []);
                    setBpiAccount(data.bpiAccount || { name: "", accountNumber: "" });
                } else {
                    console.error("No document found!");
                }
            } catch (error) {
                console.error("Error fetching payment data:", error);
            }
        };

        fetchPaymentData();
    }, []);

    const handlePaymentTypeChange = (e) => {
        const selectedType = e.target.value;
        setPaymentType(selectedType);
        setCost(selectedType === "Partial" ? 250 : 500);
    };

    const handleItemChange = (e) => {
        setSelectedItem(e.target.value);
    };

    return (
        <>
            <UserHeader />
            <UserSideBar />
            <main className="ml-64 p-8 mt-16">
                <div className="w-[700px] bg-[#DADADA] shadow-lg rounded-md p-8 relative">
                    <span className="text-4xl text-[#2F424B] font-semibold mb-6 block">Order Summary</span>
    
                    <div className="mb-6">
                        <p className="text-xl font-medium text-gray-700 mb-2">Preview:</p>
                        <label className="text-lg text-gray-700 font-medium block">Item Type:</label>
                        <select
                            value={selectedItem}
                            onChange={handleItemChange}
                            className="mt-2 p-3 text-gray-800 bg-gray-100 rounded-md border border-gray-300 text-lg"
                        >
                            {itemTypes.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                        
                        <label className="text-lg text-gray-700 font-medium mt-4 block">Payment Type:</label>
                        <select
                            name="PaymentType"
                            value={paymentType}
                            onChange={handlePaymentTypeChange}
                            className="mt-2 p-3 text-gray-800 bg-gray-100 rounded-md border border-gray-300 text-lg"
                        >
                            <option value="Partial">Partial</option>
                            <option value="FullPayment">Full Payment</option>
                        </select>
                        <p className="text-lg font-medium text-gray-700 mt-4">Cost: <span className="text-gray-800">₱{cost}</span></p>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                        <button 
                            onClick={() => {/* Add your confirm logic here */}}
                            className="px-6 py-2 bg-[#2F424B] text-white rounded-md hover:bg-[#576c75] transition-colors duration-200"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
                <span className="text-4xl text-[#2F424B] font-semibold mb-4 block mt-10">Available Payment Methods</span>
                <div className="mt-10 grid grid-cols-2 gap-8">
                    <div className="text-center">
                        <span className="text-2xl text-[#2F424B] font-semibold">GCash QR Code/Account</span>
                        {gcashImage ? (
                            <>
                                <img 
                                    src={gcashImage} 
                                    alt="GCash QR Code" 
                                    className="w-48 h-48 object-cover rounded-md shadow-lg mx-auto mt-4 cursor-pointer"
                                    onClick={() => setIsModalOpen(true)}
                                />
                                {isModalOpen && (
                                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]">
                                        <div className="relative">
                                            <img src={gcashImage} alt="GCash QR Code Large" className="w-[90vw] h-[90vh] object-contain" />
                                            <button 
                                                onClick={() => setIsModalOpen(false)} 
                                                className="absolute top-24 right-10 text-white text-3xl font-bold bg-gray-800 rounded-full p-1"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-gray-500">QR Code not available.</p>
                        )}
                        {gcashAccounts.map((account, index) => (
                            <div key={index} className="mt-2">
                                <p className="font-bold">{account.name}</p>
                                <p className="font-bold">Account Number: {account.accountNumber}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <span className="text-2xl text-[#2F424B] font-semibold">BPI</span>
                        <div className="mt-4">
                            <p className="font-bold">{bpiAccount.name}</p>
                            <p className="font-bold">Account Number: {bpiAccount.accountNumber}</p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

export default Payment;
