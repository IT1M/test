// Image optimization utilities for better performance

interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
  priority?: boolean;
}

interface ResponsiveImageConfig {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

// Generate optimized image URL for Next.js Image component
export function getOptimizedImageUrl(
  src: string, 
  options: ImageOptimizationOptions = {}
): string {
  if (!src) return '';

  // If it's already an optimized URL or external URL, return as is
  if (src.startsWith('http') || src.startsWith('/_next/image')) {
    return src;
  }

  const params = new URLSearchParams();
  
  if (options.quality) params.set('q', options.quality.toString());
  if (options.width) params.set('w', options.width.toString());
  if (options.height) params.set('h', options.height.toString());
  if (options.format) params.set('f', options.format);
  if (options.fit) params.set('fit', options.fit);
  if (options.blur) params.set('blur', options.blur.toString());

  const queryString = params.toString();
  return `/_next/image?url=${encodeURIComponent(src)}${queryString ? `&${queryString}` : ''}`;
}

// Generate responsive image configuration
export function getResponsiveImageConfig(
  src: string,
  alt: string,
  options: ImageOptimizationOptions & {
    breakpoints?: number[];
    sizes?: string;
  } = {}
): ResponsiveImageConfig {
  const {
    breakpoints = [640, 768, 1024, 1280, 1536],
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    quality = 85,
    priority = false,
    ...imageOptions
  } = options;

  return {
    src: getOptimizedImageUrl(src, imageOptions),
    alt,
    sizes,
    priority,
    quality,
    placeholder: 'blur',
    blurDataURL: generateBlurDataURL(src),
  };
}

// Generate blur placeholder data URL
export function generateBlurDataURL(src: string): string {
  // Simple base64 encoded 1x1 pixel image for blur placeholder
  const blurSvg = `
    <svg width="1" height="1" viewBox="0 0 1 1" xmlns="http://www.w3.org/2000/svg">
      <rect width="1" height="1" fill="#f3f4f6"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(blurSvg).toString('base64')}`;
}

// Preload critical images
export function preloadImage(src: string, options: ImageOptimizationOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = getOptimizedImageUrl(src, options);
    
    if (options.format) {
      link.type = `image/${options.format}`;
    }

    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to preload image: ${src}`));

    document.head.appendChild(link);
  });
}

// Lazy load images with Intersection Observer
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private images: Set<HTMLImageElement> = new Set();

  constructor(options: IntersectionObserverInit = {}) {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          this.loadImage(img);
          this.observer?.unobserve(img);
          this.images.delete(img);
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    });
  }

  observe(img: HTMLImageElement): void {
    if (!this.observer) {
      // Fallback: load immediately if no observer support
      this.loadImage(img);
      return;
    }

    this.images.add(img);
    this.observer.observe(img);
  }

  unobserve(img: HTMLImageElement): void {
    if (this.observer) {
      this.observer.unobserve(img);
    }
    this.images.delete(img);
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;

    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }

    if (srcset) {
      img.srcset = srcset;
      img.removeAttribute('data-srcset');
    }

    img.classList.remove('lazy');
    img.classList.add('loaded');

    // Trigger load event
    img.dispatchEvent(new Event('load'));
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.images.clear();
    }
  }
}

// Image format detection and fallback
export function getSupportedImageFormat(): 'avif' | 'webp' | 'jpeg' {
  if (typeof window === 'undefined') {
    return 'jpeg';
  }

  // Check for AVIF support
  const avifCanvas = document.createElement('canvas');
  avifCanvas.width = 1;
  avifCanvas.height = 1;
  const avifSupported = avifCanvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;

  if (avifSupported) {
    return 'avif';
  }

  // Check for WebP support
  const webpCanvas = document.createElement('canvas');
  webpCanvas.width = 1;
  webpCanvas.height = 1;
  const webpSupported = webpCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

  return webpSupported ? 'webp' : 'jpeg';
}

// Image compression utility for client-side uploads
export function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'webp' | 'png';
  } = {}
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg',
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Progressive image loading component props
export interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Image performance monitoring
export class ImagePerformanceMonitor {
  private static metrics: Map<string, {
    loadTime: number;
    size: number;
    format: string;
  }> = new Map();

  static trackImageLoad(src: string, startTime: number, size?: number): void {
    const loadTime = performance.now() - startTime;
    const format = this.getImageFormat(src);
    
    this.metrics.set(src, {
      loadTime,
      size: size || 0,
      format,
    });

    // Log slow images
    if (loadTime > 1000) {
      console.warn('[ImagePerf] Slow image detected:', {
        src,
        loadTime: `${loadTime.toFixed(2)}ms`,
        size: size ? `${(size / 1024).toFixed(2)}KB` : 'unknown',
        format,
      });
    }
  }

  static getMetrics(): Array<{
    src: string;
    loadTime: number;
    size: number;
    format: string;
  }> {
    return Array.from(this.metrics.entries()).map(([src, metrics]) => ({
      src,
      ...metrics,
    }));
  }

  static getAverageLoadTime(): number {
    const metrics = Array.from(this.metrics.values());
    if (metrics.length === 0) return 0;
    
    const totalTime = metrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    return totalTime / metrics.length;
  }

  private static getImageFormat(src: string): string {
    const extension = src.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }

  static clear(): void {
    this.metrics.clear();
  }
}

// Export utilities
export default {
  getOptimizedImageUrl,
  getResponsiveImageConfig,
  generateBlurDataURL,
  preloadImage,
  LazyImageLoader,
  getSupportedImageFormat,
  compressImage,
  ImagePerformanceMonitor,
};