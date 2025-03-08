import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import OwnerHeader from "../components/OwnerHeader.jsx";
import OwnerSideBar from "../components/OwnerSideBar.jsx";


function IncomeAndSupplies() {
    const [transactions, setTransactions] = useState([]);
    const [summaryStats, setSummaryStats] = useState({
        totalIncome: 0,
        totalFinishedItems: 0,
        avgOrderValue: 0
    });

    useEffect(() => {
        const transactionsQuery = query(
            collection(db, 'transactions'),
            orderBy('completedDate', 'desc')
        );

        const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
            const transactionsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    status: data.status || 'Finished',
                    totalAmount: data.totalAmount || 0,
                    completedDate: data.completedDate ? 
                        (data.completedDate.toDate ? data.completedDate.toDate() : new Date(data.completedDate)) : 
                        null
                };
            });

            // Calculate summary statistics
            const finishedTransactions = transactionsData.filter(t => t.status === 'Finished');
            const totalIncome = finishedTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
            const totalFinishedItems = finishedTransactions.length;
            const avgOrderValue = totalIncome / (totalFinishedItems || 1);

            setTransactions(transactionsData);
            setSummaryStats({
                totalIncome,
                totalFinishedItems,
                avgOrderValue
            });
        }, (error) => {
            console.error("Error fetching transactions: ", error);
        });

        return () => unsubscribe();
    }, []);

    const formatCurrency = (amount) => {
        return `₱${(amount || 0).toLocaleString()}`;
    };

    const StatCard = ({ title, value, icon }) => (
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4">
            <div className="bg-[#2F424B] text-white p-3 rounded-lg">
                <img src={icon} alt={title} className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-[#2F424B]">{value}</p>
            </div>
        </div>
    );

    const MonthlyBreakdown = () => {
        const monthlyData = transactions
            .filter(t => t.status === 'Finished' && t.completedDate)
            .reduce((acc, transaction) => {
                const month = transaction.completedDate.toLocaleString('default', { month: 'long' });
                const year = transaction.completedDate.getFullYear();
                const key = `${month} ${year}`;
                
                if (!acc[key]) {
                    acc[key] = { income: 0, itemCount: 0 };
                }
                
                acc[key].income += transaction.totalAmount;
                acc[key].itemCount++;
                
                return acc;
            }, {});

        return (
            <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold text-[#2F424B] mb-4">Monthly Breakdown</h3>
                {Object.entries(monthlyData).map(([period, data]) => (
                    <div key={period} className="flex justify-between py-2 border-b last:border-b-0">
                        <span className="text-gray-600">{period}</span>
                        <div className="flex space-x-4">
                            <span className="text-green-600">{formatCurrency(data.income)}</span>
                            <span className="text-blue-600">{data.itemCount} items</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <OwnerHeader />
            <OwnerSideBar />
            <main className="pb-8 mt-8">
                <div className="w-full min-h-[670px] bg-[#D3D3D3] rounded-md p-6">
                    <h1 className="text-4xl text-[#2F424B] font-semibold mb-6">Income & Supplies Overview</h1>
                    
                    <div className="grid grid-cols-3 gap-6 mb-6">
                        <StatCard 
                            title="Total Income" 
                            value={formatCurrency(summaryStats.totalIncome)} 
                            icon="/assets/mdi--cash.svg"
                        />
                        <StatCard 
                            title="Finished Items" 
                            value={summaryStats.totalFinishedItems} 
                            icon="/assets/mdi--package.svg"
                        />
                        <StatCard 
                            title="Avg. Order Value" 
                            value={formatCurrency(summaryStats.avgOrderValue)} 
                            icon="/assets/mdi--chart-bar.svg"
                        />
                    </div>

                    <MonthlyBreakdown />
                </div>
            </main>
        </>
    );
}

export default IncomeAndSupplies;