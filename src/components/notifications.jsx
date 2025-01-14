
    import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
    import { db } from '../firebase'; 

    export const notifications = {
        // For owner to notify a specific customer
        createCustomerNotification: async (userId, message, orderId) => {
            if (!userId) {
                console.error("No userId provided for notification");
                return;
            }
    
            try {
                await addDoc(collection(db, 'notifications'), {
                    userId,
                    message,
                    orderId,
                    timestamp: serverTimestamp(),
                    read: false,
                    type: 'order',
                    recipientType: 'customer'
                });
            } catch (error) {
                console.error("Error creating customer notification:", error);
                throw error;
            }
        },
    
        createOwnerNotification: async (message, orderId) => {
            if (!message || !orderId) {
                console.error("Missing required parameters for owner notification");
                return;
            }
    
            try {
                await addDoc(collection(db, 'notifications'), {
                    message,
                    orderId,
                    timestamp: serverTimestamp(),
                    read: false,
                    type: 'order',
                    recipientType: 'owner',
                    userId: 'owner' // Consistent owner identifier
                });
            } catch (error) {
                console.error("Error creating owner notification:", error);
                throw error;
            }
        }
    };

    export default notifications;