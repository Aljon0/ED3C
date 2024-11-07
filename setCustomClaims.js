const admin = require('firebase-admin');

// Path to your service account key JSON file
const serviceAccount = require('./path-to-your-service-account-key.json'); // Update this path

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-database-name.firebaseio.com" // Update with your Firebase database URL
});

// Function to set custom claims
const setCustomUserClaims = async (uid, role) => {
  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    console.log(`Custom claims set for user: ${uid}, role: ${role}`);
  } catch (error) {
    console.error("Error setting custom claims: ", error);
  }
};

// Call the function with the user's UID and desired role
const userUID = 'replace-with-user-uid'; // Replace with the actual user's UID
const role = 'owner'; // Or 'customer' depending on the role you're setting

setCustomUserClaims(userUID, role);
