import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Add this import
import UserHeader from "../components/UserHeader.jsx";
import UserSideBar from "../components/UserSideBar.jsx";
import { db, auth, storage } from "../firebase";
import { collection, onSnapshot, addDoc, query, orderBy, doc, getDoc, setDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { notifyError, notifySuccess } from "../general/CustomToast.js";

const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }).format(date);
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
        <>
            <UserHeader />
            <UserSideBar />
            <main className="ml-64 p-8 mt-16">
                <div className="flex">
                    <div className="w-full h-[500px] bg-[#DADADA]">
                    {currentUser ? (
                        <>
                        <div className="w-full flex items-center p-4 bg-[#2F424B] text-white rounded">
                            <div className="flex items-center">
                                <img
                                    src="/assets/mingcute--user-4-line.svg"
                                    alt="Owner"
                                    className="rounded-full w-12 h-12 mr-4"
                                />
                                <h2 className="text-xl font-semibold">Owner</h2>
                            </div>
                        </div>

                        <div 
                            ref={messageContainerRef}
                            className="w-full h-[300px] p-4 space-y-4 overflow-y-auto bg-[#DADADA] rounded"
                            style={{ scrollBehavior: 'smooth' }} // Add smooth scrolling
                        >
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.senderType === "customer" ? "justify-end" : ""}`}
                                >
                                    <div className="flex flex-col">
                                        <div
                                            className={`p-3 rounded-lg max-w-xs ${
                                                msg.senderType === "owner" 
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
                                                <p>{msg.message}</p>
                                            )}
                                        </div>
                                        <span className={`text-xs mt-1 ${
                                            msg.senderType === "customer" ? "text-right" : "text-left"
                                        } text-gray-600`}>
                                            {formatMessageTime(msg.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center p-4 bg-[#DADADA] shadow-md rounded mt-10">
                            <img
                                src="/assets/uil--image-plus.svg"
                                className="w-[40px] h-[40px] mr-2 cursor-pointer"
                                alt="Image Icon"
                                onClick={() => document.getElementById("imageInput").click()}
                            />
                            <input
                                type="file"
                                id="imageInput"
                                onChange={handleImageUpload}
                                style={{ display: "none" }}
                            />
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full bg-white rounded-lg p-3"
                            />
                            <img
                                src="/assets/wpf--sent.svg"
                                className="w-[30px] h-[30px] ml-3 cursor-pointer"
                                alt="Send"
                                onClick={handleSendMessage}
                            />
                        </div>
                        </>
                    ) : (
                        <p>Loading...</p>
                    )}
                    </div>
                </div>
            </main>

            {isModalOpen && selectedImage && (
                <div 
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
                    onClick={closeModal} // Close on background click
                >
                    <div 
                        className="relative max-w-[90vw] max-h-[90vh]"
                        onClick={e => e.stopPropagation()} // Prevent closing when clicking the image
                    >
                        <img 
                            src={selectedImage} 
                            alt="Modal Image" 
                            className="max-w-full max-h-[90vh] rounded-lg"
                        />
                        <button
                            className="absolute top-4 right-4 bg-white rounded-full w-8 h-8 flex items-center justify-center text-black hover:bg-gray-200 transition-colors"
                            onClick={closeModal}
                        >
                            &times;
                        </button>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                            Press ESC to close
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Message;
