import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticPropsContext, GetServerSidePropsContext } from 'next';

/**
 * Helper for common i18n translation setup in getStaticProps
 * @param context - Next.js static props context
 * @param namespaces - Array of namespaces to load
 * @param extraProps - Any additional props to include
 * @returns Props including translations
 */
export async function getI18nStaticProps(
  context: GetStaticPropsContext,
  namespaces: string[] = ['common'],
  extraProps = {}
) {
  const locale = context.locale || context.defaultLocale || 'en';
  
  const translations = await serverSideTranslations(locale, namespaces);
  
  return {
    props: {
      ...translations,
      ...extraProps,
    },
  };
}

/**
 * Helper for common i18n translation setup in getServerSideProps
 * @param context - Next.js server-side props context
 * @param namespaces - Array of namespaces to load
 * @param extraProps - Any additional props to include
 * @returns Props including translations
 */
export async function getI18nServerSideProps(
  context: GetServerSidePropsContext,
  namespaces: string[] = ['common'],
  extraProps = {}
) {
  const locale = context.locale || context.defaultLocale || 'en';
  
  const translations = await serverSideTranslations(locale, namespaces);
  
  return {
    props: {
      ...translations,
      ...extraProps,
    },
  };
}

/**
 * Helper to extract the locale from context
 * @param context Next.js context object
 * @returns The current locale
 */
export function getLocaleFromContext(
  context: GetStaticPropsContext | GetServerSidePropsContext
): string {
  return context.locale || context.defaultLocale || 'en';
} 