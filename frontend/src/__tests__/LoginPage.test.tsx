import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../app/contexts/AuthContext';
import LoginPage from '../app/pages/LoginPage';

const { mockLogin, mockGetToken } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockGetToken: vi.fn(),
}));

vi.mock('../app/services/api', () => ({
  default: {
    login: mockLogin,
  },
  getToken: mockGetToken,
  setToken: vi.fn(),
  removeToken: vi.fn(),
}));

describe('LoginPage', () => {
  it('should render login form', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const button = screen.queryByRole('button', { name: /lancer la session/i });
    expect(button).not.toBeNull();
  });

  it('should have username and password fields', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const inputs = screen.queryAllByRole('textbox');
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    expect(inputs.length + passwordInputs.length).toBeGreaterThanOrEqual(2);
  });
});
