/**
 * Lazy Loader Utility (v1.0)
 * 
 * Features:
 * - Lazy load images, iframes, and other media
 * - Intersection Observer API for efficient loading
 * - Skeleton loaders while content loads
 * - Responsive image loading with srcset
 * - Error handling and fallbacks
 */

class LazyLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: options.rootMargin || '50px',
      threshold: options.threshold || 0.01,
      loadingClass: options.loadingClass || 'lazy-loading',
      loadedClass: options.loadedClass || 'lazy-loaded',
      errorClass: options.errorClass || 'lazy-error',
      ...options,
    }
    
    this.observer = null
    this.init()
  }

  /**
   * Initialize lazy loader
   */
  init() {
    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
      console.warn('[LazyLoader] IntersectionObserver not supported, loading all images immediately')
      this.loadAllImmediately()
      return
    }
    
    // Create intersection observer
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold,
      }
    )
    
    // Observe all lazy elements
    this.observeAll()
    
    console.log('[LazyLoader] Initialized')
  }

  /**
   * Observe all lazy-loadable elements
   */
  observeAll() {
    // Images with data-src
    const images = document.querySelectorAll('img[data-src], img[data-srcset]')
    images.forEach((img) => this.observe(img))
    
    // Iframes with data-src
    const iframes = document.querySelectorAll('iframe[data-src]')
    iframes.forEach((iframe) => this.observe(iframe))
    
    // Background images with data-bg
    const bgElements = document.querySelectorAll('[data-bg]')
    bgElements.forEach((el) => this.observe(el))
    
    // Videos with data-src
    const videos = document.querySelectorAll('video[data-src]')
    videos.forEach((video) => this.observe(video))
  }

  /**
   * Observe a single element
   */
  observe(element) {
    if (!this.observer) return
    
    element.classList.add(this.options.loadingClass)
    this.observer.observe(element)
  }

  /**
   * Handle intersection events
   */
  handleIntersection(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        this.loadElement(entry.target)
        this.observer.unobserve(entry.target)
      }
    })
  }

  /**
   * Load a single element
   */
  loadElement(element) {
    const tagName = element.tagName.toLowerCase()
    
    // Add loading class
    element.classList.add(this.options.loadingClass)
    
    // Load based on element type
    if (tagName === 'img') {
      this.loadImage(element)
    } else if (tagName === 'iframe') {
      this.loadIframe(element)
    } else if (tagName === 'video') {
      this.loadVideo(element)
    } else if (element.hasAttribute('data-bg')) {
      this.loadBackground(element)
    }
  }

  /**
   * Load image
   */
  loadImage(img) {
    const src = img.getAttribute('data-src')
    const srcset = img.getAttribute('data-srcset')
    const sizes = img.getAttribute('data-sizes')
    
    // Create a new image to preload
    const tempImg = new Image()
    
    tempImg.onload = () => {
      // Set actual src
      if (srcset) {
        img.srcset = srcset
      }
      if (sizes) {
        img.sizes = sizes
      }
      if (src) {
        img.src = src
      }
      
      // Remove loading class, add loaded class
      img.classList.remove(this.options.loadingClass)
      img.classList.add(this.options.loadedClass)
      
      // Remove data attributes
      img.removeAttribute('data-src')
      img.removeAttribute('data-srcset')
      img.removeAttribute('data-sizes')
      
      // Dispatch loaded event
      img.dispatchEvent(new Event('lazyloaded'))
    }
    
    tempImg.onerror = () => {
      img.classList.remove(this.options.loadingClass)
      img.classList.add(this.options.errorClass)
      
      // Set fallback image if provided
      const fallback = img.getAttribute('data-fallback')
      if (fallback) {
        img.src = fallback
      }
      
      // Dispatch error event
      img.dispatchEvent(new Event('lazyerror'))
    }
    
    // Start loading
    if (srcset) {
      tempImg.srcset = srcset
    }
    if (src) {
      tempImg.src = src
    }
  }

  /**
   * Load iframe
   */
  loadIframe(iframe) {
    const src = iframe.getAttribute('data-src')
    
    if (src) {
      iframe.src = src
      iframe.removeAttribute('data-src')
      
      iframe.onload = () => {
        iframe.classList.remove(this.options.loadingClass)
        iframe.classList.add(this.options.loadedClass)
      }
      
      iframe.onerror = () => {
        iframe.classList.remove(this.options.loadingClass)
        iframe.classList.add(this.options.errorClass)
      }
    }
  }

  /**
   * Load background image
   */
  loadBackground(element) {
    const bg = element.getAttribute('data-bg')
    
    if (bg) {
      // Preload image
      const tempImg = new Image()
      
      tempImg.onload = () => {
        element.style.backgroundImage = `url(${bg})`
        element.removeAttribute('data-bg')
        
        element.classList.remove(this.options.loadingClass)
        element.classList.add(this.options.loadedClass)
      }
      
      tempImg.onerror = () => {
        element.classList.remove(this.options.loadingClass)
        element.classList.add(this.options.errorClass)
      }
      
      tempImg.src = bg
    }
  }

  /**
   * Load video
   */
  loadVideo(video) {
    const sources = video.querySelectorAll('source[data-src]')
    
    sources.forEach((source) => {
      const src = source.getAttribute('data-src')
      if (src) {
        source.src = src
        source.removeAttribute('data-src')
      }
    })
    
    // Reload video
    video.load()
    
    video.onloadeddata = () => {
      video.classList.remove(this.options.loadingClass)
      video.classList.add(this.options.loadedClass)
    }
    
    video.onerror = () => {
      video.classList.remove(this.options.loadingClass)
      video.classList.add(this.options.errorClass)
    }
  }

  /**
   * Load all elements immediately (fallback for no IntersectionObserver)
   */
  loadAllImmediately() {
    const elements = document.querySelectorAll('[data-src], [data-srcset], [data-bg]')
    elements.forEach((element) => this.loadElement(element))
  }

  /**
   * Refresh - observe new elements
   */
  refresh() {
    this.observeAll()
  }

  /**
   * Destroy - clean up observer
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}

// Create global instance
const lazyLoader = new LazyLoader({
  rootMargin: '100px', // Start loading 100px before element enters viewport
  threshold: 0.01,
})

// Expose to window
window.lazyLoader = lazyLoader

// Auto-refresh on DOM changes
if ('MutationObserver' in window) {
  const mutationObserver = new MutationObserver(() => {
    lazyLoader.refresh()
  })
  
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

// Add CSS for lazy loading states
const style = document.createElement('style')
style.textContent = `
  /* Lazy loading states */
  .lazy-loading {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s ease-in-out infinite;
  }
  
  .dark .lazy-loading {
    background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
    background-size: 200% 100%;
  }
  
  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  
  .lazy-loaded {
    animation: fadeIn 0.3s ease-in;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .lazy-error {
    background-color: #fee2e2;
    border: 1px dashed #ef4444;
  }
  
  .dark .lazy-error {
    background-color: #7f1d1d;
    border-color: #dc2626;
  }
  
  /* Blur-up effect for images */
  img[data-src] {
    filter: blur(10px);
    transition: filter 0.3s;
  }
  
  img.lazy-loaded {
    filter: blur(0);
  }
`
document.head.appendChild(style)

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoader
}

console.log('[LazyLoader] Lazy Loader initialized')
