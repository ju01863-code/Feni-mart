import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';

export async function compressImage(
  file: File,
  maxDimension = 1000,
  targetMaxKB = 250
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context পাওয়া যায়নি'));
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.8;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Iteratively lower quality if still above target size
        while (dataUrl.length * 0.75 > targetMaxKB * 1024 && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              reject(new Error('ইমেজ ব্লব তৈরি করতে ব্যর্থ হয়েছে'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('ইমেজ ফাইলটি লোড করা সম্ভব হয়নি'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('ফাইল পড়তে ব্যর্থ হয়েছে'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads product image to Firebase Storage under "products" folder.
 * Returns download URL as string. If Storage is offline or unprovisioned,
 * falls back to optimized data URL so image rendering is never broken.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const { blob, dataUrl } = await compressImage(file);

  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `products/${Date.now()}_${cleanFileName}`;
    const storageRef = ref(storage, storagePath);

    // Upload with a 4 second timeout so browser never hangs if bucket is not responding
    const uploadTask = async () => {
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
      });
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    };

    const timeoutTask = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Firebase Storage সংযোগ সময়সীমা অতিক্রম করেছে'));
      }, 4000);
    });

    const finalUrl = await Promise.race([uploadTask(), timeoutTask]);
    return finalUrl;
  } catch (error) {
    console.warn('Firebase Storage upload warning (using optimized data image fallback):', error);
    // Reliable fallback ensures customer store image is NEVER blank or empty
    return dataUrl;
  }
}

/**
 * Deletes product image from Firebase Storage if it's a storage URL
 */
export async function deleteProductImageFromStorage(imageUrl?: string): Promise<void> {
  if (!imageUrl || typeof imageUrl !== 'string') return;
  // Check if it's a Firebase Storage download URL
  if (!imageUrl.includes('firebasestorage.googleapis.com')) return;

  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Storage image deletion warning (skipping non-fatal):', err);
  }
}

