/**
 * Data Export/Import Manager (v1.0)
 * 
 * Features:
 * - Export data in JSON, CSV formats
 * - Import data from JSON, CSV files
 * - Data validation and sanitization
 * - Progress tracking for large exports
 * - Backup and restore functionality
 */

class DataExportImport {
  constructor() {
    this.supportedFormats = ['json', 'csv']
    this.exportableData = ['moods', 'activities', 'stats', 'settings', 'all']
  }

  /**
   * Export data to file
   */
  async exportData(dataType = 'all', format = 'json') {
    if (!this.supportedFormats.includes(format)) {
      throw new Error(`Unsupported format: ${format}`)
    }

    try {
      // Show loading indicator
      this.showProgress('Preparing export...')

      // Fetch data from API
      const data = await this.fetchDataForExport(dataType)

      // Convert to requested format
      let content, filename, mimeType

      if (format === 'json') {
        content = JSON.stringify(data, null, 2)
        filename = `moodmash-export-${dataType}-${this.getTimestamp()}.json`
        mimeType = 'application/json'
      } else if (format === 'csv') {
        content = this.convertToCSV(data, dataType)
        filename = `moodmash-export-${dataType}-${this.getTimestamp()}.csv`
        mimeType = 'text/csv'
      }

      // Create and download file
      this.downloadFile(content, filename, mimeType)

      this.hideProgress()
      this.showSuccess(`Data exported successfully as ${format.toUpperCase()}`)

      return { success: true, filename }
    } catch (error) {
      this.hideProgress()
      this.showError(`Export failed: ${error.message}`)
      throw error
    }
  }

  /**
   * Fetch data for export
   */
  async fetchDataForExport(dataType) {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      dataType,
      data: {},
    }

    if (dataType === 'all' || dataType === 'moods') {
      exportData.data.moods = await this.fetchAPI('/api/moods')
    }

    if (dataType === 'all' || dataType === 'activities') {
      exportData.data.activities = await this.fetchAPI('/api/activities')
    }

    if (dataType === 'all' || dataType === 'stats') {
      exportData.data.stats = await this.fetchAPI('/api/stats')
    }

    if (dataType === 'all' || dataType === 'settings') {
      exportData.data.settings = await this.fetchAPI('/api/settings')
    }

    // Add user profile
    exportData.data.profile = await this.fetchAPI('/api/profile')

    return exportData
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data, dataType) {
    let csv = ''

    // Handle different data types
    if (dataType === 'moods' || (dataType === 'all' && data.data.moods)) {
      const moods = dataType === 'all' ? data.data.moods : data
      csv += this.moodsToCSV(moods)
    }

    if (dataType === 'activities' || (dataType === 'all' && data.data.activities)) {
      const activities = dataType === 'all' ? data.data.activities : data
      csv += '\n\n' + this.activitiesToCSV(activities)
    }

    if (dataType === 'all') {
      csv += '\n\n' + this.statsToCSV(data.data.stats || {})
    }

    return csv
  }

  /**
   * Convert moods to CSV
   */
  moodsToCSV(moods) {
    if (!moods || moods.length === 0) return ''

    const headers = ['Date', 'Time', 'Mood', 'Energy', 'Notes', 'Tags']
    const rows = moods.map(mood => [
      new Date(mood.created_at).toLocaleDateString(),
      new Date(mood.created_at).toLocaleTimeString(),
      mood.mood_name || mood.mood,
      mood.energy_level || '',
      mood.notes || '',
      mood.tags ? mood.tags.join('; ') : '',
    ])

    return this.arrayToCSV([headers, ...rows])
  }

  /**
   * Convert activities to CSV
   */
  activitiesToCSV(activities) {
    if (!activities || activities.length === 0) return ''

    const headers = ['Date', 'Activity', 'Duration', 'Category', 'Notes']
    const rows = activities.map(activity => [
      new Date(activity.created_at).toLocaleDateString(),
      activity.name,
      activity.duration || '',
      activity.category || '',
      activity.notes || '',
    ])

    return this.arrayToCSV([headers, ...rows])
  }

  /**
   * Convert stats to CSV
   */
  statsToCSV(stats) {
    const headers = ['Metric', 'Value']
    const rows = Object.entries(stats).map(([key, value]) => [
      key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
    ])

    return this.arrayToCSV([headers, ...rows])
  }

  /**
   * Convert 2D array to CSV string
   */
  arrayToCSV(data) {
    return data.map(row => 
      row.map(cell => {
        // Escape cells containing commas, quotes, or newlines
        const cellStr = String(cell || '')
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(',')
    ).join('\n')
  }

  /**
   * Import data from file
   */
  async importData(file) {
    try {
      this.showProgress('Reading file...')

      const content = await this.readFile(file)
      const format = this.detectFormat(file.name, content)

      this.showProgress('Parsing data...')

      let data
      if (format === 'json') {
        data = JSON.parse(content)
      } else if (format === 'csv') {
        data = this.parseCSV(content)
      }

      // Validate data
      this.showProgress('Validating data...')
      this.validateImportData(data)

      // Import data via API
      this.showProgress('Importing data...')
      await this.importDataToAPI(data)

      this.hideProgress()
      this.showSuccess('Data imported successfully')

      return { success: true }
    } catch (error) {
      this.hideProgress()
      this.showError(`Import failed: ${error.message}`)
      throw error
    }
  }

  /**
   * Read file content
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(new Error('Failed to read file'))
      
      reader.readAsText(file)
    })
  }

  /**
   * Detect file format
   */
  detectFormat(filename, content) {
    if (filename.endsWith('.json')) return 'json'
    if (filename.endsWith('.csv')) return 'csv'
    
    // Try to detect from content
    try {
      JSON.parse(content)
      return 'json'
    } catch {
      return 'csv'
    }
  }

  /**
   * Parse CSV content
   */
  parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length === 0) throw new Error('Empty CSV file')

    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1).map(line => {
      const values = this.parseCSVLine(line)
      const obj = {}
      headers.forEach((header, index) => {
        obj[header] = values[index] || ''
      })
      return obj
    })

    return { data: { moods: rows } }
  }

  /**
   * Parse CSV line (handles quoted fields)
   */
  parseCSVLine(line) {
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  /**
   * Validate import data
   */
  validateImportData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format')
    }

    // Check version compatibility
    if (data.version && data.version !== '1.0') {
      console.warn('Import data version mismatch')
    }

    // Validate data structure
    if (!data.data) {
      throw new Error('Missing data field')
    }

    return true
  }

  /**
   * Import data to API
   */
  async importDataToAPI(data) {
    const imported = { moods: 0, activities: 0, settings: 0 }

    // Import moods
    if (data.data.moods && Array.isArray(data.data.moods)) {
      for (const mood of data.data.moods) {
        try {
          await this.fetchAPI('/api/moods', {
            method: 'POST',
            body: JSON.stringify(mood),
          })
          imported.moods++
        } catch (error) {
          console.error('Failed to import mood:', error)
        }
      }
    }

    // Import activities
    if (data.data.activities && Array.isArray(data.data.activities)) {
      for (const activity of data.data.activities) {
        try {
          await this.fetchAPI('/api/activities', {
            method: 'POST',
            body: JSON.stringify(activity),
          })
          imported.activities++
        } catch (error) {
          console.error('Failed to import activity:', error)
        }
      }
    }

    // Import settings
    if (data.data.settings) {
      try {
        await this.fetchAPI('/api/settings', {
          method: 'PUT',
          body: JSON.stringify(data.data.settings),
        })
        imported.settings = 1
      } catch (error) {
        console.error('Failed to import settings:', error)
      }
    }

    console.log('Import summary:', imported)
    return imported
  }

  /**
   * Fetch API helper
   */
  async fetchAPI(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const response = await fetch(url, { ...defaultOptions, ...options })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Download file
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  }

  /**
   * Get timestamp for filename
   */
  getTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  }

  /**
   * Show progress indicator
   */
  showProgress(message) {
    // Remove existing progress
    this.hideProgress()

    const progress = document.createElement('div')
    progress.id = 'export-import-progress'
    progress.className = 'fixed top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
    progress.innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fas fa-spinner fa-spin"></i>
        <span>${message}</span>
      </div>
    `
    document.body.appendChild(progress)
  }

  /**
   * Hide progress indicator
   */
  hideProgress() {
    const progress = document.getElementById('export-import-progress')
    if (progress) {
      progress.remove()
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showToast(message, 'success')
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showToast(message, 'error')
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div')
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-600' :
      type === 'error' ? 'bg-red-600' :
      'bg-blue-600'
    } text-white`
    toast.textContent = message
    
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.remove()
    }, 5000)
  }
}

// Create global instance
const dataExportImport = new DataExportImport()

// Expose to window
window.dataExportImport = dataExportImport

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataExportImport
}

console.log('[DataExportImport] Data Export/Import Manager initialized')
