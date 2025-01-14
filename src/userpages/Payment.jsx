import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import UserHeader from "../components/UserHeader.jsx";
import UserSideBar from "../components/UserSideBar.jsx";
import { notifyError } from "../general/CustomToast.js";

function PolicyAgreement({ hasAgreed, setHasAgreed }) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl text-[#2F424B] font-semibold mb-4">Payment Policy Agreement</h2>
            <div className="space-y-4 text-[#2F424B]">
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Important Policies:</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Full payment/Partial Payment is required before the commencement of any project work.</li>
                        <li>No fully refunds will be issued once project production has begun.</li>
                        <li>By proceeding with the payment, you acknowledge and agree to these terms.</li>
                    </ul>
                </div>

                <div className="flex items-center space-x-2 mt-4">
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

function Payment() {
    const [gcashAccounts, setGcashAccounts] = useState([]);
    const [bpiAccount, setBpiAccount] = useState({ name: "", accountNumber: "" });
    const [gcashImage, setGcashImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasAgreed, setHasAgreed] = useState(false);

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
                    notifyError("No document found!");
                }
            } catch (error) {
                notifyError("Error fetching payment data:", error);
            }
        };

        fetchPaymentData();
    }, []);

    return (
        <>
            <UserHeader />
            <UserSideBar />
            <main className="ml-64 p-8 mt-16">
                <PolicyAgreement hasAgreed={hasAgreed} setHasAgreed={setHasAgreed} />
                
                {hasAgreed && (
                    <>
                        <span className="text-4xl text-[#2F424B] font-semibold mb-4 block mt-10">
                            Available Payment Methods
                        </span>
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
                                                    <img src={gcashImage} alt="GCash QR Code Large" className="w-[80vw] h-[90vh] object-contain" />
                                                    <button 
                                                        onClick={() => setIsModalOpen(false)} 
                                                        className="absolute top-0 right-16 text-white text-3xl font-bold bg-inherit rounded-full p-1"
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
                    </>
                )}
            </main>
        </>
    );
}

export default Payment;