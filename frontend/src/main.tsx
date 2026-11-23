import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, Show } from '@clerk/react';
import { LandingPage } from './LandingPage';
import { Dashboard } from './Dashboard';
import './styles.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder';

const RootApp: React.FC = () => {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('stockroom_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('stockroom_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggleTheme = () => {
    setDark((prev) => !prev);
  };

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      {/* When signed in via Clerk, display full authenticated dashboard */}
      <Show when="signed-in">
        <Dashboard
          dark={dark}
          onToggleTheme={toggleTheme}
        />
      </Show>

      {/* When signed out, show the modern landing page */}
      <Show when="signed-out">
        <LandingPage
          dark={dark}
          onToggleTheme={toggleTheme}
        />
      </Show>
    </ClerkProvider>
  );
};

createRoot(document.getElementById('root')!).render(<RootApp />);
