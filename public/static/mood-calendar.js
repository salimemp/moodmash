/**
 * Calendar View for Mood Tracking (v1.0)
 * 
 * Features:
 * - Month/week/year views
 * - Mood visualization with colors
 * - Click to view/edit mood entry
 * - Navigate between months
 * - Today indicator
 * - Responsive design
 */

class MoodCalendar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId)
    if (!this.container) {
      throw new Error(`Container not found: ${containerId}`)
    }

    this.options = {
      view: options.view || 'month', // 'month', 'week', 'year'
      onDateClick: options.onDateClick || (() => {}),
      onMoodClick: options.onMoodClick || (() => {}),
      ...options,
    }

    this.currentDate = new Date()
    this.moods = []
    this.moodColors = {
      'Excited': '#10b981', // green
      'Happy': '#3b82f6', // blue
      'Content': '#8b5cf6', // purple
      'Neutral': '#6b7280', // gray
      'Sad': '#f59e0b', // amber
      'Anxious': '#ef4444', // red
      'Angry': '#dc2626', // dark red
    }

    this.init()
  }

  /**
   * Initialize calendar
   */
  async init() {
    this.render()
    await this.loadMoods()
  }

  /**
   * Render calendar
   */
  render() {
    this.container.innerHTML = `
      <div class="mood-calendar">
        <div class="calendar-header">
          <button class="calendar-nav" onclick="window.moodCalendar.previousMonth()">
            <i class="fas fa-chevron-left"></i>
          </button>
          <h3 class="calendar-title">${this.getTitle()}</h3>
          <button class="calendar-nav" onclick="window.moodCalendar.nextMonth()">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="calendar-view-switcher">
          <button class="view-btn ${this.options.view === 'month' ? 'active' : ''}" onclick="window.moodCalendar.setView('month')">Month</button>
          <button class="view-btn ${this.options.view === 'week' ? 'active' : ''}" onclick="window.moodCalendar.setView('week')">Week</button>
          <button class="view-btn ${this.options.view === 'year' ? 'active' : ''}" onclick="window.moodCalendar.setView('year')">Year</button>
        </div>
        <div class="calendar-body">
          ${this.renderCalendarView()}
        </div>
        <div class="calendar-legend">
          ${this.renderLegend()}
        </div>
      </div>
    `

    this.addStyles()
  }

  /**
   * Render calendar view based on current view type
   */
  renderCalendarView() {
    if (this.options.view === 'month') {
      return this.renderMonthView()
    } else if (this.options.view === 'week') {
      return this.renderWeekView()
    } else if (this.options.view === 'year') {
      return this.renderYearView()
    }
  }

  /**
   * Render month view
   */
  renderMonthView() {
    const year = this.currentDate.getFullYear()
    const month = this.currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startingDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    let html = '<div class="calendar-month">'
    
    // Day headers
    html += '<div class="calendar-days-header">'
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    dayNames.forEach(day => {
      html += `<div class="day-header">${day}</div>`
    })
    html += '</div>'

    // Days grid
    html += '<div class="calendar-days-grid">'
    
    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      html += '<div class="calendar-day empty"></div>'
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isToday = this.isToday(date)
      const mood = this.getMoodForDate(date)
      const hasData = mood !== null

      html += `
        <div class="calendar-day ${isToday ? 'today' : ''} ${hasData ? 'has-data' : ''}" 
             onclick="window.moodCalendar.handleDateClick('${date.toISOString()}')">
          <div class="day-number">${day}</div>
          ${hasData ? this.renderMoodIndicator(mood) : ''}
        </div>
      `
    }

    html += '</div></div>'
    return html
  }

  /**
   * Render week view
   */
  renderWeekView() {
    const startOfWeek = this.getStartOfWeek(this.currentDate)
    let html = '<div class="calendar-week">'

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(date.getDate() + i)
      const isToday = this.isToday(date)
      const mood = this.getMoodForDate(date)
      const hasData = mood !== null

      html += `
        <div class="week-day ${isToday ? 'today' : ''} ${hasData ? 'has-data' : ''}"
             onclick="window.moodCalendar.handleDateClick('${date.toISOString()}')">
          <div class="week-day-header">
            <div class="day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div class="day-number">${date.getDate()}</div>
          </div>
          ${hasData ? this.renderMoodIndicator(mood) : '<div class="no-data">No mood logged</div>'}
        </div>
      `
    }

    html += '</div>'
    return html
  }

  /**
   * Render year view
   */
  renderYearView() {
    const year = this.currentDate.getFullYear()
    let html = '<div class="calendar-year">'

    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1)
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' })
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      
      html += `
        <div class="year-month" onclick="window.moodCalendar.goToMonth(${month})">
          <div class="month-name">${monthName}</div>
          <div class="month-grid">
      `

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        const mood = this.getMoodForDate(date)
        const hasData = mood !== null

        html += `
          <div class="year-day ${hasData ? 'has-data' : ''}" 
               style="${hasData ? `background-color: ${this.getMoodColor(mood)}` : ''}"
               title="${hasData ? mood.mood_name : 'No data'}">
          </div>
        `
      }

      html += '</div></div>'
    }

    html += '</div>'
    return html
  }

  /**
   * Render mood indicator
   */
  renderMoodIndicator(mood) {
    const color = this.getMoodColor(mood)
    return `
      <div class="mood-indicator" 
           style="background-color: ${color}" 
           onclick="window.moodCalendar.handleMoodClick(event, '${mood.id}')"
           title="${mood.mood_name}">
        <span class="mood-emoji">${this.getMoodEmoji(mood.mood_name)}</span>
      </div>
    `
  }

  /**
   * Render legend
   */
  renderLegend() {
    let html = '<div class="legend-items">'
    
    Object.entries(this.moodColors).forEach(([mood, color]) => {
      html += `
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${color}"></div>
          <span>${mood}</span>
        </div>
      `
    })

    html += '</div>'
    return html
  }

  /**
   * Load moods from API
   */
  async loadMoods() {
    try {
      // Fetch moods for current month/year
      const startDate = this.getViewStartDate()
      const endDate = this.getViewEndDate()

      const response = await fetch(`/api/moods?start=${startDate.toISOString()}&end=${endDate.toISOString()}`)
      const data = await response.json()

      this.moods = data.moods || []
      this.render()
    } catch (error) {
      console.error('Failed to load moods:', error)
    }
  }

  /**
   * Get mood for specific date
   */
  getMoodForDate(date) {
    const dateStr = date.toISOString().split('T')[0]
    return this.moods.find(mood => {
      const moodDate = new Date(mood.created_at).toISOString().split('T')[0]
      return moodDate === dateStr
    }) || null
  }

  /**
   * Get mood color
   */
  getMoodColor(mood) {
    return this.moodColors[mood.mood_name] || '#6b7280'
  }

  /**
   * Get mood emoji
   */
  getMoodEmoji(moodName) {
    const emojis = {
      'Excited': '🤩',
      'Happy': '😊',
      'Content': '😌',
      'Neutral': '😐',
      'Sad': '😢',
      'Anxious': '😰',
      'Angry': '😠',
    }
    return emojis[moodName] || '😐'
  }

  /**
   * Get calendar title
   */
  getTitle() {
    if (this.options.view === 'month') {
      return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } else if (this.options.view === 'week') {
      const start = this.getStartOfWeek(this.currentDate)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    } else if (this.options.view === 'year') {
      return this.currentDate.getFullYear().toString()
    }
  }

  /**
   * Navigation methods
   */
  previousMonth() {
    if (this.options.view === 'year') {
      this.currentDate.setFullYear(this.currentDate.getFullYear() - 1)
    } else if (this.options.view === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() - 7)
    } else {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1)
    }
    this.loadMoods()
  }

  nextMonth() {
    if (this.options.view === 'year') {
      this.currentDate.setFullYear(this.currentDate.getFullYear() + 1)
    } else if (this.options.view === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() + 7)
    } else {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1)
    }
    this.loadMoods()
  }

  goToMonth(month) {
    this.currentDate.setMonth(month)
    this.options.view = 'month'
    this.loadMoods()
  }

  setView(view) {
    this.options.view = view
    this.render()
    this.loadMoods()
  }

  /**
   * Helper methods
   */
  isToday(date) {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  getStartOfWeek(date) {
    const start = new Date(date)
    start.setDate(start.getDate() - start.getDay())
    start.setHours(0, 0, 0, 0)
    return start
  }

  getViewStartDate() {
    if (this.options.view === 'year') {
      return new Date(this.currentDate.getFullYear(), 0, 1)
    } else if (this.options.view === 'month') {
      return new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1)
    } else {
      return this.getStartOfWeek(this.currentDate)
    }
  }

  getViewEndDate() {
    if (this.options.view === 'year') {
      return new Date(this.currentDate.getFullYear(), 11, 31)
    } else if (this.options.view === 'month') {
      return new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0)
    } else {
      const end = this.getStartOfWeek(this.currentDate)
      end.setDate(end.getDate() + 6)
      return end
    }
  }

  /**
   * Event handlers
   */
  handleDateClick(dateStr) {
    const date = new Date(dateStr)
    this.options.onDateClick(date)
  }

  handleMoodClick(event, moodId) {
    event.stopPropagation()
    const mood = this.moods.find(m => m.id == moodId)
    if (mood) {
      this.options.onMoodClick(mood)
    }
  }

  /**
   * Add CSS styles
   */
  addStyles() {
    if (document.getElementById('mood-calendar-styles')) return

    const style = document.createElement('style')
    style.id = 'mood-calendar-styles'
    style.textContent = `
      .mood-calendar {
        background: white;
        border-radius: 0.5rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .dark .mood-calendar {
        background: #1f2937;
      }
      
      .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      
      .calendar-title {
        font-size: 1.25rem;
        font-weight: 600;
      }
      
      .calendar-nav {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        color: #6366f1;
      }
      
      .calendar-nav:hover {
        opacity: 0.8;
      }
      
      .calendar-view-switcher {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.5rem;
      }
      
      .dark .calendar-view-switcher {
        border-color: #374151;
      }
      
      .view-btn {
        background: none;
        border: none;
        padding: 0.5rem 1rem;
        cursor: pointer;
        color: #6b7280;
        border-bottom: 2px solid transparent;
      }
      
      .view-btn.active {
        color: #6366f1;
        border-bottom-color: #6366f1;
      }
      
      .calendar-days-header {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.25rem;
        margin-bottom: 0.5rem;
      }
      
      .day-header {
        text-align: center;
        font-weight: 600;
        color: #6b7280;
        padding: 0.5rem;
      }
      
      .calendar-days-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.25rem;
      }
      
      .calendar-day {
        aspect-ratio: 1;
        border: 1px solid #e5e7eb;
        border-radius: 0.25rem;
        padding: 0.5rem;
        cursor: pointer;
        position: relative;
      }
      
      .dark .calendar-day {
        border-color: #374151;
      }
      
      .calendar-day.empty {
        cursor: default;
        opacity: 0.3;
      }
      
      .calendar-day.today {
        background-color: #eff6ff;
        border-color: #6366f1;
      }
      
      .dark .calendar-day.today {
        background-color: #1e3a8a;
      }
      
      .calendar-day.has-data {
        font-weight: 600;
      }
      
      .calendar-day:hover:not(.empty) {
        background-color: #f3f4f6;
      }
      
      .dark .calendar-day:hover:not(.empty) {
        background-color: #374151;
      }
      
      .day-number {
        font-size: 0.875rem;
      }
      
      .mood-indicator {
        position: absolute;
        bottom: 0.25rem;
        right: 0.25rem;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .mood-emoji {
        font-size: 0.875rem;
      }
      
      .calendar-legend {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
      }
      
      .dark .calendar-legend {
        border-color: #374151;
      }
      
      .legend-items {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .legend-color {
        width: 1rem;
        height: 1rem;
        border-radius: 50%;
      }
      
      .calendar-week {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.5rem;
      }
      
      .week-day {
        border: 1px solid #e5e7eb;
        border-radius: 0.25rem;
        padding: 1rem;
        min-height: 150px;
        cursor: pointer;
      }
      
      .dark .week-day {
        border-color: #374151;
      }
      
      .week-day-header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-bottom: 0.5rem;
      }
      
      .day-name {
        font-size: 0.875rem;
        color: #6b7280;
      }
      
      .calendar-year {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
      }
      
      @media (max-width: 768px) {
        .calendar-year {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      .year-month {
        border: 1px solid #e5e7eb;
        border-radius: 0.25rem;
        padding: 0.75rem;
        cursor: pointer;
      }
      
      .dark .year-month {
        border-color: #374151;
      }
      
      .month-name {
        font-weight: 600;
        margin-bottom: 0.5rem;
        text-align: center;
      }
      
      .month-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
      }
      
      .year-day {
        aspect-ratio: 1;
        background-color: #f3f4f6;
        border-radius: 2px;
      }
      
      .dark .year-day {
        background-color: #374151;
      }
      
      .year-day.has-data {
        opacity: 1;
      }
    `
    document.head.appendChild(style)
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MoodCalendar
}

console.log('[MoodCalendar] Mood Calendar initialized')
