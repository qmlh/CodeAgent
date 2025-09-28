/**
 * Screen Capture Service
 * Handles screenshot and screen recording functionality for browser preview
 */

import { ScreenshotOptions, RecordingOptions } from '../types/browser';

export class ScreenCaptureService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;

  /**
   * Capture screenshot of a webview or element
   */
  async captureScreenshot(
    element: HTMLElement | HTMLWebViewElement,
    options: ScreenshotOptions = { type: 'viewport', format: 'png' }
  ): Promise<string> {
    try {
      let canvas: HTMLCanvasElement;

      if (element.tagName.toLowerCase() === 'webview') {
        // For webview elements, use Electron's capturePage API
        canvas = await this.captureWebView(element as HTMLWebViewElement, options);
      } else {
        // For regular HTML elements, use html2canvas or similar
        canvas = await this.captureElement(element, options);
      }

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL(`image/${options.format}`, options.quality || 0.9);
      return dataUrl;
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      throw new Error('Screenshot capture failed');
    }
  }

  /**
   * Capture webview content
   */
  private async captureWebView(
    webview: HTMLWebViewElement,
    options: ScreenshotOptions
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Get webview dimensions
    const rect = webview.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    try {
      // In a real Electron app, you would use:
      // const image = await webview.capturePage();
      // ctx.drawImage(image, 0, 0);

      // For development, create a placeholder screenshot
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add border
      ctx.strokeStyle = '#dee2e6';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      // Add content placeholder
      ctx.fillStyle = '#6c757d';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Screenshot Preview', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText(`${canvas.width} × ${canvas.height}`, canvas.width / 2, canvas.height / 2 + 10);
      
      // Add timestamp
      ctx.font = '12px Arial';
      ctx.fillText(new Date().toLocaleString(), canvas.width / 2, canvas.height / 2 + 40);

      return canvas;
    } catch (error) {
      console.error('Failed to capture webview:', error);
      throw error;
    }
  }

  /**
   * Capture regular HTML element
   */
  private async captureElement(
    element: HTMLElement,
    options: ScreenshotOptions
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    const rect = element.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // For development, we'll create a simple representation
    // In production, you might use html2canvas or similar library
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#333333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Element Screenshot', canvas.width / 2, canvas.height / 2);

    return canvas;
  }

  /**
   * Start screen recording
   */
  async startRecording(
    element: HTMLElement,
    options: RecordingOptions = { fps: 30, format: 'webm', includeAudio: false }
  ): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    try {
      // Get media stream from the element
      const stream = await this.getElementStream(element, options);
      
      // Create media recorder
      const mimeType = `video/${options.format}`;
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm',
      });

      this.recordedChunks = [];
      this.isRecording = true;

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second

      // Auto-stop after duration if specified
      if (options.duration) {
        setTimeout(() => {
          this.stopRecording();
        }, options.duration * 1000);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw new Error('Recording start failed');
    }
  }

  /**
   * Stop screen recording
   */
  async stopRecording(): Promise<string> {
    if (!this.mediaRecorder || !this.isRecording) {
      throw new Error('No recording in progress');
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Media recorder not available'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          this.recordedChunks = [];
          this.isRecording = false;
          resolve(url);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get media stream from element
   */
  private async getElementStream(
    element: HTMLElement,
    options: RecordingOptions
  ): Promise<MediaStream> {
    try {
      // For webview elements in Electron, you would use different approach
      if (element.tagName.toLowerCase() === 'webview') {
        // In Electron, you might use desktopCapturer API
        // For now, we'll simulate with a canvas stream
        return this.createCanvasStream(element, options);
      }

      // For regular elements, try to capture using getDisplayMedia
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: options.fps,
          },
          audio: options.includeAudio,
        });
        return stream;
      }

      // Fallback to canvas stream
      return this.createCanvasStream(element, options);
    } catch (error) {
      console.error('Failed to get element stream:', error);
      throw error;
    }
  }

  /**
   * Create canvas stream for recording
   */
  private createCanvasStream(element: HTMLElement, options: RecordingOptions): MediaStream {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    const rect = element.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Create a simple animation for demonstration
    let frame = 0;
    const animate = () => {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Recording...', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText(`Frame: ${frame++}`, canvas.width / 2, canvas.height / 2 + 20);
      
      if (this.isRecording) {
        requestAnimationFrame(animate);
      }
    };

    animate();

    // Get stream from canvas
    const stream = canvas.captureStream(options.fps);
    return stream;
  }

  /**
   * Download captured content
   */
  downloadCapture(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Check if recording is in progress
   */
  isRecordingActive(): boolean {
    return this.isRecording;
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): { screenshot: string[]; recording: string[] } {
    const screenshotFormats = ['png', 'jpeg', 'webp'];
    const recordingFormats = ['webm'];
    
    // Check for additional format support
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      recordingFormats.push('mp4');
    }

    return {
      screenshot: screenshotFormats,
      recording: recordingFormats,
    };
  }
}

// Singleton instance
export const screenCaptureService = new ScreenCaptureService();