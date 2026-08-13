import { initializeApp, getApps, App, getApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Try to read from environment variable
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let app: App;

if (getApps().length === 0) {
  if (serviceAccountString) {
    // Use the service account JSON
    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountString);
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // Explicitly set
    });
  } else {
    // Fallback: use default credentials with explicit project ID
    app = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
} else {
  app = getApp();
}

const adminDb = getFirestore(app);

export { app as adminApp, adminDb };
