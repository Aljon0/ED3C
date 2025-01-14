import React from 'react';
import * as XLSX from 'xlsx';

function InventoryFile({ materials }) {
  const exportToExcel = () => {
    // Prepare the data for export
    const exportData = materials.map(item => ({
      'Item Name': item.itemName,
      'Canvases': item.canvases,
      'Sizes': item.sizes,
      'Quantity': item.quantity
    }));

    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");

    // Generate and download the file
    XLSX.writeFile(wb, "inventory_report.xlsx");
  };

  return (
    <button
      onClick={exportToExcel}
      className="absolute top-6 right-6 flex items-center gap-2 text-white hover:bg-[#1C2126] p-2 rounded transition-colors"
      title="Export to Excel"
    >
      <img 
        src="/assets/vscode-icons--file-type-excel.svg" 
        alt="Export to Excel" 
        className="w-6 h-6"
      />
      <span>Export</span>
    </button>
  );
}

export default InventoryFile;