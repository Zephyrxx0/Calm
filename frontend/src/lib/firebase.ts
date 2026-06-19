import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Connect to Firebase Auth emulator only if explicitly enabled
if (
  process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true" &&
  typeof window !== "undefined"
) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}
