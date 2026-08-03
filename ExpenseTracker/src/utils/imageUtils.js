import { supabase } from '../lib/supabase';

const BUCKET = 'expense-photos';

/**
 * Utility to compress and convert images to Base64 JPEG data URLs
 * Keeps file sizes minimal so localStorage & network payloads stay light.
 */
export const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid image file'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaling aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with specified quality
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
};

/**
 * Upload a compressed image File to Supabase Storage.
 * Returns a signed URL string on success, or a Base64 data URL as a fallback.
 * @param {File} file - Raw image File object from input
 * @param {string} userId - Authenticated user's UUID
 * @returns {Promise<string>} URL to store in the expense photos array
 */
export const uploadPhotoToStorage = async (file, userId) => {
  // Compress first regardless of destination
  const base64 = await compressImage(file, 800, 800, 0.8);

  // Skip storage upload for demo/guest users
  if (!userId || userId.startsWith('usr_')) {
    return base64;
  }

  try {
    // Convert Base64 data URL → Blob
    const res = await fetch(base64);
    const blob = await res.blob();

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: false });

    if (uploadError) throw uploadError;

    // Create a long-lived signed URL (10 years)
    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);

    if (signError) throw signError;
    return signed.signedUrl;
  } catch (err) {
    console.warn('Storage upload failed, using Base64 fallback:', err.message);
    return base64;
  }
};

/**
 * Delete a photo from Supabase Storage by its signed URL or storage path.
 * Silently ignores Base64 data URLs and non-storage URLs.
 * @param {string} urlOrPath - Signed URL or storage object path
 */
export const deletePhotoFromStorage = async (urlOrPath) => {
  if (!urlOrPath || urlOrPath.startsWith('data:')) return; // Base64 — nothing to delete

  try {
    // Extract the storage path from the signed URL
    // Signed URLs contain `/object/sign/{bucket}/{path}?token=...`
    const match = urlOrPath.match(/\/object\/sign\/expense-photos\/(.+?)\?/);
    if (!match) return; // Not a storage URL we own

    const path = decodeURIComponent(match[1]);
    await supabase.storage.from(BUCKET).remove([path]);
  } catch (err) {
    console.warn('Storage delete failed (non-critical):', err.message);
  }
};


/**
 * High-quality SVG Avatar Presets (local Data URLs)
 * Guaranteed 100% immune to CORS canvas taint issues!
 */
export const PRESET_AVATARS = [
  // Cute Cat Avatar (Pink)
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23fce7f3"/><circle cx="50" cy="50" r="40" fill="%23f43f5e"/><polygon points="30,25 45,40 25,42" fill="%23f43f5e"/><polygon points="70,25 75,42 55,40" fill="%23f43f5e"/><circle cx="40" cy="48" r="4" fill="%23ffffff"/><circle cx="60" cy="48" r="4" fill="%23ffffff"/><path d="M 45 56 Q 50 62 55 56" stroke="%23ffffff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  // Cute Duck Avatar (Yellow/Rose)
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23fff1f2"/><circle cx="50" cy="50" r="38" fill="%23fbbf24"/><circle cx="40" cy="42" r="5" fill="%23881337"/><circle cx="60" cy="42" r="5" fill="%23881337"/><ellipse cx="50" cy="54" rx="12" ry="7" fill="%23f97316"/><circle cx="33" cy="52" r="5" fill="%23fda4af"/><circle cx="67" cy="52" r="5" fill="%23fda4af"/></svg>`,
  // Cute Bear Avatar (Peach)
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ffe4e6"/><circle cx="28" cy="30" r="12" fill="%23fb7185"/><circle cx="72" cy="30" r="12" fill="%23fb7185"/><circle cx="50" cy="54" r="36" fill="%23fb7185"/><ellipse cx="50" cy="58" rx="14" ry="10" fill="%23ffffff"/><circle cx="50" cy="54" r="3.5" fill="%23881337"/><circle cx="38" cy="46" r="4" fill="%23881337"/><circle cx="62" cy="46" r="4" fill="%23881337"/></svg>`,
  // Cool Glasses Avatar (Purple)
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3e8ff"/><circle cx="50" cy="50" r="38" fill="%23c084fc"/><rect x="25" y="42" width="22" height="14" rx="3" fill="%233b0764"/><rect x="53" y="42" width="22" height="14" rx="3" fill="%233b0764"/><line x1="47" y1="48" x2="53" y2="48" stroke="%233b0764" stroke-width="3"/><path d="M 42 64 Q 50 72 58 64" stroke="%23ffffff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  // Heart Blush Avatar (Red)
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ffe4e6"/><circle cx="50" cy="50" r="38" fill="%23e11d48"/><path d="M 38 42 A 4 4 0 0 0 38 50 L 38 42 Z" fill="%23ffffff"/><circle cx="38" cy="45" r="4" fill="%23ffffff"/><circle cx="62" cy="45" r="4" fill="%23ffffff"/><path d="M 43 56 Q 50 63 57 56" stroke="%23ffffff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  // Minimal Chic Avatar (Emerald)
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ecfdf5"/><circle cx="50" cy="50" r="38" fill="%2310b981"/><circle cx="38" cy="44" r="4" fill="%23ffffff"/><circle cx="62" cy="44" r="4" fill="%23ffffff"/><path d="M 42 58 Q 50 66 58 58" stroke="%23ffffff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
];
