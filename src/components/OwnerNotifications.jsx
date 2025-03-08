import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { notifyError } from '../general/CustomToast';

const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    // Handle Firestore timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    // Reset now to current date for yesterday comparison
    now.setHours(0, 0, 0, 0);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
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

function OwnerNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(
            collection(db, 'notifications'),
            where('recipientType', '==', 'owner')
        );
    
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notificationData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data
                };
            });
            
            // Sort notifications by timestamp in descending order
            const sortedNotifications = notificationData.sort((a, b) => {
                const timeA = a.timestamp?.toDate().getTime() || 0;
                const timeB = b.timestamp?.toDate().getTime() || 0;
                return timeB - timeA;
            });
            
            setNotifications(sortedNotifications);
            setHasUnread(sortedNotifications.some(notif => !notif.read));
        }, (error) => {
            notifyError("Error fetching notifications:", error);
        });
    
        return () => unsubscribe();
    }, []);

    const markAsRead = async (id, orderId) => {
        try {
            await updateDoc(doc(db, 'notifications', id), {
                read: true
            });
            
            // Navigate to orders page with order ID if available
            if (orderId) {
                navigate('/owner/orders', { state: { highlightOrderId: orderId } });
            } else {
                navigate('/owner/orders');
            }
        } catch (error) {
            notifyError('Error marking notification as read:', error);
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
            notifyError('Error marking all as read:', error);
        }
    };

    return (
        <div className="relative">
            <div className="relative" onClick={() => setShowNotifications(!showNotifications)}>
                <img
                    src="/assets/mdi--bell-outline.svg"
                    className="size-8 cursor-pointer"
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
                                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-900">{notification.message}</p>
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

export default OwnerNotifications;