import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, useLocalMode } from './config';

/**
 * Upload a raw File object (image, video, PDF) to a specific Firebase Storage sub-folder.
 * Returns the public HTTP download URL.
 */
export async function uploadMediaAsset(file: File, folder: string): Promise<string> {
  if (useLocalMode) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }
  
  // Safe filename sanitizer
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const uniqueName = `${Date.now()}_${sanitizedName}`;
  const storageRef = ref(storage, `${folder}/${uniqueName}`);
  
  const uploadResult = await uploadBytes(storageRef, file);
  return await getDownloadURL(uploadResult.ref);
}

/**
 * Upload a Base64-encoded image string (e.g. from canvas cropping) to a specific sub-folder.
 * Returns the public HTTP download URL.
 */
export async function uploadBase64Image(base64Data: string, filename: string, folder: string): Promise<string> {
  if (useLocalMode) {
    return Promise.resolve(base64Data);
  }

  // Convert base64 data to Blob
  const byteString = atob(base64Data.split(',')[1]);
  const mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  const blob = new Blob([ab], { type: mimeString });
  const uniqueName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const storageRef = ref(storage, `${folder}/${uniqueName}`);
  
  const uploadResult = await uploadBytes(storageRef, blob);
  return await getDownloadURL(uploadResult.ref);
}

/**
 * Remove an asset from Firebase Storage given its public HTTPS download URL.
 */
export async function deleteMediaAsset(downloadUrl: string): Promise<void> {
  if (useLocalMode || downloadUrl.startsWith('data:')) {
    return Promise.resolve();
  }

  try {
    const fileRef = ref(storage, downloadUrl);
    await deleteObject(fileRef);
  } catch (err) {
    console.error('Firebase Storage deletion error:', err);
  }
}
