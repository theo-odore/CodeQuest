// ============================================================================
// firebase-config.js
// ----------------------------------------------------------------------------
// 1. Go to https://console.firebase.google.com -> create a project.
// 2. Project settings -> General -> "Your apps" -> Web app (</>) -> copy config.
// 3. Paste the values below.
// 4. Build -> Authentication -> Sign-in method -> enable "Email/Password"
//    AND "Anonymous".
// 5. Build -> Realtime Database -> Create database -> start in "test mode"
//    for local dev, then apply the rules from database.rules.json before
//    you go live.
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyDNvY9BDI_-qvnkM832MgD_TC41EjXeIJc",
  authDomain: "codequest-techspark.firebaseapp.com",
  databaseURL: "https://codequest-techspark-default-rtdb.firebaseio.com",
  projectId: "codequest-techspark",
  storageBucket: "codequest-techspark.firebasestorage.app",
  messagingSenderId: "732662165989",
  appId: "1:732662165989:web:bc8e8b3509deabbd12bf0c",
  measurementId: "G-5BRXHCTG1R"
};

// Default admin bootstrap credentials — only used ONCE to create the admin
// account in Firebase Authentication if it doesn't exist yet. Change these
// before you deploy, then forget you ever saw them.
export const DEFAULT_ADMIN_EMAIL = "admin@codequest.pu";
export const DEFAULT_ADMIN_PASSWORD = "CodeQuest#2026";

import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  update,
  get,
  push,
  remove,
  onValue,
  off,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export {
  firebaseConfig,
  app,
  auth,
  db,
  ref,
  set,
  update,
  get,
  push,
  remove,
  onValue,
  off,
  serverTimestamp,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  initializeApp,
  deleteApp,
  getAuth
};
