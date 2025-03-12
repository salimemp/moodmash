import React from 'react';
import { GetStaticProps } from 'next';
import { getI18nStaticProps } from '@/utils/i18n-server';
import { useTranslation } from '@/hooks/useTranslation';
import { useDirection } from '@/context/DirectionContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Layout from '@/components/Layout';

export const getStaticProps: GetStaticProps = async context => {
  return getI18nStaticProps(context, ['common', 'auth', 'messages']);
};

const LanguageDemo: React.FC = () => {
  const { t, formatDate, formatNumber } = useTranslation(['common', 'auth', 'messages']);
  const { direction, isRTL } = useDirection();
  const currentDate = new Date();
  const sampleNumber = 1234567.89;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8" style={{ direction }}>
        <h1 className="text-3xl font-bold mb-6 text-start">
          {t('app.name')} - {t('language.select')}
        </h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-start">{t('language.select')}</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg mb-2">Dropdown Style:</h3>
              <LanguageSwitcher variant="dropdown" />
            </div>
            <div>
              <h3 className="text-lg mb-2">Select Style:</h3>
              <LanguageSwitcher variant="select" />
            </div>
            <div>
              <h3 className="text-lg mb-2">Buttons Style:</h3>
              <LanguageSwitcher variant="buttons" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-start">{t('common:app.tagline')}</h2>
            <p className="mb-4 text-start">{t('common:app.description')}</p>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <span className="font-medium me-2">{t('common:nav.home')}:</span>
                <span>{isRTL ? '🏠 الرئيسية' : '🏠 Home'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium me-2">{t('common:nav.messages')}:</span>
                <span>{isRTL ? '💬 الرسائل' : '💬 Messages'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium me-2">{t('common:nav.profile')}:</span>
                <span>{isRTL ? '👤 الملف الشخصي' : '👤 Profile'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-start">{t('auth:signin.title')}</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-start mb-1">{t('auth:signin.email')}</label>
                <input
                  type="email"
                  className="w-full p-2 border rounded"
                  placeholder={t('auth:signin.email')}
                />
              </div>
              <div>
                <label className="block text-start mb-1">{t('auth:signin.password')}</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded"
                  placeholder={t('auth:signin.password')}
                />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="remember" className="me-2" />
                <label htmlFor="remember" className="text-start">
                  {t('auth:signin.remember')}
                </label>
              </div>
              <button
                type="button"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                {t('auth:signin.button')}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-start">{t('messages:messages.title')}</h2>
          <div className="border rounded p-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">
                {t('messages:conversation.with', { name: 'John Doe' })}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(currentDate, { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
            <p className="text-start">{t('messages:secure.encryption_active')}</p>
          </div>
          <div className="flex items-center">
            <input
              type="text"
              className="flex-1 p-2 border rounded-s"
              placeholder={t('messages:conversation.message_placeholder')}
            />
            <button type="button" className="bg-blue-600 text-white py-2 px-4 rounded-e">
              {t('messages:conversation.send')}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-start">Internationalization Features</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-start">Date Formatting:</h3>
              <p className="text-start">{formatDate(currentDate, { dateStyle: 'full' })}</p>
            </div>
            <div>
              <h3 className="font-medium text-start">Number Formatting:</h3>
              <p className="text-start">
                {formatNumber(sampleNumber, { style: 'currency', currency: 'USD' })}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-start">Direction:</h3>
              <p className="text-start">
                Current direction: <strong>{direction.toUpperCase()}</strong>
              </p>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center text-gray-500">
          {t('common:footer.copyright', { year: new Date().getFullYear() })}
        </footer>
      </div>
    </Layout>
  );
};

export default LanguageDemo;
