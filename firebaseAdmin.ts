import { initializeApp, getApps, App, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let app: App;

try {
  const serviceKey = require("@/service_key.json");
  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert(serviceKey),
    });
  } else {
    app = getApp();
  }
} catch (error) {
  console.error("Failed to load service_key.json:", error);
  // Fallback: initialize without credentials (only works on GCP)
  if (getApps().length === 0) {
    app = initializeApp();
  } else {
    app = getApp();
  }
}

const adminDb = getFirestore(app);

export { app as adminApp, adminDb };