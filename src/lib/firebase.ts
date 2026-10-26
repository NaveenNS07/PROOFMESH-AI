import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
const configModules = import.meta.glob('../../firebase-applet-config.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, string>>;

const loadedConfig = Object.values(configModules)[0] || {};

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || loadedConfig.projectId || 'gen-lang-client-0527595659',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || loadedConfig.appId || '1:180565062948:web:5d58d75575cf28f9af6fb1',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || loadedConfig.apiKey || 'AIzaSyAbGgStXG2WdfQrGwOszbF5iEMUMTOLCz4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || loadedConfig.authDomain || 'gen-lang-client-0527595659.firebaseapp.com',
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    loadedConfig.firestoreDatabaseId ||
    'ai-studio-proofmeshai-601cffd4-5f0c-415e-ad7c-8727feba36d0',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    loadedConfig.storageBucket ||
    'gen-lang-client-0527595659.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || loadedConfig.messagingSenderId || '180565062948',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Run initial connection check on boot
testFirestoreConnection();

export async function signInWithGooglePopup() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  if (user && user.emailVerified) {
    const profilePath = `users/${user.uid}`;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          displayName: (user.displayName || user.email?.split('@')[0] || 'Officer').slice(0, 120),
          role:
            user.email === 'mmnaveen202006@gmail.com'
              ? 'REGULATORY_ADMIN'
              : 'REGULATORY_OFFICER',
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, profilePath);
    }
  }
  return user;
}

export async function mirrorApplicationToFirestore(payload: {
  applicationId: string;
  institutionId: string;
  institutionName: string;
  category: string;
  academicYear: string;
  status: string;
}) {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const cleanAppId = payload.applicationId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64);
  const cleanInstId = payload.institutionId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64);
  const path = `applications/${cleanAppId}`;
  try {
    await setDoc(doc(db, 'applications', cleanAppId), {
      applicationId: cleanAppId,
      institutionId: cleanInstId,
      institutionName: payload.institutionName.slice(0, 200),
      category: payload.category.slice(0, 120),
      academicYear: payload.academicYear.slice(0, 20),
      status: payload.status,
      ownerUid: auth.currentUser.uid,
      syntheticLabel: 'SYNTHETIC DEMONSTRATION DATA — NOT AN OFFICIAL AICTE RECORD',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function signOutFirebase() {
  try {
    await fbSignOut(auth);
  } catch {
    // ignore signout error if not signed into firebase
  }
}
