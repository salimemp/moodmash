import React from 'react';
import Head from 'next/head';
import { useTranslation } from '@/hooks/useTranslation';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, description }) => {
  const { t } = useTranslation('common');

  const pageTitle = title || t('app.name');
  const pageDescription = description || t('app.description');

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>{children}</main>
    </>
  );
};

export default Layout;
