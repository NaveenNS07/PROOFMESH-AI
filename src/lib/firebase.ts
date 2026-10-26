/**
 * Local Sample Auth & Persistence Helper
 * Replaces external Firebase dependency with self-contained local sample data storage.
 */

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export async function signInWithGooglePopup() {
  return {
    uid: 'USR-ADM-01',
    email: 'admin@proofmesh-demo.gov.in',
    displayName: 'Dr. Meenakshi Sundaram',
    emailVerified: true,
  };
}

export async function mirrorApplicationToFirestore(payload: {
  applicationId: string;
  institutionId: string;
  institutionName: string;
  category: string;
  academicYear: string;
  status: string;
}) {
  try {
    const raw = localStorage.getItem('pm_sample_mirrored_applications');
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({
      ...payload,
      savedAt: new Date().toISOString(),
    });
    localStorage.setItem('pm_sample_mirrored_applications', JSON.stringify(list.slice(0, 50)));
  } catch {
    // ignore storage quota errors
  }
}

export async function signOutFirebase() {
  // No-op in local sample data mode
}
