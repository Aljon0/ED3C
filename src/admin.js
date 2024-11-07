// admin.js
import admin from 'firebase-admin';
import path from 'path'; // Import path if you're using relative paths

// Initialize the Firebase Admin SDK
const serviceAccount = require(path.resolve('./path-to-your-service-account-key.json')); // Make sure the path is correct

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-database-name.firebaseio.com" // Replace with your database URL
});

// Function to set custom claims
export const setCustomUserClaims = async (uid, role) => {
  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    console.log(`Custom claims set for user: ${uid}, role: ${role}`);
  } catch (error) {
    console.error("Error setting custom claims: ", error);
  }
};
