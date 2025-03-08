import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const DashboardCharts = () => {
    const [itemStats, setItemStats] = useState([]);
    const [revenueData, setRevenueData] = useState([]);

    useEffect(() => {
        const transactionsQuery = query(
            collection(db, 'transactions'),
            orderBy('completedDate', 'desc')
        );

        const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
            // Process item statistics
            const itemCounts = {
                'Gravestone': 0,
                'Gravestone Base': 0,
                'Urn': 0,
                'Table Signs': 0
            };

            // Process monthly revenue
            const monthlyRevenue = {};

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                
                // Only process if status is "Finished"
                if (data.status === "Finished") {
                    // Count items
                    if (data.item) {
                        const itemKey = data.item.toLowerCase();
                        if (itemKey.includes('gravestone') && !itemKey.includes('base')) {
                            itemCounts['Gravestone']++;
                        } else if (itemKey.includes('base')) {
                            itemCounts['Gravestone Base']++;
                        } else if (itemKey.includes('urn')) {
                            itemCounts['Urn']++;
                        } else if (itemKey.includes('table')) {
                            itemCounts['Table Signs']++;
                        }
                    }

                    // Process revenue - using completedDate for more accurate data
                    if (data.completedDate && data.totalAmount) {
                        const date = data.completedDate.toDate();
                        const monthYear = date.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short'
                        });
                        monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + (data.totalAmount || 0);
                    }
                }
            });

            // Format item statistics for chart
            const itemStatsData = Object.entries(itemCounts).map(([name, value]) => ({
                name,
                count: value
            }));

            // Format revenue data for chart and sort chronologically
            const revenueChartData = Object.entries(monthlyRevenue)
                .map(([date, amount]) => ({
                    date,
                    revenue: amount
                }))
                .sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    return dateA - dateB;
                });

            setItemStats(itemStatsData);
            setRevenueData(revenueChartData);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="flex flex-col gap-4 w-full px-4 mt-20 max-w-[1400px] mx-auto">
            <div className="w-full bg-white rounded-lg shadow-md p-4">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-[#2F424B]">Items Sold Comparison</h2>
                </div>
                <div className="p-4 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={itemStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#2F424B" name="Number of Items" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="w-full bg-white rounded-lg shadow-md p-4">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-[#2F424B]">Monthly Revenue (Finished Transactions Only)</h2>
                </div>
                <div className="p-4 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="date"
                                tickFormatter={(value) => value}
                            />
                            <YAxis />
                            <Tooltip 
                                formatter={(value) => `₱${value.toLocaleString()}`}
                                labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#2F424B" 
                                name="Revenue"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;