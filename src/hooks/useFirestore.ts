import { useState, useEffect } from 'react';
import { subscribeToCollection, subscribeToDocument } from '../firebase/firestore';

/**
 * Real-time Firestore Collection subscription hook.
 */
export function useFirestoreCollection(colName: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCollection(colName, (list) => {
      setData(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [colName]);

  return [data, loading] as const;
}

/**
 * Real-time Firestore Document singleton subscription hook.
 */
export function useFirestoreDoc(colName: string, docId: string) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToDocument(colName, docId, (docData) => {
      setData(docData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [colName, docId]);

  return [data, loading] as const;
}
