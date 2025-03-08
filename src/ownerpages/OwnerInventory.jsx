import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Trash2, Edit2, PlusCircle, Search, XCircle } from 'lucide-react';
import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";
import { DeletionAlert } from "../components/Alert.jsx";
import { db } from "../firebase.js";
import Pricing from "../components/Pricing.jsx";
import { notifyError, notifySuccess, notifyWarning } from "../general/CustomToast.js"
import InventoryFile from "../components/InventoryFile.jsx";
import TextureUpload from "../components/TextureUpload.jsx";

function OwnerInventory() {
  const LOW_STOCK_THRESHOLD = 20;
  const OUT_OF_STOCK_THRESHOLD = 0;

  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [alertsShown, setAlertsShown] = useState(false);
  const [newItem, setNewItem] = useState({
    itemName: "",
    canvases: "",
    sizes: "",
    quantity: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletionAlert, setDeletionAlert] = useState({
    isOpen: false,
    itemToDelete: null
  });

  const getStockStatus = (quantity) => {
    if (quantity <= OUT_OF_STOCK_THRESHOLD) return 'out-of-stock';
    if (quantity <= LOW_STOCK_THRESHOLD) return 'low-stock';
    return 'in-stock';
  };

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "materials"));

        if (querySnapshot.empty) {
          notifyWarning("No materials found in the database");
          setMaterials([]);
          return;
        }

        const fetchedMaterials = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setMaterials(fetchedMaterials);

      } catch (error) {
        notifyError(`Failed to fetch materials: ${error.message}`);
        setMaterials([]);
      }
    };

    fetchMaterials();
  }, [alertsShown]); // Add alertsShown as a dependency

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

        notifySuccess('Update Successfully.');
      } else {
        const docRef = await addDoc(collection(db, "materials"), newItem);

        setMaterials((prev) => [...prev, { ...newItem, id: docRef.id }]);

        notifySuccess('Added New Item Successfully.');
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
      notifyError('Failed to add/update item. Please try again.');
    }
  };

  const handleDeleteItem = async () => {
    try {
      if (deletionAlert.itemToDelete) {
        await deleteDoc(doc(db, "materials", deletionAlert.itemToDelete));

        setMaterials((prev) =>
          prev.filter(item => item.id !== deletionAlert.itemToDelete)
        );

        setDeletionAlert({ isOpen: false, itemToDelete: null });
        notifySuccess('Item Deleted Successfully.');
      }
    } catch (error) {
      notifyError('Failed to delete item. Please try again.');
    }
  };

  const confirmDeleteItem = (itemId) => {
    setDeletionAlert({
      isOpen: true,
      itemToDelete: itemId
    });
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({ ...item });
    setIsModalOpen(true);
  };

  {
    filteredMaterials.map((item) => {
      const stockStatus = getStockStatus(item.quantity);

      return (
        <tr
          key={item.id}
          className={`
          border-b border-[#1C2126] hover:bg-[#1C2126] transition-colors
          ${stockStatus === 'out-of-stock' ? 'bg-red-900 bg-opacity-30' : ''}
          ${stockStatus === 'low-stock' ? 'bg-yellow-900 bg-opacity-30' : ''}
        `}
        >
          <td className="p-4">{item.itemName}</td>
          <td className="p-4">{item.canvases}</td>
          <td className="p-4">{item.sizes}</td>
          <td className={`p-4 font-bold
          ${stockStatus === 'out-of-stock' ? 'text-red-500' : ''}
          ${stockStatus === 'low-stock' ? 'text-yellow-500' : ''}
        `}>
            {item.quantity}
            {stockStatus !== 'in-stock' && (
              <span className="ml-2 text-xs uppercase">
                {stockStatus === 'out-of-stock' ? '(Out of Stock)' : '(Low Stock)'}
              </span>
            )}
          </td>
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
      );
    })
  }

  return (
    <>
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
        <div className="bg-[#D3D3D3] backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/10 min-h-[500px] relative">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-extrabold text-[#37474F] bg-clip-text bg-gradient-to-r from-[#37474F] to-gray-600">
              Materials Inventory
            </h1>
            <InventoryFile materials={materials} />
          </div>

          <div className="flex items-center space-x-4 mb-8">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400 w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search Item Name"
                className="pl-10 pr-4 py-2 w-[600px] bg-white border border-white/20 rounded-lg text-[#37474F] focus:outline-none focus:ring-2 focus:ring-[#1C2126] transition-all"
                value={searchTerm}
                onChange={handleSearch}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XCircle className="text-gray-400 w-5 h-5 hover:text-red-500" />
                </button>
              )}
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center bg-[#37474F] text-white px-4 py-2 rounded-lg hover:bg-[#1C2126] group transition-all duration-300 transform hover:scale-105 "
            >
              <PlusCircle className="mr-2 text-green-400 group-hover:text-green-300 w-5 h-5" />
              Add New Item
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden border border-white/20">
            {filteredMaterials.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-2xl">No materials in inventory</p>
                <p className="text-sm mt-2">Click "Add New Item" to get started</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-[#37474F] text-white sticky top-0">
                    <tr>
                      {['Item Name', 'Canvases', 'Sizes', 'Qty', 'Actions'].map((header) => (
                        <th key={header} className="p-4 text-left">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials.map((item) => {
                      const stockStatus = getStockStatus(item.quantity);
                      return (
                        <tr
                          key={item.id}
                          className={`
                            border-b border-white/10 bg-white
                            hover:bg-[#1C2126]/10 
                            transition-colors
                            ${stockStatus === 'out-of-stock' ? 'bg-red-900/10' : ''}
                            ${stockStatus === 'low-stock' ? 'bg-yellow-900/30' : ''}
                          `}
                        >
                          <td className="p-4">{item.itemName}</td>
                          <td className="p-4">{item.canvases}</td>
                          <td className="p-4">{item.sizes}</td>
                          <td className={`p-4 font-bold
                            ${stockStatus === 'out-of-stock' ? 'text-red-500' : ''}
                            ${stockStatus === 'low-stock' ? 'text-yellow-500' : ''}
                          `}>
                            {item.quantity}
                            {stockStatus !== 'in-stock' && (
                              <span className="ml-2 text-xs uppercase">
                                {stockStatus === 'out-of-stock' ? '(Out of Stock)' : '(Low Stock)'}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="hover:bg-blue-500/20 p-2 rounded-full transition-colors group"
                              >
                                <Edit2 className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
                              </button>
                              <button
                                onClick={() => confirmDeleteItem(item.id)}
                                className="hover:bg-red-500/20 p-2 rounded-full transition-colors group"
                              >
                                <Trash2 className="w-5 h-5 text-red-500 group-hover:text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 mt-24">
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
        <Pricing />
        <TextureUpload />
      </main>
    </>
  );
}

export default OwnerInventory;
