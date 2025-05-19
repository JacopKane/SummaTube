import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export default function Card({ children, className = '', interactive = false }: CardProps) {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden';
  const interactiveClasses = interactive ? 'hover:shadow-lg transition-shadow duration-300 cursor-pointer' : '';
  
  return (
    <div className={`${baseClasses} ${interactiveClasses} ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`p-4 border-b border-gray-100 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`p-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
}
