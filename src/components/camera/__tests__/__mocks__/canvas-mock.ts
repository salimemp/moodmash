/**
 * Canvas Mock Implementation
 * 
 * This file provides mock implementations of the Canvas APIs used in the CameraCapture component.
 * This includes HTMLCanvasElement and CanvasRenderingContext2D methods.
 */

import { vi } from 'vitest';

// Mock CanvasRenderingContext2D
export class MockCanvasRenderingContext2D {
  canvas: MockHTMLCanvasElement;
  fillStyle: string = '#000000';
  strokeStyle: string = '#000000';
  lineWidth: number = 1;
  font: string = '10px sans-serif';
  
  // Tracking of operations for tests
  _operations: Array<{method: string, args: any[]}> = [];

  constructor(canvas: MockHTMLCanvasElement) {
    this.canvas = canvas;
  }

  // Drawing methods
  clearRect(x: number, y: number, width: number, height: number) {
    this._operations.push({ method: 'clearRect', args: [x, y, width, height] });
  }

  fillRect(x: number, y: number, width: number, height: number) {
    this._operations.push({ method: 'fillRect', args: [x, y, width, height] });
  }

  strokeRect(x: number, y: number, width: number, height: number) {
    this._operations.push({ method: 'strokeRect', args: [x, y, width, height] });
  }

  fillText(text: string, x: number, y: number) {
    this._operations.push({ method: 'fillText', args: [text, x, y] });
  }

  strokeText(text: string, x: number, y: number) {
    this._operations.push({ method: 'strokeText', args: [text, x, y] });
  }

  measureText(text: string) {
    this._operations.push({ method: 'measureText', args: [text] });
    return { width: text.length * 5, height: 10 };
  }

  // Path methods
  beginPath() {
    this._operations.push({ method: 'beginPath', args: [] });
  }

  closePath() {
    this._operations.push({ method: 'closePath', args: [] });
  }

  moveTo(x: number, y: number) {
    this._operations.push({ method: 'moveTo', args: [x, y] });
  }

  lineTo(x: number, y: number) {
    this._operations.push({ method: 'lineTo', args: [x, y] });
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean) {
    this._operations.push({ 
      method: 'arc', 
      args: [x, y, radius, startAngle, endAngle, anticlockwise] 
    });
  }

  stroke() {
    this._operations.push({ method: 'stroke', args: [] });
  }

  fill() {
    this._operations.push({ method: 'fill', args: [] });
  }

  // Image drawing
  drawImage(image: CanvasImageSource, dx: number, dy: number): void;
  drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void;
  drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
  drawImage(image: any, ...args: any[]) {
    this._operations.push({ method: 'drawImage', args: [image, ...args] });
  }

  // Reset operations for test setup
  _resetOperations() {
    this._operations = [];
  }

  // Get operations for test assertions
  _getOperations() {
    return [...this._operations];
  }
}

// Mock HTMLCanvasElement that extends HTMLElement
export class MockHTMLCanvasElement {
  width: number = 300;
  height: number = 150;
  context: MockCanvasRenderingContext2D | null = null;
  className: string = '';
  style: any = {};
  
  // Add HTML element properties needed for React
  setAttribute(name: string, value: string) {
    (this as any)[name] = value;
  }
  
  getAttribute(name: string) {
    return (this as any)[name];
  }
  
  // Mock for toDataURL
  toDataURL(type = 'image/png', quality?: number): string {
    return `data:${type};base64,mockImageData`;
  }
  
  // Mock for getContext
  getContext(contextType: '2d'): MockCanvasRenderingContext2D | null {
    if (contextType === '2d') {
      if (!this.context) {
        this.context = new MockCanvasRenderingContext2D(this);
      }
      return this.context;
    }
    return null;
  }
}

// Setup canvas mock for testing
export function setupCanvasMock() {
  // Save original implementations
  const originalCreateElement = document.createElement;
  
  // Create a spy for createElement
  const createElementSpy = vi.spyOn(document, 'createElement');
  
  // Mock createElement to return our mock canvas when creating a canvas
  createElementSpy.mockImplementation((tagName: string): any => {
    if (tagName.toLowerCase() === 'canvas') {
      return new MockHTMLCanvasElement();
    }
    return originalCreateElement.call(document, tagName);
  });
  
  // Spy on canvas methods for testing (no need to actually patch prototype)
  const getContextSpy = vi.fn();
  const toDataURLSpy = vi.fn().mockReturnValue('data:image/png;base64,mockImageData');
  
  // Return function to restore original implementation
  return {
    restore: () => {
      createElementSpy.mockRestore();
    },
    spies: {
      getContext: getContextSpy,
      toDataURL: toDataURLSpy
    }
  };
}

export default setupCanvasMock; 