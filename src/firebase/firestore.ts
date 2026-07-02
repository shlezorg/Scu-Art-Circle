import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db, useLocalMode } from './config';
import { mockFirebase } from '../firebase';

/**
 * Retrieves a single document from Firestore or Mock Storage.
 */
export async function getDocument(colName: string, docId: string): Promise<DocumentData | null> {
  if (useLocalMode) {
    return await mockFirebase.getDoc(colName, docId);
  }
  try {
    const docRef = doc(db, colName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (err) {
    console.warn(`Failed to fetch live doc ${colName}/${docId}, returning mock instead:`, err);
    return await mockFirebase.getDoc(colName, docId);
  }
}

/**
 * Retrieves all documents in a collection from Firestore or Mock Storage.
 */
export async function getCollectionData(colName: string): Promise<any[]> {
  if (useLocalMode) {
    return await mockFirebase.getCollection(colName);
  }
  try {
    const querySnapshot = await getDocs(collection(db, colName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn(`Failed to fetch live collection ${colName}, returning mock instead:`, err);
    return await mockFirebase.getCollection(colName);
  }
}

/**
 * Creates or completely overwrites a document with a specified ID.
 */
export async function setDocument(colName: string, docId: string, data: any): Promise<void> {
  if (useLocalMode) {
    return await mockFirebase.setDoc(colName, docId, data);
  }
  const docRef = doc(db, colName, docId);
  await setDoc(docRef, data);
}

/**
 * Appends a document with an auto-generated ID to a collection.
 */
export async function addDocument(colName: string, data: any): Promise<string> {
  if (useLocalMode) {
    return await mockFirebase.addDoc(colName, data);
  }
  const docRef = await addDoc(collection(db, colName), data);
  return docRef.id;
}

/**
 * Updates individual fields of an existing document.
 */
export async function updateDocument(colName: string, docId: string, data: any): Promise<void> {
  if (useLocalMode) {
    return await mockFirebase.updateDoc(colName, docId, data);
  }
  const docRef = doc(db, colName, docId);
  await updateDoc(docRef, data);
}

/**
 * Removes a document from a collection.
 */
export async function deleteDocument(colName: string, docId: string): Promise<void> {
  if (useLocalMode) {
    return await mockFirebase.deleteDoc(colName, docId);
  }
  const docRef = doc(db, colName, docId);
  await deleteDoc(docRef);
}

/**
 * Subscribes to real-time updates for a collection with dynamic local fallback.
 */
export function subscribeToCollection(colName: string, callback: (data: any[]) => void): () => void {
  if (useLocalMode) {
    return mockFirebase.subscribeCollection(colName, callback);
  }

  const q = query(collection(db, colName));
  const unsubscribe = onSnapshot(q, 
    (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    },
    (err) => {
      console.warn(`Firestore subscription failed for collection "${colName}". Falling back to mock data:`, err);
      // Failover to local storage simulation
      mockFirebase.subscribeCollection(colName, callback);
    }
  );

  return unsubscribe;
}

/**
 * Subscribes to real-time updates for a single document with dynamic local fallback.
 */
export function subscribeToDocument(colName: string, docId: string, callback: (data: any | null) => void): () => void {
  if (useLocalMode) {
    const unsub = mockFirebase.subscribeCollection(colName, (list: any[]) => {
      const document = list.find((d: any) => d.id === docId);
      callback(document || null);
    });
    return unsub;
  }

  const docRef = doc(db, colName, docId);
  const unsubscribe = onSnapshot(docRef,
    (snapshot) => {
      callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    },
    (err) => {
      console.warn(`Firestore subscription failed for document "${colName}/${docId}". Falling back to mock data:`, err);
      mockFirebase.subscribeCollection(colName, (list: any[]) => {
        const document = list.find((d: any) => d.id === docId);
        callback(document || null);
      });
    }
  );

  return unsubscribe;
}
