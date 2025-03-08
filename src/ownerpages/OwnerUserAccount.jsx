import { useState, useEffect } from "react";
import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { sendAccountEmail } from "../utils/emailservice.js";
import { useAuth } from "../components/AuthContext";
import { notifyError, notifySuccess, notifyWarning } from "../general/CustomToast.js";
import SearchBar from "../components/SearchBar.jsx";

function OwnerUserAccount() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserData, setCurrentUserData] = useState(null);

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

  const handleBanUser = async (userId, email) => {
    if (currentUserData?.role !== 'owner') {
      notifyWarning("Only the owner can ban users.");
      return;
    }

    const confirmation = window.confirm("Do you really want to ban this user?");

    if (confirmation) {
      try {
        // Update Firestore
        await updateDoc(doc(db, "Users", userId), { isBanned: true });

        // Send email notification
        await sendAccountEmail(email, true);

        // Update local state
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, isBanned: true } : user
          )
        );

        notifySuccess("User has been banned and notified via email.");
      } catch (error) {
        console.error("Error banning user:", error);
        notifyError("Failed to ban the user. Please try again.");
      }
    }
  };

  const handleUnbanUser = async (userId, email) => {
    if (currentUserData?.role !== 'owner') {
      notifyWarning("Only the owner can unban users.");
      return;
    }

    const confirmation = window.confirm("Do you want to unban this user?");

    if (confirmation) {
      try {
        // Update Firestore
        await updateDoc(doc(db, "Users", userId), { isBanned: false });

        // Send email notification
        await sendAccountEmail(email, false);

        // Update local state
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, isBanned: false } : user
          )
        );

        notifySuccess("User has been unbanned successfully.");
      } catch (error) {
        console.error("Error unbanning user:", error);
        notifyError("Failed to unban the user. Please try again.");
      }
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase());
  };

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
        <div className="w-full bg-[#D3D3D3] rounded-md p-6">
          <div className="w-full max-w-7xl space-y-6">
            {/* Header and Search Section */}
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-bold text-[#2F424B] tracking-tight">
                Customers Account
              </h1>

              <SearchBar onSearch={handleSearch} />
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">First Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Surname</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact#</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Address</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {user.firstName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {user.surname}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {user.contact}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 max-w-[200px] truncate">
                          {user.address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${user.isBanned
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                              }`}
                          >
                            {user.isBanned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.isBanned ? (
                            <button
                              onClick={() => handleUnbanUser(user.id, user.email)}
                              className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors duration-150"
                            >
                              <img
                                src="/assets/mdi--ban.svg"
                                className="w-4 h-4 mr-2 transform rotate-45"
                                alt="Unban icon"
                              />
                              Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanUser(user.id, user.email)}
                              className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors duration-150"
                            >
                              <img
                                src="/assets/mdi--ban.svg"
                                className="w-4 h-4 mr-2"
                                alt="Ban icon"
                              />
                              Ban
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default OwnerUserAccount