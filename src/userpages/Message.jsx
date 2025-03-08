import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth, storage } from "../firebase";
import { collection, onSnapshot, addDoc, query, orderBy, doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { notifyError, notifySuccess } from "../general/CustomToast.js";
import Navigation from "../components/Navigation.jsx";

const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

    // Time format
    const timeStr = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }).format(date);

    // Date format
    if (isToday) {
        return `Today at ${timeStr}`;
    } else if (isYesterday) {
        return `Yesterday at ${timeStr}`;
    } else {
        const dateStr = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        }).format(date);
        return `${dateStr} at ${timeStr}`;
    }
};

function Message() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [ownerDetails, setOwnerDetails] = useState(null);
    const messageContainerRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const ownerID = 'Jl4zT8uPmLTJxEo3UdfWkj2Co0z2';

    const sendMessage = async () => {
        if (!message.trim() || !currentUser) return;

        try {
            const conversationID = `${ownerID}_${currentUser.uid}`;

            const messageData = {
                message: message.trim(),
                sender: "customer",
                timestamp: new Date(),
                customerID: currentUser.uid,
                ownerID: ownerID
            };

            const messageRef = doc(db, "Messages", conversationID);
            const docSnapshot = await getDoc(messageRef);

            if (!docSnapshot.exists()) {
                await setDoc(messageRef, {
                    customerID: currentUser.uid,
                    ownerID: ownerID
                });
            }

            await addDoc(collection(
                db,
                "Messages",
                conversationID,
                messageData.sender === "customer" ? "customerMessages" : "ownerMessages"
            ), messageData);

            setMessage("");

            // Scroll to bottom after sending
            setTimeout(() => {
                if (messageContainerRef.current) {
                    messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
                }
            }, 100);
        } catch (error) {
            notifyError("Error sending message: ", error);
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || !currentUser) return;

        try {
            const storageRef = ref(storage, `chatImages/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const imageUrl = await getDownloadURL(storageRef);

            const conversationID = `${ownerID}_${currentUser.uid}`;

            const messageData = {
                imageUrl,
                sender: "customer",
                timestamp: new Date(),
                customerID: currentUser.uid,
                ownerID: ownerID
            };

            const messageRef = doc(db, "Messages", conversationID);
            const docSnapshot = await getDoc(messageRef);

            if (!docSnapshot.exists()) {
                await setDoc(messageRef, {
                    customerID: currentUser.uid,
                    ownerID: ownerID
                });
            }

            await addDoc(collection(db, "Messages", conversationID, "customerMessages"), messageData);

            // Scroll to bottom after sending image
            setTimeout(() => {
                if (messageContainerRef.current) {
                    messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
                }
            }, 100);
        } catch (error) {
            notifyError("Error uploading image: ", error);
        }
    };

    const openModal = (imageUrl) => {
        setSelectedImage(imageUrl);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedImage(null);
    };

    const handleSendMessage = async (event) => {
        event.preventDefault(); // Prevent form submission
        if (!message.trim()) return; // Don't send empty messages

        await sendMessage();
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage(event);
        }
    };

    // Add useEffect for ESC and Enter key handling
    useEffect(() => {
        const handleKeydown = (event) => {
            if (event.key === 'Escape') {
                closeModal();
            }
            // Remove the Enter key handling from here
        };

        if (isModalOpen) {
            window.addEventListener('keydown', handleKeydown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeydown);
        };
    }, [isModalOpen]); // Remove message dependency

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setCurrentUser(user);
                // Use React Router's navigate instead of window.history
                if (!userId) {
                    navigate(`/messages/${ownerID}`);
                }
            } else {
                // Redirect to login if no user is authenticated
                navigate('/login');
            }
        });
        return unsubscribe;
    }, [navigate, userId]);

    useEffect(() => {
        const fetchOwnerDetails = async () => {
            const ownerDocRef = doc(db, "Users", ownerID);
            const ownerDoc = await getDoc(ownerDocRef);

            if (ownerDoc.exists()) {
                const ownerData = ownerDoc.data();
                setOwnerDetails({
                    name: `${ownerData.firstName} ${ownerData.surname}`,
                    imageUrl: ownerData.imageUrl || "/assets/placeholder.png",
                });
            }
        };

        fetchOwnerDetails();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const conversationID = `${ownerID}_${currentUser.uid}`;
        setMessages([]); // Clear previous messages

        const customerMessagesRef = collection(db, "Messages", conversationID, "customerMessages");
        const ownerMessagesRef = collection(db, "Messages", conversationID, "ownerMessages");

        const customerQuery = query(customerMessagesRef, orderBy("timestamp"));
        const ownerQuery = query(ownerMessagesRef, orderBy("timestamp"));

        // Create a Set to track unique message IDs
        let allMessages = [];

        const unsubscribeCustomer = onSnapshot(customerQuery, (snapshot) => {
            const customerMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                senderType: "customer"
            }));

            // Update only customer messages in the array
            allMessages = [
                ...allMessages.filter(msg => msg.senderType !== "customer"),
                ...customerMessages
            ];

            // Sort by timestamp and update state
            const sortedMessages = allMessages.sort((a, b) =>
                (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0)
            );
            setMessages(sortedMessages);
        });

        const unsubscribeOwner = onSnapshot(ownerQuery, (snapshot) => {
            const ownerMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                senderType: "owner"
            }));

            // Update only owner messages in the array
            allMessages = [
                ...allMessages.filter(msg => msg.senderType !== "owner"),
                ...ownerMessages
            ];

            // Sort by timestamp and update state
            const sortedMessages = allMessages.sort((a, b) =>
                (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0)
            );
            setMessages(sortedMessages);
        });

        return () => {
            unsubscribeCustomer();
            unsubscribeOwner();
            allMessages = [];
        };
    }, [currentUser]);

    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 mt-8">
            <Navigation />
            <main className="w-full mt-8 p-4 md:p-8 flex-grow">
                <div className="flex flex-col h-[calc(80vh-4rem)] md:h-[calc(85vh-4rem)]">
                    <div className="w-full bg-[#DADADA] flex flex-col flex-grow rounded-lg overflow-hidden">
                        {currentUser ? (
                            <>
                                <div className="w-full flex items-center p-4 bg-[#2F424B] text-white">
                                    <div className="flex items-center">
                                        <img
                                            src="/assets/mingcute--user-4-line.svg"
                                            alt="Owner"
                                            className="rounded-full w-8 h-8 md:w-12 md:h-12 mr-2 md:mr-4"
                                        />
                                        <h2 className="text-lg md:text-xl font-semibold">Owner</h2>
                                    </div>
                                </div>

                                <div
                                    ref={messageContainerRef}
                                    className="flex-grow w-full p-4 space-y-4 overflow-y-auto bg-[#DADADA]"
                                    style={{ scrollBehavior: 'smooth' }}
                                >
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.senderType === "customer" ? "justify-end" : ""}`}
                                        >
                                            <div className="flex flex-col max-w-[75%] md:max-w-[50%]">
                                                <div
                                                    className={`p-3 rounded-lg ${msg.senderType === "owner"
                                                            ? "bg-white text-black"
                                                            : "bg-[#37474F] text-white"
                                                        }`}
                                                >
                                                    {msg.imageUrl ? (
                                                        <img
                                                            src={msg.imageUrl}
                                                            alt="Sent image"
                                                            className="max-w-full rounded-lg cursor-pointer"
                                                            onClick={() => openModal(msg.imageUrl)}
                                                        />
                                                    ) : (
                                                        <p className="break-words">{msg.message}</p>
                                                    )}
                                                </div>
                                                <span className={`text-xs mt-1 ${msg.senderType === "customer" ? "text-right" : "text-left"
                                                    } text-gray-600`}>
                                                    {formatMessageTime(msg.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center p-4 bg-[#DADADA] shadow-md">
                                    <img
                                        src="/assets/uil--image-plus.svg"
                                        className="w-8 h-8 md:w-10 md:h-10 mr-2 cursor-pointer"
                                        alt="Image Icon"
                                        onClick={() => document.getElementById("imageInput").click()}
                                    />
                                    <input
                                        type="file"
                                        id="imageInput"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="flex-grow bg-white rounded-lg p-2 md:p-3"
                                    />
                                    <img
                                        src="/assets/wpf--sent.svg"
                                        className="w-6 h-6 md:w-8 md:h-8 ml-2 md:ml-3 cursor-pointer"
                                        alt="Send"
                                        onClick={handleSendMessage}
                                    />
                                </div>
                            </>
                        ) : (
                            <p className="p-4 text-center">Loading...</p>
                        )}
                    </div>
                </div>
            </main>

            {isModalOpen && selectedImage && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
                    onClick={closeModal}
                >
                    <div
                        className="relative max-w-[90vw] max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={selectedImage}
                            alt="Modal Image"
                            className="max-w-full max-h-[90vh] rounded-lg"
                        />
                        <button
                            className="absolute top-2 right-2 md:top-4 md:right-4 bg-white rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-black hover:bg-gray-200 transition-colors"
                            onClick={closeModal}
                        >
                            &times;
                        </button>
                        <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 md:px-3 md:py-1 rounded text-xs md:text-sm">
                            Press ESC to close
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Message;
