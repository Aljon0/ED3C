import React, { useState, useEffect } from "react";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";
import { Alert } from "../components/Alert.jsx";
import { DeletionAlert } from "../components/Alert.jsx";
import { db } from "../firebase.js";
import Pricing from "../components/Pricing.jsx";
import { notifyError, notifySuccess } from "../general/CustomToast.js"
import Print from "../components/InventoryFile.jsx";
import InventoryFile from "../components/InventoryFile.jsx";

function OwnerInventory() {
  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    itemName: "",
    canvases: "",
    sizes: "",
    quantity: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState({
    isOpen: false,
    message: '',
    type: 'success'
  });
  const [deletionAlert, setDeletionAlert] = useState({ 
    isOpen: false, 
    itemToDelete: null 
  });

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "materials"));
        const fetchedMaterials = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMaterials(fetchedMaterials);
      } catch (error) {
        notifyError('Failed to fetch materials.', 'error');
        notifyError("Error fetching materials: ", error);
      }
    };

    fetchMaterials();
  }, []);

  const showAlert = (message, type = 'success') => {
    setAlert({
      isOpen: true,
      message,
      type
    });
  };

  const closeAlert = () => {
    setAlert({ isOpen: false, message: '', type: 'success' });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredMaterials = materials.filter(material => 
    material.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setNewItem({
      itemName: "",
      canvases: "",
      sizes: "",
      quantity: 0,
    });
    setIsModalOpen(true);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        const itemDocRef = doc(db, "materials", editingItem.id);
        await updateDoc(itemDocRef, newItem);

        setMaterials((prev) => 
          prev.map(item => item.id === editingItem.id ? { ...newItem, id: editingItem.id } : item)
        );
        
        notifySuccess('Update Successfully.', 'success');
      } else {
        const docRef = await addDoc(collection(db, "materials"), newItem);
        
        setMaterials((prev) => [...prev, { ...newItem, id: docRef.id }]);
        
        notifySuccess('Added New Item Successfully.', 'success');
      }

      setNewItem({
        itemName: "",
        canvases: "",
        sizes: "",
        quantity: 0,
      });
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      notifyError('Failed to add/update item. Please try again.', 'error');
      notifyError("Error adding/updating item: ", error);
    }
  };

  const confirmDeleteItem = (itemId) => {
    setDeletionAlert({
      isOpen: true,
      itemToDelete: itemId
    });
  };

  const handleDeleteItem = async () => {
    try {
      if (deletionAlert.itemToDelete) {
        await deleteDoc(doc(db, "materials", deletionAlert.itemToDelete));
        
        setMaterials((prev) => 
          prev.filter(item => item.id !== deletionAlert.itemToDelete)
        );
        
        setDeletionAlert({ isOpen: false, itemToDelete: null });
        notifyError('Item Deleted Successfully.', 'success');
      }
    } catch (error) {
      notifyError('Failed to delete item. Please try again.', 'error');
      notifyError("Error deleting item: ", error);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({ ...item });
    setIsModalOpen(true);
  };

  return (
    <>
      <Alert 
        type={alert.type} 
        message={alert.message} 
        isOpen={alert.isOpen} 
        onClose={closeAlert}
        duration={3000}
      />

      <DeletionAlert 
        isOpen={deletionAlert.isOpen}
        onClose={() => setDeletionAlert({ isOpen: false, itemToDelete: null })}
        onConfirm={handleDeleteItem}
        title="Confirm Deletion"
        message="Are you sure you want to delete this item from inventory?"
      />

      <OwnerHeader />
      <OwnerSideBar />
      <main className="ml-64 p-8 mt-16">
      <div className="bg-[#37474F] p-6 rounded-lg shadow-lg min-h-[500px] relative">
        <h1 className="text-4xl font-bold text-white mb-6">MATERIALS INVENTORY</h1>
        <InventoryFile materials={materials} />
          
          <div className="flex justify-between items-center mb-8">
            <div className="w-60 h-8 bg-white rounded-md flex items-center px-2">
              <img
                src="/assets/heroicons--magnifying-glass-16-solid.svg"
                alt="Search"
                className="mr-2 w-4 h-4"
              />
              <input
                type="text"
                placeholder="Search Item Name"
                className="rounded-md w-full h-full focus:outline-none"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            <div
              className="flex items-center text-white cursor-pointer"
              onClick={openAddModal}
            >
              <span className="mr-2">Add New Item</span>
              <img src="/assets/typcn--plus-outline.svg" alt="Add" />
            </div>
          </div>

          <div className="bg-[#263238] rounded text-white overflow-hidden">
            {filteredMaterials.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-2xl">No materials in inventory</p>
                <p className="text-sm mt-2">Click "Add New Item" to get started</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-[#1C2126] sticky top-0">
                    <tr>
                      <th className="p-4 text-left">Item Name</th>
                      <th className="p-4 text-left">Canvases</th>
                      <th className="p-4 text-left">Sizes</th>
                      <th className="p-4 text-left">Qty</th>
                      <th className="p-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials.map((item) => (
                      <tr key={item.id} className="border-b border-[#1C2126] hover:bg-[#1C2126] transition-colors">
                        <td className="p-4">{item.itemName}</td>
                        <td className="p-4">{item.canvases}</td>
                        <td className="p-4">{item.sizes}</td>
                        <td className="p-4">{item.quantity}</td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditItem(item)}
                              className="hover:bg-blue-600 p-1 rounded transition-colors"
                            >
                              <img 
                                src="/assets/basil--edit-solid.svg" 
                                alt="Edit" 
                                className="w-5 h-5"
                              />
                            </button>
                            <button 
                              onClick={() => confirmDeleteItem(item.id)}
                              className="hover:bg-red-600 p-1 rounded transition-colors"
                            >
                              <img 
                                src="/assets/bx--trash-white.svg" 
                                alt="Delete" 
                                className="w-5 h-5"
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div
                className="bg-[#37474F] rounded-lg p-8 max-w-[90vw] max-h-[90vh] overflow-auto relative shadow-2xl"
              >
                <button
                  className="absolute top-4 right-4"
                  onClick={() => setIsModalOpen(false)}
                >
                  <img src="/assets/line-md--remove.svg" alt="Close" className="w-6 h-6" />
                </button>

                <h2 className="text-3xl font-bold mb-6 text-white">
                  {editingItem ? 'Edit Material Item' : 'Add New Material Item'}
                </h2>

                <form onSubmit={handleAddItem} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Item Name</label>
                      <input
                        name="itemName"
                        value={newItem.itemName}
                        onChange={handleInputChange}
                        placeholder="Enter item name"
                        required
                        className="w-full border-2 border-[#263238] bg-[#263238] text-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Quantity</label>
                      <input
                        type="number"
                        name="quantity"
                        value={newItem.quantity}
                        onChange={handleInputChange}
                        placeholder="Enter quantity"
                        required
                        className="w-full border-2 border-[#263238] bg-[#263238] text-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-white mb-2">Canvases</label>
                      <textarea
                        name="canvases"
                        value={newItem.canvases}
                        onChange={handleInputChange}
                        placeholder="Describe canvases (type, quality, details)"
                        rows="4"
                        required
                        className="w-full border-2 border-[#263238] bg-[#263238] text-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-white mb-2">Sizes</label>
                      <textarea
                        name="sizes"
                        value={newItem.sizes}
                        onChange={handleInputChange}
                        placeholder="Specify sizes and additional details"
                        rows="4"
                        required
                        className="w-full border-2 border-[#263238] bg-[#263238] text-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md mt-6 transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
        <Pricing/>
      </main>
    </>
  );
}

export default OwnerInventory;
