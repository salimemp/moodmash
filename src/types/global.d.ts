declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    DATABASE_URL: string;
    GITHUB_ID: string;
    GITHUB_SECRET: string;
    GOOGLE_ID: string;
    GOOGLE_SECRET: string;
    SENTRY_DSN?: string;
    MFA_SERVICE_NAME?: string;
  }
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}
