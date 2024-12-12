import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Add this import
import UserHeader from "../components/UserHeader.jsx";
import UserSideBar from "../components/UserSideBar.jsx";
import { db, auth, storage } from "../firebase";
import { collection, onSnapshot, addDoc, query, orderBy, doc, getDoc, setDoc, getDocs, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function Message() {
    const { userId } = useParams(); // Get the userId from URL parameters
    const navigate = useNavigate(); // Add this hook for navigation
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [ownerDetails, setOwnerDetails] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const ownerID = 'Jl4zT8uPmLTJxEo3UdfWkj2Co0z2';  // Static owner ID

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

        const unsubscribeCustomer = onSnapshot(customerQuery, (snapshot) => {
            const customerMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                senderType: "customer"
            }));
            setMessages(prev => {
                const allMessages = [...prev, ...customerMessages];
                return allMessages.sort((a, b) => 
                    a.timestamp.toMillis() - b.timestamp.toMillis()
                );
            });
        });

        const unsubscribeOwner = onSnapshot(ownerQuery, (snapshot) => {
            const ownerMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                senderType: "owner"
            }));
            setMessages(prev => {
                const allMessages = [...prev, ...ownerMessages];
                return allMessages.sort((a, b) => 
                    a.timestamp.toMillis() - b.timestamp.toMillis()
                );
            });
        });

        return () => {
            unsubscribeCustomer();
            unsubscribeOwner();
        };
    }, [currentUser, ownerID]);

    const sendMessage = async () => {
        if (!message || !currentUser) return;
    
        try {
            const conversationID = `${ownerID}_${currentUser.uid}`;
    
            const messageData = {
                message: message,
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
            setMessage("");
        } catch (error) {
            console.error("Error sending message: ", error);
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
            setMessages(prev => [...prev, messageData]);  // Add to local state for instant display
        } catch (error) {
            console.error("Error uploading image: ", error);
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

    const handleDeleteConversation = async () => {
        if (!currentUser || !ownerDetails) return;
      
        const conversationID = `${ownerDetails.id}_${currentUser.uid}`;
      
        try {
          // Delete customer's messages
          const customerMessagesRef = collection(db, "Messages", conversationID, "customerMessages");
          const customerMessagesSnapshot = await getDocs(customerMessagesRef);
      
          const deleteCustomerPromises = customerMessagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deleteCustomerPromises);
      
          // Update the main conversation document to remove the customer's ID
          const messageRef = doc(db, "Messages", conversationID);
          await updateDoc(messageRef, {
            customerID: firebase.firestore.FieldValue.delete()
          });
      
          setMessages([]);
          setOwnerDetails(null);
      
          alert("Conversation deleted on your side.");
        } catch (error) {
          console.error("Error deleting conversation: ", error);
        }
      };
    
    return (
        <>
            <UserHeader />
            <UserSideBar />
            <main className="ml-64 p-8 mt-16">
                <div className="flex">
                    <div className="w-full h-[500px] bg-[#DADADA]">
                    {currentUser ? (
                        <>
                        <div className="w-full flex items-center justify-between p-4 bg-[#2F424B] text-white rounded">
                            <div className="flex items-center">
                            <img
                                src="/assets/mingcute--user-4-line.svg"
                                alt="Owner"
                                className="rounded-full w-12 h-12 mr-4"
                            />
                            <h2 className="text-xl font-semibold">Owner</h2>
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

                        <div className="w-full h-[300px] p-4 space-y-4 overflow-y-auto bg-[#DADADA] rounded">
                            {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.senderType === "customer" ? "justify-end" : ""}`}
                            >
                                <div
                                className={`p-3 rounded-md max-w-xs ${
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
