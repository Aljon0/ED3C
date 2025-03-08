import React from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet } from 'lucide-react';

function InventoryFile({ materials }) {
  const exportToExcel = () => {
    const exportData = materials.map(item => ({
      'Item Name': item.itemName,
      'Canvases': item.canvases,
      'Sizes': item.sizes,
      'Quantity': item.quantity
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");

    XLSX.writeFile(wb, "inventory_report.xlsx");
  };

  return (
    <button
      onClick={exportToExcel}
      className="absolute top-6 right-6 flex items-center gap-3 
        bg-[#37474F] text-white 
        px-4 py-2 rounded-lg 
        shadow-md hover:shadow-lg 
        transition-all duration-300 
        hover:bg-[#1C2126] 
        transform hover:scale-105 
        group"
      title="Export to Excel"
    >
      <FileSpreadsheet 
        className="w-6 h-6 text-green-400 group-hover:text-green-300 transition-colors" 
      />
      <span className="font-semibold tracking-wider">Export Inventory</span>
    </button>
  );
}

export default InventoryFile;