import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

function GenerateReports({ transactions }) {
    const generatePDF = () => {
        // Filter out cancelled transactions - only include finished ones
        const finishedTransactions = transactions.filter(t => t.status === 'Finished');
        
        // Initialize PDF document
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text('Transaction Report', 15, 15);
        
        // Add generation date
        doc.setFontSize(10);
        doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 15, 25);

        // Prepare data for summary section - only count finished transactions
        const totalTransactions = finishedTransactions.length;
        const totalRevenue = finishedTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
        
        // Add summary section
        doc.setFontSize(12);
        doc.text('Summary:', 15, 35);
        doc.setFontSize(10);
        doc.text(`Total Finished Transactions: ${totalTransactions}`, 20, 45);
        doc.text(`Total Revenue: ₱${totalRevenue.toLocaleString()}`, 20, 52);

        // Prepare table data - only for finished transactions
        const tableData = finishedTransactions.map(t => [
            t.customerName,
            format(t.dateOrdered instanceof Date ? t.dateOrdered : new Date(t.dateOrdered), 'PP'),
            t.item,
            t.material,
            t.size,
            `₱${t.totalAmount.toLocaleString()}`,
            format(t.completedDate instanceof Date ? t.completedDate : new Date(t.completedDate), 'PP')
        ]);

        // Add transactions table
        doc.autoTable({
            startY: 60,
            head: [['Customer', 'Date Ordered', 'Item', 'Material', 'Size', 'Amount', 'Completion Date']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [47, 66, 75] },
            margin: { top: 60 }
        });

        // Generate detailed transaction list - only for finished transactions
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Detailed Transaction List', 15, 15);

        let yPosition = 30;
        finishedTransactions.forEach((transaction, index) => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 15;
            }

            doc.setFontSize(12);
            doc.text(`Transaction #${index + 1}`, 15, yPosition);
            
            doc.setFontSize(10);
            const details = [
                `Customer: ${transaction.customerName}`,
                `Contact: ${transaction.customerContact}`,
                `Email: ${transaction.customerEmail}`,
                `Item: ${transaction.item}`,
                `Material: ${transaction.material}`,
                `Size: ${transaction.size}`,
                `Total Amount: ₱${transaction.totalAmount.toLocaleString()}`,
                `Date Ordered: ${format(new Date(transaction.dateOrdered), 'PPpp')}`,
                `Completion Date: ${format(new Date(transaction.completedDate), 'PPpp')}`,
                `Add-ons: ${transaction.addOns ? transaction.addOns.join(', ') : 'None'}`,
                `Payment Type: ${transaction.paymentType}`
            ];

            details.forEach((detail, i) => {
                doc.text(detail, 20, yPosition + 7 + (i * 5));
            });

            yPosition += 65;
        });

        // Save the PDF
        const fileName = `transaction-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        doc.save(fileName);
    };

    return (
        <div className="flex items-center ml-auto">
            <span className="text-[#333333] text-4xl">Generate Reports</span>
            <img 
                src="/assets/mdi--report-box-multiple.svg" 
                className="cursor-pointer ml-2" 
                alt="Generate Report"
                onClick={generatePDF}
            />
        </div>
    );
}

export default GenerateReports;