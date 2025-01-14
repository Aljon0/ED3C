// OwnerPaymentAccess.jsx
import { useState, useEffect } from "react";
import { storage, firestore } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc, getDoc } from "firebase/firestore";
import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";
import { notifyError, notifySuccess, notifyWarning } from "../general/CustomToast.js";

function OwnerPaymentAccess() {
    const [gcashImage, setGcashImage] = useState(null);
    const [gcashAccounts, setGcashAccounts] = useState([{ name: "", accountNumber: "" }]);
    const [bpiAccount, setBpiAccount] = useState({ name: "", accountNumber: "" });
    const [selectedItem, setSelectedItem] = useState("gravestone");
    const [cost, setCost] = useState(250);
    const [paymentType, setPaymentType] = useState("Partial");

    const itemTypes = [
        { value: "gravestone", label: "Gravestone" },
        { value: "gravestone-base", label: "Gravestone Base" },
        { value: "urns", label: "Urns" },
        { value: "table-signs", label: "Table Signs" }
    ];

    useEffect(() => {
        const fetchPaymentData = async () => {
            try {
                const paymentDoc = await getDoc(doc(firestore, "payments", "paymentMethods"));
                if (paymentDoc.exists()) {
                    const paymentData = paymentDoc.data();
                    setGcashImage(paymentData.gcashImage || null);
                    setGcashAccounts(paymentData.gcashAccounts || [{ name: "", accountNumber: "" }]);
                    setBpiAccount(paymentData.bpiAccount || { name: "", accountNumber: "" });
                } else {
                    notifyWarning("No payment data found.");
                }
            } catch (error) {
                notifyError("Error fetching payment data:", error);
            }
        };
        fetchPaymentData();
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const storageRef = ref(storage, `images/gcashImage`);
                await uploadBytes(storageRef, file);
                const imageUrl = await getDownloadURL(storageRef);
                setGcashImage(imageUrl);
            } catch (error) {
                notifyError("Error uploading GCash QR image:", error);
            }
        }
    };

    const removeImage = async () => {
        try {
            const storageRef = ref(storage, `images/gcashImage`);
            await deleteObject(storageRef);
            setGcashImage(null);
        } catch (error) {
            notifyError("Error removing GCash QR image:", error);
        }
    };

    const updateGcashAccount = (index, field, value) => {
        const updatedAccounts = [...gcashAccounts];
        updatedAccounts[index][field] = value;
        setGcashAccounts(updatedAccounts);
    };

    const addGcashAccount = () => {
        setGcashAccounts([...gcashAccounts, { name: "", accountNumber: "" }]);
    };

    const updateBpiAccount = (field, value) => {
        setBpiAccount((prev) => ({ ...prev, [field]: value }));
    };

    const savePaymentInfo = async () => {
        const paymentData = {
            gcashAccounts,
            bpiAccount,
            gcashImage,
        };
        try {
            await setDoc(doc(firestore, "payments", "paymentMethods"), paymentData);
            notifySuccess("Payment information saved successfully.");
        } catch (error) {
            notifyError("Error saving payment information:", error);
        }
    };

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
            <OwnerHeader />
            <OwnerSideBar />
            <main className="ml-64 p-8 mt-16">

                <span className="text-4xl text-[#2F424B] font-semibold mb-4 block mt-10">Manage Payment Methods</span>

                <div className="mt-8 grid grid-cols-2 gap-8">
                    <div className="text-center">
                        <span className="text-2xl text-[#2F424B] font-semibold">GCash QR Code</span>
                        <div className="mt-4">
                            <label htmlFor="gcash-upload">Upload GCash QR Code:</label>
                            <input
                                type="file"
                                id="gcash-upload"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="mt-2 p-2 border-2 border-gray-300 rounded-md cursor-pointer"
                            />
                            {gcashImage ? (
                                <div className="mt-4">
                                    <img src={gcashImage} alt="GCash QR Code" className="w-48 h-48 object-cover rounded-md shadow-lg" />
                                    <button onClick={removeImage} className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <p className="mt-4 text-gray-500">No QR code uploaded</p>
                            )}
                        </div>
                        <div className="mt-4">
                            <span className="text-xl font-bold">GCash Accounts</span>
                            {gcashAccounts.map((account, index) => (
                                <div key={index} className="mt-2">
                                    <input
                                        type="text"
                                        placeholder="Account Name"
                                        value={account.name}
                                        onChange={(e) => updateGcashAccount(index, "name", e.target.value)}
                                        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Account Number"
                                        value={account.accountNumber}
                                        onChange={(e) => updateGcashAccount(index, "accountNumber", e.target.value)}
                                        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                                    />
                                </div>
                            ))}
                            <button onClick={addGcashAccount} className="mt-4 px-4 py-2 bg-[#37474F] text-white rounded-md hover:bg-[#576c75]">
                                Add GCash Account
                            </button>
                        </div>
                    </div>

                    <div className="text-center">
                        <span className="text-2xl text-[#2F424B] font-semibold">BPI</span>
                        <div className="mt-4">
                            <input
                                type="text"
                                placeholder="Account Name"
                                value={bpiAccount.name}
                                onChange={(e) => updateBpiAccount("name", e.target.value)}
                                className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                            />
                            <input
                                type="text"
                                placeholder="Account Number"
                                value={bpiAccount.accountNumber}
                                onChange={(e) => updateBpiAccount("accountNumber", e.target.value)}
                                className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                </div>
                <button onClick={savePaymentInfo} className="mt-8 px-6 py-3 bg-[#37474F] text-white rounded-md hover:bg-[#576c75]">
                    Save
                </button>
            </main>
        </>
    );
}

export default OwnerPaymentAccess;
