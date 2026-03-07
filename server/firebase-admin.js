import dotenv from "dotenv"
dotenv.config();

import admin from "firebase-admin"

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export const db = admin.firestore();
export const auth = admin.auth();

db.collection("users").limit(1).get()
    .then(() => console.log("Firebase Admin connected successfully"))
    .catch((err) => console.log("Firebase Admin error:", err));