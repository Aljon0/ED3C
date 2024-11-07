import { useState, useEffect } from "react";
import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // Assuming firebase.js exports db for Firestore
import { sendBanNotificationEmail } from "/utils/emailService"; // Assuming a utility to send emails
import { useAuth } from "../components/AuthContext";

function OwnerUserAccount() {
  const { currentUser } = useAuth(); // Get the current authenticated user
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [currentUserData, setCurrentUserData] = useState(null);

  // Fetching current user data (to check if they're the owner)
  useEffect(() => {
    const fetchCurrentUserData = async () => {
      const userDoc = doc(db, "Users", currentUser.uid);
      const userSnapshot = await getDoc(userDoc);
      setCurrentUserData(userSnapshot.data());
    };

    if (currentUser) {
      fetchCurrentUserData();
    }
  }, [currentUser]);

  // Fetching user data from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, "Users");
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map((doc) => ({
        id: doc.id, 
        ...doc.data(),
      }));
      setUsers(userList);
    };
    
    fetchUsers();
  }, []);

  // Function to handle user ban
  const handleBanUser = async (userId, email) => {
    if (currentUserData?.role !== 'owner') {
      alert("Only the owner can ban users.");
      return;
    }

    const confirmation = window.confirm("Do you really want to ban this user?");
    
    if (confirmation) {
      try {
        // Mark user as banned in Firestore
        await updateDoc(doc(db, "Users", userId), { isBanned: true });
        
        // Send email notification to the user
        await sendBanNotificationEmail(email);
        
        alert("User has been banned and notified via email.");
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error("Error banning user: ", error);
        alert("Failed to ban the user. Please try again.");
      }
    } else {
      alert("Ban action cancelled.");
    }
  };

  // Filtering users based on the search term
  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName || ""} ${user.surname || ""}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <>
      <OwnerHeader />
      <OwnerSideBar />
      <main className="ml-64 p-8 mt-16">
        <div className="w-full max-w-7xl bg-[#FAFAFA] rounded-md p-6 overflow-hidden">
          <span className="text-4xl text-[#2F424B] font-semibold mb-4 block">CUSTOMERS ACCOUNT</span>

          {/* Search Bar */}
          <div className="rounded-full bg-[#FAFAFA] border-solid border-slate-400 border-2 flex w-full max-w-md mb-4">
            <input
              type="text"
              placeholder="Search Names here..."
              className="rounded-full p-2 bg-[#FAFAFA] flex-grow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <img src="/assets/heroicons--magnifying-glass-16-solid.svg" className="ml-2" />
          </div>

          {/* Table for Customer Details */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USERNAME</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMAIL</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FIRST NAME</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SURNAME</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CONTACT#</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADDRESS</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTION</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">{user.firstName}</td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">{user.surname}</td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">{user.contact}</td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">{user.address}</td>
                    <td
                      className="px-2 py-4 whitespace-nowrap text-sm text-red-500 cursor-pointer"
                      onClick={() => handleBanUser(user.id, user.email)}
                    >
                      BAN
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}

export default OwnerUserAccount;
