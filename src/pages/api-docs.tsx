import { GetStaticProps } from 'next';
import dynamic from 'next/dynamic';
import { getSwaggerSpec } from '@/lib/swagger';
import Head from 'next/head';

// Import SwaggerUI dynamically to avoid SSR issues
const SwaggerUI = dynamic(
  () => import('swagger-ui-react'),
  { ssr: false }
);

// Import swagger styles
import 'swagger-ui-react/swagger-ui.css';

interface ApiDocsProps {
  spec: Record<string, any>;
}

export default function ApiDocs({ spec }: ApiDocsProps) {
  return (
    <>
      <Head>
        <title>MoodMash API Documentation</title>
        <meta name="description" content="API documentation for MoodMash" />
      </Head>
      
      <div className="api-docs-container">
        <div className="api-docs-header">
          <h1>MoodMash API Documentation</h1>
          <p>Explore and test the MoodMash API endpoints</p>
        </div>
        <SwaggerUI spec={spec} />
      </div>
      
      <style jsx>{`
        .api-docs-container {
          padding: 2rem;
        }
        
        .api-docs-header {
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eaeaea;
        }
        
        .api-docs-header h1 {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        
        .api-docs-header p {
          color: #666;
        }
        
        :global(.swagger-ui) {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
        }
      `}</style>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const spec = getSwaggerSpec();
  
  return {
    props: {
      spec,
    },
  };
}; 