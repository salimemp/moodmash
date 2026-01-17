// Mood Visualizations JavaScript

document.addEventListener('DOMContentLoaded', loadVisualizations);

async function loadVisualizations() {
  await loadMoodHeatmap();
  await loadEmotionRadar();
  await loadMoodTimeline();
  loadEmotionWheel();
}

async function loadMoodHeatmap() {
  try {
    const res = await fetch('/api/health/mood-heatmap?days=90');
    const data = await res.json();
    const container = document.getElementById('mood-heatmap');
    
    if (!data.heatmap || data.heatmap.length === 0) {
      container.innerHTML = '<div class="text-center text-gray-400">No mood data available. Start logging your moods!</div>';
      return;
    }
    
    // Create calendar grid
    const weeks = 13; // ~3 months
    const days = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
    
    // Create a map of dates to mood values
    const moodMap = {};
    data.heatmap.forEach(m => { moodMap[m.date] = m; });
    
    // Get start date (13 weeks ago, aligned to Sunday)
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (weeks * 7));
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Align to Sunday
    
    let html = '<div class="flex gap-1">';
    html += '<div class="flex flex-col gap-1 text-xs text-gray-500 pr-2">';
    days.forEach(d => html += `<div class="h-4 flex items-center">${d}</div>`);
    html += '</div>';
    
    for (let w = 0; w < weeks; w++) {
      html += '<div class="flex flex-col gap-1">';
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + (w * 7) + d);
        const dateStr = date.toISOString().split('T')[0];
        const mood = moodMap[dateStr];
        
        const color = mood ? mood.color : '#374151';
        const title = mood ? `${dateStr}: ${mood.emotion} (${Math.round(mood.value)})` : dateStr;
        
        html += `<div class="w-4 h-4 rounded-sm cursor-pointer hover:ring-1 hover:ring-white" 
                      style="background-color: ${color}" title="${title}"></div>`;
      }
      html += '</div>';
    }
    html += '</div>';
    
    container.innerHTML = html;
  } catch (err) {
    console.error('Failed to load heatmap:', err);
  }
}

async function loadEmotionRadar() {
  try {
    const res = await fetch('/api/health/mood-radar?days=30');
    const data = await res.json();
    
    if (!data.radar || data.radar.length === 0) return;
    
    const emotions = data.radar;
    const maxCount = Math.max(...emotions.map(e => e.count)) || 1;
    const polygon = document.getElementById('radar-polygon');
    const labelsContainer = document.getElementById('radar-labels');
    
    // Calculate polygon points
    const points = emotions.map((e, i) => {
      const angle = (Math.PI * 2 * i / emotions.length) - Math.PI / 2;
      const radius = (e.count / maxCount) * 100;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      return `${x},${y}`;
    }).join(' ');
    
    polygon.setAttribute('points', points);
    
    // Position labels
    labelsContainer.innerHTML = emotions.map((e, i) => {
      const angle = (Math.PI * 2 * i / emotions.length) - Math.PI / 2;
      const x = 50 + Math.cos(angle) * 45;
      const y = 50 + Math.sin(angle) * 45;
      const emoji = getEmotionEmoji(e.emotion);
      
      return `<span class="absolute text-xs transform -translate-x-1/2 -translate-y-1/2" 
                    style="left: ${x}%; top: ${y}%">
                ${emoji} ${e.emotion}
              </span>`;
    }).join('');
  } catch (err) {
    console.error('Failed to load radar:', err);
  }
}

async function loadMoodTimeline() {
  try {
    const res = await fetch('/api/moods?limit=30');
    const data = await res.json();
    const container = document.getElementById('mood-timeline');
    
    if (!data.moods || data.moods.length === 0) {
      container.innerHTML = '<div class="text-center text-gray-400">No mood data available</div>';
      return;
    }
    
    const moods = data.moods.slice().reverse(); // Oldest first
    const maxIntensity = 10;
    
    // Create SVG line chart
    const width = container.clientWidth || 600;
    const height = 180;
    const padding = 20;
    
    const xStep = (width - padding * 2) / Math.max(moods.length - 1, 1);
    
    const points = moods.map((m, i) => {
      const x = padding + i * xStep;
      const y = height - padding - ((m.intensity / maxIntensity) * (height - padding * 2));
      return { x, y, mood: m };
    });
    
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = pathD + ` L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;
    
    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-full">
        <!-- Grid lines -->
        ${[2, 4, 6, 8, 10].map(v => {
          const y = height - padding - ((v / maxIntensity) * (height - padding * 2));
          return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" 
                        stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
        }).join('')}
        
        <!-- Area fill -->
        <path d="${areaD}" fill="url(#gradient)" opacity="0.3"/>
        
        <!-- Line -->
        <path d="${pathD}" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"/>
        
        <!-- Points -->
        ${points.map(p => `
          <circle cx="${p.x}" cy="${p.y}" r="4" fill="#8B5CF6" 
                  class="cursor-pointer hover:r-6" 
                  title="${p.mood.emotion}: ${p.mood.intensity}/10"/>
        `).join('')}
        
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#8B5CF6"/>
            <stop offset="100%" stop-color="transparent"/>
          </linearGradient>
        </defs>
      </svg>
    `;
  } catch (err) {
    console.error('Failed to load timeline:', err);
  }
}

function loadEmotionWheel() {
  const emotions = [
    { name: 'happy', color: '#FBBF24', emoji: '😊' },
    { name: 'excited', color: '#F97316', emoji: '🤩' },
    { name: 'calm', color: '#10B981', emoji: '😌' },
    { name: 'neutral', color: '#6B7280', emoji: '😐' },
    { name: 'tired', color: '#6366F1', emoji: '😴' },
    { name: 'sad', color: '#3B82F6', emoji: '😢' },
    { name: 'anxious', color: '#A855F7', emoji: '😰' },
    { name: 'stressed', color: '#EC4899', emoji: '😤' },
    { name: 'angry', color: '#EF4444', emoji: '😠' }
  ];
  
  const segments = document.getElementById('wheel-segments');
  const legend = document.getElementById('wheel-legend');
  
  const angleStep = 360 / emotions.length;
  
  segments.innerHTML = emotions.map((e, i) => {
    const startAngle = (i * angleStep - 90) * Math.PI / 180;
    const endAngle = ((i + 1) * angleStep - 90) * Math.PI / 180;
    const r = 100;
    
    const x1 = Math.cos(startAngle) * r;
    const y1 = Math.sin(startAngle) * r;
    const x2 = Math.cos(endAngle) * r;
    const y2 = Math.sin(endAngle) * r;
    
    const largeArc = angleStep > 180 ? 1 : 0;
    
    return `
      <path d="M 0 0 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z"
            fill="${e.color}" opacity="0.7" class="cursor-pointer hover:opacity-100 transition-opacity"
            title="${e.name}"/>
    `;
  }).join('');
  
  legend.innerHTML = emotions.map(e => `
    <span class="flex items-center gap-1">
      <span class="w-3 h-3 rounded-full" style="background-color: ${e.color}"></span>
      ${e.emoji} ${e.name}
    </span>
  `).join('');
}

function getEmotionEmoji(emotion) {
  const emojis = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    anxious: '😰',
    calm: '😌',
    excited: '🤩',
    tired: '😴',
    stressed: '😤',
    neutral: '😐'
  };
  return emojis[emotion?.toLowerCase()] || '😐';
}
