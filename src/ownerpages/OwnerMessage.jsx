import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";
import { db, auth, storage } from "../firebase";
import { collection, onSnapshot, addDoc, query, orderBy, where, getDoc, doc, getDocs, deleteDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../components/AuthContext.jsx";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


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

    useEffect(() => {
        if (!selectedUser || !currentUser) return;

        // Create conversation ID in the same format as the customer component
        const conversationID = `${currentUser.uid}_${selectedUser.id}`;
        setMessages([]); // Clear previous messages

        // Create or ensure conversation document exists
        const ensureConversation = async () => {
            const messageRef = doc(db, "Messages", conversationID);
            const docSnapshot = await getDoc(messageRef);
            
            if (!docSnapshot.exists()) {
                await setDoc(messageRef, {
                    customerID: selectedUser.id,
                    ownerID: currentUser.uid
                });
            }
        };
        ensureConversation();

        // Listen to both customer and owner messages
        const customerMessagesRef = collection(db, "Messages", conversationID, "customerMessages");
        const ownerMessagesRef = collection(db, "Messages", conversationID, "ownerMessages");

        const customerQuery = query(customerMessagesRef, orderBy("timestamp"));
        const ownerQuery = query(ownerMessagesRef, orderBy("timestamp"));

        const unsubscribeCustomer = onSnapshot(customerQuery, (snapshot) => {
            const customerMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                senderType: "customer"
            }));
            setMessages(prev => {
                const allMessages = [...prev.filter(m => m.senderType !== "customer"), ...customerMessages];
                return allMessages.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
            });
        });

        const unsubscribeOwner = onSnapshot(ownerQuery, (snapshot) => {
            const ownerMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                senderType: "owner"
            }));
            setMessages(prev => {
                const allMessages = [...prev.filter(m => m.senderType !== "owner"), ...ownerMessages];
                return allMessages.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
            });
        });

        return () => {
            unsubscribeCustomer();
            unsubscribeOwner();
        };
    }, [selectedUser, currentUser]);

    const sendMessage = async () => {
        if (!selectedUser || !message || !currentUser) return;

        const conversationID = `${currentUser.uid}_${selectedUser.id}`;

        try {
            const messageData = {
                message: message,
                sender: "owner",
                timestamp: new Date(),
                customerID: selectedUser.id,
                ownerID: currentUser.uid
            };

            // Ensure the main conversation document exists
            const messageRef = doc(db, "Messages", conversationID);
            const docSnapshot = await getDoc(messageRef);

            if (!docSnapshot.exists()) {
                await setDoc(messageRef, {
                    customerID: selectedUser.id,
                    ownerID: currentUser.uid
                });
            }

            await addDoc(collection(db, "Messages", conversationID, "ownerMessages"), messageData);
            setMessage("");
        } catch (error) {
            console.error("Error sending message: ", error);
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
        } catch (error) {
            console.error("Error uploading image: ", error);
        }
    };

    const handleDeleteConversation = async () => {
        if (!selectedUser || !currentUser) return;
      
        const conversationID = `${currentUser.uid}_${selectedUser.id}`;
      
        try {
          // Delete owner's messages
          const ownerMessagesRef = collection(db, "Messages", conversationID, "ownerMessages");
          const ownerMessagesSnapshot = await getDocs(ownerMessagesRef);
      
          const deleteOwnerPromises = ownerMessagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deleteOwnerPromises);
      
          // Update the main conversation document to remove the owner's ID
          const messageRef = doc(db, "Messages", conversationID);
          await updateDoc(messageRef, {
            ownerID: firebase.firestore.FieldValue.delete()
          });
      
          setMessages([]);
          setSelectedUser(null);
      
          alert("Conversation deleted on your side.");
        } catch (error) {
          console.error("Error deleting conversation: ", error);
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
    
     // Add useEffect for ESC and Enter key handling
    useEffect(() => {
        const handleKeydown = (event) => {
            if (event.key === 'Escape') {
                closeModal();
            } else if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Prevent default form submission
                sendMessage();
            }
        };

        if (isModalOpen || message.trim().length > 0) {
            window.addEventListener('keydown', handleKeydown);
        }

        // Cleanup listener when component unmounts or modal closes
        return () => {
            window.removeEventListener('keydown', handleKeydown);
        };
    }, [isModalOpen, message]); // Re-run effect when modal state or message changes

    const handleSendMessage = (event) => {
        event.preventDefault(); // Prevent form submission
        if (message.trim().length > 0) {
            sendMessage();
        }
    };

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
                                .map((user) => (
                                    <div
                                        key={user.id}
                                        className={`flex flex-col m-2 cursor-pointer rounded-md p-2 transition-colors duration-300 ${
                                            selectedUser?.id === user.id ? 'bg-[#576c75]' : 'hover:bg-[#37474F]'
                                        }`}
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <div className="flex items-center">
                                            <img
                                                src={user.imageUrl || "https://via.placeholder.com/80"}
                                                alt={user.firstname}
                                                className="rounded-full w-16 h-16"
                                            />
                                            <div className="ml-4">
                                                <h2 className="text-base font-semibold text-white leading-3">
                                                    {user.firstName} {user.surname}
                                                </h2>
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
                                            src={selectedUser.imageUrl || "/assets/placeholder.png"}
                                            alt={selectedUser.firstName}
                                            className="rounded-full w-12 h-12 mr-4"
                                        />
                                        <h2 className="text-xl font-semibold">
                                            {selectedUser.firstName} {selectedUser.surname}
                                        </h2>
                                    </div>
                                    <div className="flex items-center">
                                        <img
                                            src="/assets/bx--trash-white.svg"
                                            alt="Trash"
                                            className="w-6 h-6 cursor-pointer"
                                            onClick={handleDeleteConversation}
                                        />
                                    </div>
                                </div>

                                <div className="flex-grow overflow-y-auto mb-4 space-y-4 bg-[#DADADA] rounded-b-lg p-4">
                                    {messages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${msg.senderType === "owner" ? "justify-end" : ""}`}
                                        >
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
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)}
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
