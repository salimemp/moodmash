import { useTranslation } from '@/hooks/useTranslation';
import Head from 'next/head';
import React from 'react';
import { OfflineIndicator } from './ui/OfflineIndicator';
import { UpdatePrompt } from './ui/UpdatePrompt';

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
      <div className="min-h-screen flex flex-col">
        <UpdatePrompt />
        <OfflineIndicator />
        <main className="flex-grow">{children}</main>
      </div>
    </>
  );
};

export default Layout;
