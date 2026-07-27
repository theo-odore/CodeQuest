// ============================================================================
// auth.js — admin bootstrap/login, admin-account management, and route guards
// ============================================================================
import {
  auth, db, ref, get, set, onValue,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, signOut,
  firebaseConfig, initializeApp, deleteApp, getAuth
} from "../firebase-config.js";
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from "../firebase-config.js";

// Marks a uid as an admin in the database and stores its email in
// admin/profiles so the dashboard can list "who has admin access" —
// fetched live from Firebase rather than only living in this source file.
async function markAsAdmin(uid, email) {
  await set(ref(db, `admin/allowedUids/${uid}`), true);
  if (email) {
    await set(ref(db, `admin/profiles/${uid}`), { email, addedAt: Date.now() });
  }
}

export async function isAdminUid(uid) {
  if (!uid) return false;
  const snap = await get(ref(db, `admin/allowedUids/${uid}`));
  return snap.exists() && snap.val() === true;
}

/**
 * Attempts a normal sign-in. If it fails because the account doesn't exist
 * yet AND the entered credentials match the seeded defaults, creates the
 * account (first-run bootstrap) and signs in.
 */
export async function loginOrBootstrapAdmin(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!(await isAdminUid(cred.user.uid))) {
      await markAsAdmin(cred.user.uid, cred.user.email); // heal old accounts created before rules existed
    }
    return cred.user;
  } catch (err) {
    const isFirstRun = err.code === "auth/user-not-found" || err.code === "auth/invalid-credential";
    if (isFirstRun && email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await markAsAdmin(cred.user.uid, cred.user.email);
      return cred.user;
    }
    throw err;
  }
}

export function guardAdminPage(onReady) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "admin-login.html";
      return;
    }
    const ok = await isAdminUid(user.uid);
    if (!ok) {
      await signOut(auth);
      window.location.href = "admin-login.html";
      return;
    }
    onReady(user);
  });
}

export async function adminLogout() {
  await signOut(auth);
  window.location.href = "admin-login.html";
}

/**
 * Creates a brand-new admin account from inside the dashboard.
 *
 * Signing up a new user with the *primary* auth instance would silently log
 * the current admin out and log in as the new account instead — not what
 * anyone wants when adding a co-host. So this spins up a short-lived,
 * separate Firebase App instance just for the sign-up call, then tears it
 * down. The actual database writes (marking the new uid as admin) happen
 * through the normal `db` connection, so they're still authorized by the
 * *currently signed-in* admin, exactly like any other admin-only write.
 */
export async function addNewAdmin(email, password) {
  const secondaryApp = initializeApp(firebaseConfig, `admin-create-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUid = cred.user.uid;
    await markAsAdmin(newUid, email);
    await signOut(secondaryAuth);
    return { uid: newUid, email };
  } finally {
    await deleteApp(secondaryApp);
  }
}

export function listenAdminProfiles(callback) {
  return onValue(ref(db, "admin/profiles"), callback);
}
