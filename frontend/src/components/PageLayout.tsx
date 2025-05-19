import React from 'react';
import Head from 'next/head';
import Header from './Header';
import QuotaErrorBanner from './QuotaErrorBanner';
import PermissionErrorBanner from './PermissionErrorBanner';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  showHeader?: boolean;
}

export default function PageLayout({
  children,
  title = 'SummaTube - YouTube Video Summarizer',
  description = 'Get AI-powered summaries of your YouTube videos',
  onRefresh,
  isLoading,
  showHeader = true,
}: PageLayoutProps) {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      Head,
      null,
      React.createElement('title', null, title),
      React.createElement('meta', { name: 'description', content: description }),
      React.createElement('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      React.createElement('link', { rel: 'icon', href: '/favicon.ico' })
    ),
    showHeader && React.createElement(Header, { onRefresh, isLoading }),
    React.createElement(
      'main',
      { className: 'min-h-screen bg-gray-50 dark:bg-gray-900' },
      children
    ),
    React.createElement(QuotaErrorBanner, null),
    React.createElement(PermissionErrorBanner, null),
    React.createElement(
      'footer',
      { className: 'bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4' },
      React.createElement(
        'div',
        { className: 'container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm' },
        '© ',
        new Date().getFullYear(),
        ' SummaTube - AI-powered YouTube video summaries'
      )
    )
  );
}
