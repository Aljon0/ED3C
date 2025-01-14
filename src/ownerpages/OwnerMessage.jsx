import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";
import { db, auth, storage } from "../firebase";
import { collection, onSnapshot, addDoc, query, orderBy, where, getDoc, doc, getDocs, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { useAuth } from "../components/AuthContext.jsx";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { notifyError } from "../general/CustomToast.js";

const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }).format(date);
};

function OwnerMessage() {
    const { userId } = useParams();
    const { currentUser, userData } = useAuth();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [lastMessages, setLastMessages] = useState({});
    const [unreadMessages, setUnreadMessages] = useState({});
    const messageContainerRef = useRef(null);
    const navigate = useNavigate(); 

    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (!currentUser) return;
        const messagesRef = collection(db, "Messages");
        const q = query(messagesRef, where("ownerID", "==", currentUser.uid));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const usersSet = new Set();
            const usersList = [];
            
            for (const docSnapshot of snapshot.docs) {
                const { customerID } = docSnapshot.data();
                if (customerID && !usersSet.has(customerID)) {
                    usersSet.add(customerID);
                    const customerRef = doc(db, "Users", customerID);
                    const customerSnap = await getDoc(customerRef);
                    if (customerSnap.exists()) {
                        const userData = {
                            id: customerSnap.id,
                            ...customerSnap.data(),
                        };
                        usersList.push(userData);
                    }
                }
            }
            setUsers(usersList);
            
            if (userId) {
                const selectedUserData = usersList.find(user => user.id === userId);
                if (selectedUserData) {
                    setSelectedUser(selectedUserData);
                }
            }
        });
        
        return () => unsubscribe();
    }, [currentUser, userId]);

    const handleUserSelect = async (user) => {
        setSelectedUser(user);
        navigate(`/owner/messages/${user.id}`);

        if (currentUser) {
            const conversationID = `${currentUser.uid}_${user.id}`;
            
            setUnreadMessages(prev => {
                const newUnread = { ...prev };
                delete newUnread[user.id];
                return newUnread;
            });

            // Mark messages as read in Firestore
            const customerMessagesRef = collection(db, "Messages", conversationID, "customerMessages");
            const unreadMessagesQuery = query(customerMessagesRef, where("read", "==", false));
            const unreadMessagesSnap = await getDocs(unreadMessagesQuery);

            const batch = writeBatch(db);
            unreadMessagesSnap.docs.forEach((doc) => {
                batch.update(doc.ref, { read: true });
            });
            await batch.commit();
        }
    };

    useEffect(() => {
        if (!selectedUser || !currentUser) return;

        const conversationID = `${currentUser.uid}_${selectedUser.id}`;
        setMessages([]); // Clear previous messages

        const customerMessagesRef = collection(db, "Messages", conversationID, "customerMessages");
        const ownerMessagesRef = collection(db, "Messages", conversationID, "ownerMessages");

        const customerQuery = query(customerMessagesRef, orderBy("timestamp"));
        const ownerQuery = query(ownerMessagesRef, orderBy("timestamp"));

        let allMessages = [];

        const unsubscribeCustomer = onSnapshot(customerQuery, async (snapshot) => {
            const batch = writeBatch(db);
            const customerMessages = snapshot.docs.map(doc => {
                const data = doc.data();
                // Mark unread messages as read
                if (!data.read) {
                    batch.update(doc.ref, { read: true });
                }
                return {
                    id: doc.id,
                    ...data,
                    senderType: "customer"
                };
            });

            // Commit the batch update
            await batch.commit();

            // Update messages in state
            allMessages = [
                ...allMessages.filter(msg => msg.senderType !== "customer"),
                ...customerMessages
            ];

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

            allMessages = [
                ...allMessages.filter(msg => msg.senderType !== "owner"),
                ...ownerMessages
            ];

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
    }, [currentUser, selectedUser]);

    const sendMessage = async () => {
        if (!message.trim() || !currentUser || !selectedUser) return;

        try {
            const conversationID = `${currentUser.uid}_${selectedUser.id}`;

            const messageData = {
                message: message.trim(),
                sender: "owner", 
                timestamp: new Date(),
                customerID: selectedUser.id,
                ownerID: currentUser.uid
            };

            const messageRef = doc(db, "Messages", conversationID);
            const docSnapshot = await getDoc(messageRef);

            if (!docSnapshot.exists()) {
                await setDoc(messageRef, {
                    customerID: selectedUser.id,
                    ownerID: currentUser.uid
                });
            }

            await addDoc(collection(
                db, 
                "Messages", 
                conversationID, 
                "ownerMessages"
            ), messageData);
            
            setMessage("");
            
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
        if (!file || !selectedUser || !currentUser) return;

        try {
            const storageRef = ref(storage, `chatImages/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const imageUrl = await getDownloadURL(storageRef);

            const conversationID = `${currentUser.uid}_${selectedUser.id}`;

            const messageData = {
                imageUrl,
                sender: "owner",
                timestamp: new Date(),
                customerID: selectedUser.id,
                ownerID: currentUser.uid
            };

            const messageRef = doc(db, "Messages", conversationID);
            const docSnapshot = await getDoc(messageRef);

            if (!docSnapshot.exists()) {
                await setDoc(messageRef, {
                    customerID: selectedUser.id,
                    ownerID: currentUser.uid
                });
            }

            await addDoc(collection(db, "Messages", conversationID, "ownerMessages"), messageData);
            
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

    useEffect(() => {
        const handleKeydown = (event) => {
            if (event.key === 'Escape') {
                closeModal();
            }
        };

        if (isModalOpen) {
            window.addEventListener('keydown', handleKeydown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeydown);
        };
    }, [isModalOpen]);

    const handleSendMessage = async (event) => {
        event.preventDefault();
        if (!message.trim()) return;
        await sendMessage();
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage(event);
        }
    };

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribeUnread = onSnapshot(
            query(collection(db, "Messages")),
            async (snapshot) => {
                const unreadCounts = {};
                const lastMsgs = {};

                for (const docSnapshot of snapshot.docs) {
                    const conversationData = docSnapshot.data();
                    if (conversationData.ownerID === currentUser.uid) {
                        const customerId = conversationData.customerID;
                        const conversationId = docSnapshot.id;

                        const customerMessagesRef = collection(db, "Messages", conversationId, "customerMessages");
                        const customerMessagesQuery = query(customerMessagesRef, orderBy("timestamp", "desc"));
                        const customerMessagesSnap = await getDocs(customerMessagesQuery);

                        let unreadCount = 0;
                        if (!customerMessagesSnap.empty) {
                            const lastMessage = customerMessagesSnap.docs[0].data();
                            lastMsgs[customerId] = {
                                message: lastMessage.message || (lastMessage.imageUrl ? "Sent an image" : ""),
                                timestamp: lastMessage.timestamp
                            };

                            unreadCount = customerMessagesSnap.docs.filter(doc => {
                                const msgData = doc.data();
                                return !msgData.read;
                            }).length;
                        }

                        if (unreadCount > 0) {
                            unreadCounts[customerId] = unreadCount;
                        }
                    }
                }

                setUnreadMessages(unreadCounts);
                setLastMessages(lastMsgs);
            }
        );

        return () => unsubscribeUnread();
    }, [currentUser]);

    return (
        <>
            <OwnerHeader />
            <OwnerSideBar />
            <main className="ml-64 p-8 mt-16 flex">
                <div className="w-[400px] h-[500px] bg-[#2F424B] rounded-md p-4 overflow-y-auto">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full mb-4 p-2 rounded-md bg-[#576c75] text-white outline-none"
                    />
                    {users.length > 0 ? (
                        users
                            .filter(
                                (user) =>
                                    (user.firstname && user.firstname.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                    (user.surname && user.surname.toLowerCase().includes(searchQuery.toLowerCase()))
                            )
                            .sort((a, b) => {
                                // Sort by last message timestamp, most recent first
                                const timeA = lastMessages[a.id]?.timestamp?.toMillis() || 0;
                                const timeB = lastMessages[b.id]?.timestamp?.toMillis() || 0;
                                return timeB - timeA;
                            })
                            .map((user) => (
                                <div
                                    key={user.id}
                                    className={`flex flex-col m-2 cursor-pointer rounded-md p-2 transition-colors duration-300 ${
                                        selectedUser?.id === user.id ? 'bg-[#576c75]' : 'hover:bg-[#37474F]'
                                    }`}
                                    onClick={() => handleUserSelect(user)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="relative">
                                                <img
                                                    src={user.imageUrl || "/assets/mingcute--user-4-line.svg"}
                                                    alt={user.firstname}
                                                    className="rounded-full w-16 h-16"
                                                />
                                                {unreadMessages[user.id] && (
                                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                        {unreadMessages[user.id]}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="ml-4 flex flex-col">
                                                <h2 className="text-base font-semibold text-white">
                                                    {user.firstName} {user.surname}
                                                </h2>
                                                {lastMessages[user.id] && (
                                                    <>
                                                        <p className="text-sm text-gray-300 truncate max-w-[200px]">
                                                            {lastMessages[user.id].message}
                                                        </p>
                                                        <span className="text-xs text-gray-400">
                                                            {formatMessageTime(lastMessages[user.id].timestamp)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                    ) : (
                        <p className="text-white">No users found.</p>
                    )}
                </div>

                    <div className="w-[650px] h-[500px] bg-[#DADADA] flex flex-col justify-between rounded-lg shadow-lg ml-4">
                        {selectedUser ? (
                            <>
                                <div className="w-full flex items-center justify-between p-4 bg-[#2F424B] text-white rounded-t-lg">
                                    <div className="flex items-center">
                                        <img
                                            src={selectedUser.imageUrl || "/assets/mingcute--user-4-line.svg"}
                                            alt={selectedUser.firstName}
                                            className="rounded-full w-12 h-12 mr-4"
                                        />
                                        <h2 className="text-xl font-semibold">
                                            {selectedUser.firstName} {selectedUser.surname}
                                        </h2>
                                    </div>
                                </div>

                                <div
                                    ref={messageContainerRef}
                                    className="flex-grow overflow-y-auto mb-4 space-y-4 bg-[#DADADA] rounded-b-lg p-4"
                                    style={{ scrollBehavior: 'smooth' }} // Add smooth scrolling
                                >
                                    {messages.map((msg, idx) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.senderType === "owner" ? "justify-end" : ""}`}
                                        >
                                            <div className="flex flex-col">
                                                <div
                                                    className={`p-3 rounded-lg max-w-xs ${
                                                        msg.senderType === "owner" ? "bg-[#37474F] text-white" : "bg-white text-black"
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
                                                    msg.senderType === "owner" ? "text-right" : "text-left"
                                                } text-gray-600`}>
                                                    {formatMessageTime(msg.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            
                                

                                <div className="flex items-center p-4 bg-[#DADADA] rounded-lg shadow-md">
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
                            <p className="text-gray-500 text-center m-auto">Select a user to start messaging</p>
                        )}
                    </div>
            </main>

            {/* Modal for viewing images */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-[100]"
                    onClick={closeModal} // Close on background click
                >
                    <div 
                        className="relative max-w-[90vw] max-h-[90vh]"
                        onClick={e => e.stopPropagation()} // Prevent closing when clicking the image
                    >
                        <img 
                            src={selectedImage} 
                            alt="Full view" 
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

export default OwnerMessage;
