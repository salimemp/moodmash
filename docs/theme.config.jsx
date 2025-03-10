export default {
  logo: <span style={{ fontWeight: 'bold' }}>MoodMash Docs</span>,
  project: {
    link: 'https://github.com/yourusername/moodmash',
  },
  docsRepositoryBase: 'https://github.com/yourusername/moodmash/tree/main/docs',
  useNextSeoProps() {
    return {
      titleTemplate: '%s – MoodMash Documentation'
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="MoodMash Documentation" />
      <meta name="og:title" content="MoodMash Documentation" />
    </>
  ),
  editLink: {
    text: 'Edit this page on GitHub →'
  },
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'feedback'
  },
  sidebar: {
    titleComponent({ title, type }) {
      if (type === 'separator') {
        return <span className="cursor-default">{title}</span>
      }
      return <>{title}</>
    },
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  footer: {
    text: (
      <div className="flex w-full flex-col items-center sm:items-start">
        <p>
          © {new Date().getFullYear()} MoodMash. All rights reserved.
        </p>
      </div>
    )
  }
} 