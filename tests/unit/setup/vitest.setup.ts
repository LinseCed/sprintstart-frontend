import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';
import type { ReactNode } from 'react';

// 1. Mock Keycloak Context (Isolates IAM Layer)
vi.mock('@keycloakify/react', () => {
  return {
    useKeycloak: () => ({
      keycloak: {
        authenticated: true,
        token: 'mock-sprintstart-token',
        login: vi.fn(),
        logout: vi.fn(),
      },
      initialized: true,
    }),
  };
});

// 2. Mock React Router v7 (Handles Data Loaders and Application Boundaries)
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
    useParams: () => ({}),
  };
});

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
    useParams: () => ({}),
  };
});

// 3. Robust Mock for Framer Motion 12 (Prevents layout timeouts & layout clipping)
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  
  // Dynamically map common HTML tags used with motion elements
  const commonPrimitives = ['div', 'button', 'span', 'ul', 'li', 'section', 'nav', 'form'];
  
  const mockedMotion = commonPrimitives.reduce((acc, tagName) => {
    acc[tagName] = ({ children, className, ...props }: { children?: ReactNode; className?: string; [key: string]: unknown }) =>
      React.createElement(tagName, { className, ...props }, children);
    return acc;
  }, {} as Record<string, React.ComponentType<any>>);

  return {
    ...actual,
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    motion: mockedMotion,
  };
});

// 4. Global Browser Polyfills
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
