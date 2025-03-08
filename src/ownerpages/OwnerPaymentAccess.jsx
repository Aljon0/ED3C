import { useState, useEffect } from "react";
import { storage, firestore } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc, getDoc } from "firebase/firestore";
import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";
import { notifyError, notifySuccess, notifyWarning } from "../general/CustomToast.js";
import { Upload, Trash2, PlusCircle, CreditCard, QrCode } from "lucide-react";

function OwnerPaymentAccess() {
    const [gcashImages, setGcashImages] = useState([]);
    const [bpiImages, setBpiImages] = useState([]);
    const [gcashAccounts, setGcashAccounts] = useState([{ name: "", accountNumber: "" }]);
    const [bpiAccounts, setBpiAccounts] = useState([{ name: "", accountNumber: "" }]);

    useEffect(() => {
        const fetchPaymentData = async () => {
            try {
                const paymentDoc = await getDoc(doc(firestore, "payments", "paymentMethods"));
                if (paymentDoc.exists()) {
                    const paymentData = paymentDoc.data();
                    setGcashImages(paymentData.gcashImages || []);
                    setBpiImages(paymentData.bpiImages || []);
                    setGcashAccounts(paymentData.gcashAccounts || [{ name: "", accountNumber: "" }]);
                    setBpiAccounts(paymentData.bpiAccounts || [{ name: "", accountNumber: "" }]);
                } else {
                    notifyWarning("No payment data found.");
                }
            } catch (error) {
                notifyError("Error fetching payment data:", error);
            }
        };
        fetchPaymentData();
    }, []);

    const handleFileChange = async (e, type) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const storageRef = ref(storage, `images/${type}_${Date.now()}`);
                await uploadBytes(storageRef, file);
                const imageUrl = await getDownloadURL(storageRef);
                const newImage = { url: imageUrl, path: storageRef.fullPath };

                if (type === 'gcash') {
                    setGcashImages(prev => [...prev, newImage]);
                } else {
                    setBpiImages(prev => [...prev, newImage]);
                }
            } catch (error) {
                notifyError(`Error uploading ${type} QR image:`, error);
            }
        }
    };

    const removeImage = async (index, imagePath, type) => {
        try {
            if (imagePath) {
                const storageRef = ref(storage, imagePath);
                await deleteObject(storageRef);
            }
            if (type === 'gcash') {
                setGcashImages(prev => prev.filter((_, i) => i !== index));
            } else {
                setBpiImages(prev => prev.filter((_, i) => i !== index));
            }
        } catch (error) {
            if (error.code === 'storage/object-not-found') {
                // If the file doesn't exist, just remove it from the state
                if (type === 'gcash') {
                    setGcashImages(prev => prev.filter((_, i) => i !== index));
                } else {
                    setBpiImages(prev => prev.filter((_, i) => i !== index));
                }
                return;
            }
            notifyError(`Error removing ${type} QR image: ${error.message}`);
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

    const removeGcashAccount = (index) => {
        setGcashAccounts(prev => prev.filter((_, i) => i !== index));
    };

    const updateBpiAccount = (index, field, value) => {
        const updatedAccounts = [...bpiAccounts];
        updatedAccounts[index][field] = value;
        setBpiAccounts(updatedAccounts);
    };

    const addBpiAccount = () => {
        setBpiAccounts([...bpiAccounts, { name: "", accountNumber: "" }]);
    };

    const removeBpiAccount = (index) => {
        setBpiAccounts(prev => prev.filter((_, i) => i !== index));
    };

    const savePaymentInfo = async () => {
        const paymentData = {
            gcashImages,
            bpiImages,
            gcashAccounts,
            bpiAccounts,
        };
        try {
            await setDoc(doc(firestore, "payments", "paymentMethods"), paymentData);
            notifySuccess("Payment information saved successfully.");
        } catch (error) {
            notifyError("Error saving payment information:", error);
        }
    };

    return (
        <>
            <OwnerHeader />
            <OwnerSideBar />
            <main className="ml-64 p-8 mt-16 bg-[#D3D3D3] min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <CreditCard className="w-8 h-8 text-[#2F424B]" />
                        <h1 className="text-4xl text-[#2F424B] font-semibold">Manage Payment Methods</h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* GCash Section */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center gap-2 mb-6">
                                <QrCode className="w-6 h-6 text-[#2F424B]" />
                                <h2 className="text-2xl text-[#2F424B] font-semibold">GCash QR Codes</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="gcash-upload"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'gcash')}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="gcash-upload"
                                        className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#2F424B] transition-colors"
                                    >
                                        <Upload className="w-5 h-5 text-gray-500" />
                                        <span className="text-gray-600">Upload GCash QR Code</span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {gcashImages.map((image, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={image.url}
                                                alt={`GCash QR Code ${index + 1}`}
                                                className="w-full h-48 object-cover rounded-lg shadow-sm"
                                            />
                                            <button
                                                onClick={() => removeImage(index, image.path, 'gcash')}
                                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4 mt-6">
                                    <h3 className="text-xl font-semibold text-[#2F424B]">GCash Accounts</h3>
                                    {gcashAccounts.map((account, index) => (
                                        <div key={index} className="p-4 bg-gray-50 rounded-lg relative group">
                                            <input
                                                type="text"
                                                placeholder="Account Name"
                                                value={account.name}
                                                onChange={(e) => updateGcashAccount(index, "name", e.target.value)}
                                                className="w-full p-3 mb-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2F424B] focus:border-transparent"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Account Number"
                                                value={account.accountNumber}
                                                onChange={(e) => updateGcashAccount(index, "accountNumber", e.target.value)}
                                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2F424B] focus:border-transparent"
                                            />
                                            {gcashAccounts.length > 1 && (
                                                <button
                                                    onClick={() => removeGcashAccount(index)}
                                                    className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={addGcashAccount}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#2F424B] text-white rounded-lg hover:bg-[#576c75] transition-colors"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        Add GCash Account
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* BPI Section */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center gap-2 mb-6">
                                <QrCode className="w-6 h-6 text-[#2F424B]" />
                                <h2 className="text-2xl text-[#2F424B] font-semibold">BPI QR Codes</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="bpi-upload"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'bpi')}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="bpi-upload"
                                        className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#2F424B] transition-colors"
                                    >
                                        <Upload className="w-5 h-5 text-gray-500" />
                                        <span className="text-gray-600">Upload BPI QR Code</span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {bpiImages.map((image, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={image.url}
                                                alt={`BPI QR Code ${index + 1}`}
                                                className="w-full h-48 object-cover rounded-lg shadow-sm"
                                            />
                                            <button
                                                onClick={() => removeImage(index, image.path, 'bpi')}
                                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4 mt-6">
                                    <h3 className="text-xl font-semibold text-[#2F424B]">BPI Accounts</h3>
                                    {bpiAccounts.map((account, index) => (
                                        <div key={index} className="p-4 bg-gray-50 rounded-lg relative group">
                                            <input
                                                type="text"
                                                placeholder="Account Name"
                                                value={account.name}
                                                onChange={(e) => updateBpiAccount(index, "name", e.target.value)}
                                                className="w-full p-3 mb-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2F424B] focus:border-transparent"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Account Number"
                                                value={account.accountNumber}
                                                onChange={(e) => updateBpiAccount(index, "accountNumber", e.target.value)}
                                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2F424B] focus:border-transparent"
                                            />
                                            {bpiAccounts.length > 1 && (
                                                <button
                                                    onClick={() => removeBpiAccount(index)}
                                                    className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={addBpiAccount}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#2F424B] text-white rounded-lg hover:bg-[#576c75] transition-colors"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        Add BPI Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={savePaymentInfo}
                        className="mt-8 px-6 py-3 bg-[#2F424B] text-white rounded-lg hover:bg-[#576c75] transition-colors flex items-center gap-2 mx-auto"
                    >
                        <CreditCard className="w-5 h-5" />
                        Save Payment Methods
                    </button>
                </div>
            </main>
        </>
    );
}

export default OwnerPaymentAccess;