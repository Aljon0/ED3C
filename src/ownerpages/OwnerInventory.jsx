import React, { useState, useEffect } from "react";
import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";

function OwnerInventory() {
    // Initialize data from localStorage or default data if none exists
    const [inventoryData, setInventoryData] = useState(() => {
        const savedData = localStorage.getItem("inventoryData");
        return savedData
            ? JSON.parse(savedData)
            : [
                  { type: "Gravestone", materials: ["Marble", "Ceramic Tile", "Granite"], quantities: [0, 0, 0], isEditing: false },
                  { type: "Gravestone Base", materials: ["Marble", "Ceramic Tile", "Granite"], quantities: [0, 0, 0], isEditing: false },
                  { type: "Urns", materials: ["Bamboo", "Ceramic Tile"], quantities: [0, 0], isEditing: false },
                  { type: "Table Signs", materials: ["Bamboo", "Ceramic Tile"], quantities: [0, 0], isEditing: false }
              ];
    });

    // Save the updated inventory data to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("inventoryData", JSON.stringify(inventoryData));
    }, [inventoryData]);

    // Handle edit and save toggling
    const toggleEdit = (index) => {
        setInventoryData((prevData) =>
            prevData.map((item, i) =>
                i === index ? { ...item, isEditing: !item.isEditing } : item
            )
        );
    };

    // Handle input changes
    const handleInputChange = (index, materialIndex, value) => {
        setInventoryData((prevData) =>
            prevData.map((item, i) => {
                if (i === index) {
                    const updatedQuantities = [...item.quantities];
                    updatedQuantities[materialIndex] = parseInt(value) || 0; // Ensure value is a number
                    return { ...item, quantities: updatedQuantities };
                }
                return item;
            })
        );
    };

    return (
        <>
            <OwnerHeader />
            <OwnerSideBar />
            <main className="ml-64 p-8 mt-16">
                <span className="font-bold text-[#37474F] text-7xl">MATERIALS INVENTORY</span>

                {inventoryData.map((item, index) => (
                    <div key={index} className="w-[930px] h-[200px] bg-[#FAFAFA] rounded-md mt-2">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-2xl font-medium text-[#333333] uppercase tracking-wider text-center">{item.type}</th>
                                        {item.materials.map((material, i) => (
                                            <th key={i} className="px-6 py-3 text-left text-2xl font-medium text-[#333333] uppercase tracking-wider text-center">{material}</th>
                                        ))}
                                        <th className="px-6 py-3 text-left text-2xl font-medium text-[#333333] uppercase tracking-wider text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333333] text-center">Quantity</td>
                                        {item.quantities.map((quantity, materialIndex) => (
                                            <td key={materialIndex} className="px-6 py-4 whitespace-nowrap text-sm text-[#333333] text-center">
                                                {item.isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={quantity}
                                                        onChange={(e) =>
                                                            handleInputChange(index, materialIndex, e.target.value)
                                                        }
                                                        className="w-16 p-1 text-center text-black rounded"
                                                    />
                                                ) : (
                                                    quantity
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333333] text-center">
                                            <button
                                                onClick={() => toggleEdit(index)}
                                                className="px-4 py-2 bg-[#37474F] text-white rounded-md hover:bg-[#576c75]"
                                            >
                                                {item.isEditing ? "Save" : "Edit"}
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </main>
        </>
    );
}

export default OwnerInventory;
