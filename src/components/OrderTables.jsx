import React from 'react';
import { Download, Printer } from 'lucide-react';

export const OrderTable = ({
  title,
  orders,
  getStatusColor,
  handleViewOrder,
  handleDeleteOrder,
  handleStatusChange,
  enableStatusChange = true,
  sortingKey = 'dateOrdered',
  sortDirection = 'asc'
}) => {
  // Sort orders based on the provided key and direction
  const sortedOrders = [...orders].sort((a, b) => {
    const aValue = sortingKey.split('.').reduce((obj, key) => obj[key], a);
    const bValue = sortingKey.split('.').reduce((obj, key) => obj[key], b);

    // Handle dates
    if (aValue instanceof Date || new Date(aValue).toString() !== 'Invalid Date') {
      const dateA = new Date(aValue);
      const dateB = new Date(bValue);
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }

    // Handle other types
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const printTable = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            ${document.getElementById(title.replace(/\s+/g, '')).outerHTML}
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2F424B]">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {sortedOrders.length} {sortedOrders.length === 1 ? 'order' : 'orders'}
          </p>
        </div>
        <button
          onClick={printTable}
          className="flex items-center gap-2 px-4 py-2 bg-[#2F424B] text-white rounded-md hover:bg-[#445166] transition-colors transform hover:scale-105"
        >
          <Printer size={20} />
          Print
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" id={title.replace(/\s+/g, '')}>
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Customer's Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Date Ordered</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Expected Date/Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.customerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.dateOrdered).toLocaleDateString()}
                  {" "}
                  {new Date(order.dateOrdered).toLocaleTimeString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {enableStatusChange ? (
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`border rounded-md px-2 py-1 ${getStatusColor(order.status)}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="1ST PAYMENT">1ST PAYMENT</option>
                      <option value="Processing">Processing</option>
                      <option value="2ND PAYMENT">2ND PAYMENT</option>
                      <option value="Finished">Finished</option>
                      <option value="Cancelled">Cancel Order</option>
                    </select>
                  ) : (
                    <span className={getStatusColor(order.status)}>{order.status}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.expectedDate ? new Date(order.expectedDate).toLocaleString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 cursor-pointer flex items-center space-x-2">
                  <img
                    src="/assets/mdi--eye.svg"
                    alt="View"
                    className="w-5 h-5 cursor-pointer"
                    onClick={() => handleViewOrder(order)}
                  />
                  <img
                    src="/assets/bx--trash.svg"
                    alt="Delete"
                    className="w-5 h-5 cursor-pointer text-red-500"
                    onClick={() => handleDeleteOrder(order.id)}
                  />
                </td>
              </tr>
            ))}
            {sortedOrders.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// NewOrdersTable.jsx
export const NewOrdersTable = ({ orders, ...props }) => {
  const newOrders = orders.filter(order => order.status === 'Pending');
  return (
    <OrderTable
      title="New Orders"
      orders={newOrders}
      sortingKey="dateOrdered"
      sortDirection="asc"  // Oldest first
      {...props}
    />
  );
};

// ProcessingOrdersTable.jsx
export const ProcessingOrdersTable = ({ orders, ...props }) => {
  const processingOrders = orders.filter(order =>
    ['1ST PAYMENT', 'Processing', '2ND PAYMENT'].includes(order.status)
  );
  return (
    <OrderTable
      title="Processing Orders"
      orders={processingOrders}
      sortingKey="expectedDate"
      sortDirection="asc"  // Nearest date first
      {...props}
    />
  );
};

// FinishedOrdersTable.jsx
export const FinishedOrdersTable = ({ orders, ...props }) => {
  const finishedOrders = orders
    .filter(order => order.status === 'Finished')
    .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
    .slice(0, 10); // Keep only the 10 most recent finished orders

  return (
    <OrderTable
      title="Finished Orders"
      orders={finishedOrders}
      sortingKey="lastUpdated"
      sortDirection="desc"
      enableStatusChange={false}
      {...props}
    />
  );
};

//CancelledTable.jsx
export const CancelledOrdersTable = ({ orders, ...props }) => {
  const cancelledOrders = orders
    .filter(order => order.status === 'Cancelled')
    .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
    .slice(0, 10); // Keep only the 10 most recent cancelled orders

  return (
    <OrderTable
      title="Cancelled Orders"
      orders={cancelledOrders}
      sortingKey="lastUpdated"
      sortDirection="desc"
      enableStatusChange={false}
      {...props}
    />
  );
};