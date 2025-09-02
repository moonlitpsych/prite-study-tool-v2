import { createWorker, Worker } from 'tesseract.js';

interface OCRResult {
  text: string;
  confidence: number;
}

let worker: Worker | null = null;

// Initialize worker once and reuse it
const getWorker = async (): Promise<Worker> => {
  if (!worker) {
    worker = await createWorker('eng', 1, {
      logger: (m) => {
        // Only log progress for debugging
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    // Optimize for document/page recognition with multiple text blocks
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,?!():-; \n',
      tessedit_pageseg_mode: '1' as any, // Automatic page segmentation with OSD
      preserve_interword_spaces: '1',
      tessedit_do_invert: '0', // Don't invert image colors
    });
  }
  
  return worker;
};

const preprocessImage = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size to image size (preserve full resolution)
      canvas.width = img.width;
      canvas.height = img.height;
      
      console.log(`Image dimensions: ${img.width}x${img.height}px`);
      console.log(`Canvas dimensions: ${canvas.width}x${canvas.height}px`);
      
      // Draw image at full size
      ctx.drawImage(img, 0, 0);
      
      // Enhance contrast for better OCR
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple contrast enhancement
      for (let i = 0; i < data.length; i += 4) {
        // Increase contrast for R, G, B channels
        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.2 + 128));     // Red
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.2 + 128)); // Green  
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.2 + 128)); // Blue
        // Alpha channel (data[i + 3]) remains unchanged
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const processImageWithOCR = async (imageFile: File): Promise<OCRResult> => {
  try {
    // Force fresh worker to avoid caching issues
    if (worker) {
      await worker.terminate();
      worker = null;
    }
    
    const workerInstance = await getWorker();
    
    console.log(`Starting OCR processing for ${imageFile.name}...`);
    console.log(`Original file size: ${Math.round(imageFile.size / 1024)}KB`);
    
    // Preprocess image for better OCR accuracy
    const processedImageUrl = await preprocessImage(imageFile);
    console.log(`Preprocessed image URL created, length: ${processedImageUrl.length}`);
    
    const { data } = await workerInstance.recognize(processedImageUrl);
    
    console.log(`OCR completed for ${imageFile.name} with confidence: ${data.confidence}%`);
    console.log(`Extracted text length: ${data.text.length} characters`);
    console.log(`First 200 chars: ${data.text.substring(0, 200)}...`);
    
    return {
      text: data.text.trim(),
      confidence: data.confidence
    };
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error('Failed to process image with OCR');
  }
};

export const cleanupOCR = async () => {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
};

// Clean up worker when page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupOCR);
}