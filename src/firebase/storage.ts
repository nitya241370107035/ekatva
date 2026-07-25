import { 
  ref as fRef, 
  uploadBytes as fUploadBytes, 
  getDownloadURL as fGetDownloadURL 
} from 'firebase/storage';
import { storage, isMock } from './config';

export function ref(storageInstance: any, path: string): any {
  if (isMock) {
    return {
      _type: 'storage-ref',
      path,
    };
  }
  return fRef(storageInstance, path);
}

export async function uploadBytes(refInstance: any, bytes: any, metadata?: any): Promise<any> {
  if (isMock) {
    console.log(`Ekatva Mock Storage: Uploaded data to ${refInstance.path}`);
    return {
      ref: refInstance,
      metadata: metadata || {},
    };
  }
  return fUploadBytes(refInstance, bytes, metadata);
}

export async function getDownloadURL(refInstance: any): Promise<string> {
  if (isMock) {
    // Generate a consistent placeholder image URL using the file path as a seed
    const seed = refInstance.path ? encodeURIComponent(refInstance.path) : 'default';
    return `https://picsum.photos/seed/${seed}/600/400`;
  }
  return fGetDownloadURL(refInstance);
}
