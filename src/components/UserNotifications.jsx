import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { notifyError } from '../general/CustomToast';

const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
    
    // Time format
    const timeStr = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }).format(date);
    
    // Date format
    if (isToday) {
        return `Today at ${timeStr}`;
    } else if (isYesterday) {
        return `Yesterday at ${timeStr}`;
    } else {
        const dateStr = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        }).format(date);
        return `${dateStr} at ${timeStr}`;
    }
};

function UserNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate(); // Initialize navigation

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'notifications'),
            where('recipientType', '==', 'customer'),
            where('userId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notificationData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Sort notifications by timestamp in descending order
            const sortedNotifications = notificationData.sort((a, b) => {
                const timeA = a.timestamp?.toDate().getTime() || 0;
                const timeB = b.timestamp?.toDate().getTime() || 0;
                return timeB - timeA;
            });
            
            setNotifications(sortedNotifications);
            setHasUnread(sortedNotifications.some(notif => !notif.read));
        });

        return () => unsubscribe();
    }, [currentUser]);

    const markAsRead = async (notificationId, orderId) => {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true
            });
            
            // Navigate to the orders page and optionally highlight the specific order
            navigate('/orders', { state: { highlightOrderId: orderId } });
        } catch (error) {
            notifyError("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.read);
            const updatePromises = unreadNotifications.map(notification => 
                updateDoc(doc(db, 'notifications', notification.id), { read: true })
            );
            await Promise.all(updatePromises);
            
        
        } catch (error) {
            notifyError("Error marking all as read:", error);
        }
    };

    return (
        <div className="relative">
            <div className="relative" onClick={() => setShowNotifications(!showNotifications)}>
                <img
                    src="/assets/mdi--bell-outline.svg"
                    className="w-6 h-6 sm:w-8 sm:h-8 md:w-8 md:h-8 cursor-pointer"
                    alt="Notifications"
                />
                {hasUnread && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                )}
            </div>

            {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Notifications</h3>
                            {hasUnread && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        markAllAsRead();
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No notifications
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                                        !notification.read ? 'bg-blue-50' : ''
                                    }`}
                                    onClick={() => markAsRead(notification.id, notification.orderId)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-1 bg-blue-100 rounded">
                                            <svg 
                                                className="w-4 h-4 text-blue-600" 
                                                fill="none" 
                                                viewBox="0 0 24 24" 
                                                stroke="currentColor"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
                                                />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-800 whitespace-pre-line">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatMessageTime(notification.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserNotifications;