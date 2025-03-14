export default function Home() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Welcome to MoodMash
      </h1>
      <p style={{ marginBottom: '1rem' }}>
        This is a simple test page to verify routing.
      </p>
      <div>
        <a 
          href="/test-mood" 
          style={{ 
            display: 'inline-block', 
            padding: '0.5rem 1rem', 
            backgroundColor: 'blue', 
            color: 'white', 
            borderRadius: '0.25rem',
            marginRight: '1rem',
            textDecoration: 'none'
          }}
        >
          Test Mood Page
        </a>
        <a 
          href="/enhanced-mood" 
          style={{ 
            display: 'inline-block', 
            padding: '0.5rem 1rem', 
            backgroundColor: 'purple', 
            color: 'white', 
            borderRadius: '0.25rem',
            textDecoration: 'none'
          }}
        >
          Enhanced Mood Creator
        </a>
      </div>
    </div>
  );
} 