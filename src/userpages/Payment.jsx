import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import Navigation from "../components/Navigation.jsx";
import { notifyError } from "../general/CustomToast.js";
import { CreditCard, QrCode, X } from "lucide-react";

function PolicyAgreement({ hasAgreed, setHasAgreed }) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-6 h-6 text-[#2F424B]" />
                <h2 className="text-2xl text-[#2F424B] font-semibold">Payment Policy Agreement</h2>
            </div>
            <div className="space-y-4 text-[#2F424B]">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h3 className="font-semibold mb-2">Important Policies:</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Full payment/Partial Payment is required before the commencement of any project work.</li>
                        <li>No fully refunds will be issued once project production has begun.</li>
                        <li>By proceeding with the payment, you acknowledge and agree to these terms.</li>
                    </ul>
                </div>

                <div className="flex items-center space-x-3 mt-4">
                    <input
                        type="checkbox"
                        id="policyCheckbox"
                        checked={hasAgreed}
                        onChange={() => setHasAgreed(!hasAgreed)}
                        className="w-6 h-6 rounded border-gray-300 text-[#37474F] focus:ring-[#37474F]"
                    />
                    <label htmlFor="policyCheckbox" className="text-sm font-medium">
                        I have read and agree to the payment policies
                    </label>
                </div>
            </div>
        </div>
    );
}

function PaymentMethod({ title, icon, children }) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
                {icon}
                <h2 className="text-2xl text-[#2F424B] font-semibold">{title}</h2>
            </div>
            {children}
        </div>
    );
}

function Payment() {
    const [gcashAccounts, setGcashAccounts] = useState([]);
    const [bpiAccounts, setBpiAccounts] = useState([]);
    const [gcashImages, setGcashImages] = useState([]);
    const [bpiImages, setBpiImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [hasAgreed, setHasAgreed] = useState(false);

    useEffect(() => {
        const fetchPaymentData = async () => {
            const docRef = doc(db, "payments", "paymentMethods");
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setGcashImages(data.gcashImages || []);
                    setBpiImages(data.bpiImages || []);
                    setGcashAccounts(data.gcashAccounts || []);
                    setBpiAccounts(data.bpiAccounts || []);
                } else {
                    notifyError("No payment methods available!");
                }
            } catch (error) {
                notifyError("Error fetching payment data:", error);
            }
        };

        fetchPaymentData();
    }, []);

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 mt-16">
            <Navigation />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <PolicyAgreement hasAgreed={hasAgreed} setHasAgreed={setHasAgreed} />

                    {hasAgreed && (
                        <>
                            <div className="flex items-center gap-3 mb-8">
                                <CreditCard className="w-8 h-8 text-[#2F424B]" />
                                <h1 className="text-4xl text-[#2F424B] font-semibold">Available Payment Methods</h1>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <PaymentMethod
                                    title="GCash QR Codes"
                                    icon={<QrCode className="w-6 h-6 text-[#2F424B]" />}
                                >
                                    {gcashImages.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                                            {gcashImages.map((image, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={image.url}
                                                        alt={`GCash QR Code ${index + 1}`}
                                                        onClick={() => setSelectedImage(image.url)}
                                                        className="w-full h-48 object-cover rounded-lg shadow-sm cursor-pointer transition-transform hover:scale-105"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center">No QR codes available</p>
                                    )}

                                    <div className="mt-6 space-y-4">
                                        <h3 className="text-xl font-semibold text-[#2F424B]">GCash Accounts</h3>
                                        {gcashAccounts.map((account, index) => (
                                            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                <p className="font-medium text-[#2F424B]">{account.name}</p>
                                                <p className="text-gray-600">Account Number: {account.accountNumber}</p>
                                            </div>
                                        ))}
                                    </div>
                                </PaymentMethod>

                                <PaymentMethod
                                    title="BPI Qr Codes"
                                    icon={<QrCode className="w-6 h-6 text-[#2F424B]" />}
                                >
                                    {bpiImages.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-6">
                                            {bpiImages.map((image, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={image.url}
                                                        alt={`BPI QR Code ${index + 1}`}
                                                        onClick={() => setSelectedImage(image.url)}
                                                        className="w-full h-48 object-cover rounded-lg shadow-sm cursor-pointer transition-transform hover:scale-105"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center mb-6">No QR codes available</p>
                                    )}

                                    <div className="space-y-4">
                                        <h3 className="text-xl font-semibold text-[#2F424B]">BPI Accounts</h3>
                                        {bpiAccounts.map((account, index) => (
                                            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                <p className="font-medium text-[#2F424B]">{account.name}</p>
                                                <p className="text-gray-600">Account Number: {account.accountNumber}</p>
                                            </div>
                                        ))}
                                    </div>
                                </PaymentMethod>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="relative max-w-3xl w-80 mx-4">
                        <img
                            src={selectedImage}
                            alt="QR Code Large"
                            className="w-full h-auto rounded-lg"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-4 -right-4 p-2 bg-white text-[#2F424B] rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Payment;