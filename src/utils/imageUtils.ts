/**
 * Compresses and resizes an uploaded image file into a compact base64 data URL.
 * Keeps uploaded icon assets lightweight for Firestore storage (< 15KB).
 */
export async function compressImageFileToDataUrl(file: File, maxDimension: number = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) {
        reject(new Error('Empty file'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

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
        canvas.width = Math.max(width, 16);
        canvas.height = Math.max(height, 16);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const format = file.type === 'image/png' || file.type === 'image/svg+xml' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(format, 0.88);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error('Could not parse image'));
      img.src = src;
    };

    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
