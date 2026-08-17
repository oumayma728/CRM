import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../app/contexts/AuthContext';

const { mockLogin, mockGetMe, mockSetToken, mockGetToken, mockRemoveToken } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockGetMe: vi.fn(),
  mockSetToken: vi.fn(),
  mockGetToken: vi.fn(),
  mockRemoveToken: vi.fn(),
}));

vi.mock('../app/services/api', () => ({
  default: {
    login: mockLogin,
    getMe: mockGetMe,
  },
  getToken: mockGetToken,
  setToken: mockSetToken,
  removeToken: mockRemoveToken,
}));

function TestComponent() {
  const { user, isAuthenticated, isAdmin, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'true' : 'false'}</span>
      <span data-testid="admin">{isAdmin ? 'true' : 'false'}</span>
      <span data-testid="user">{user?.username ?? 'none'}</span>
      <button onClick={() => login('test', 'pass')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockGetToken.mockReturnValue(null);
  });

  it('should start unauthenticated', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('auth').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('should login successfully', async () => {
    mockLogin.mockResolvedValue({
      token: 'test-token',
      user: { id: 1, username: 'admin', name: 'Admin', role: 'admin' },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await userEvent.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByTestId('auth').textContent).toBe('true');
    });
    expect(screen.getByTestId('admin').textContent).toBe('true');
  });

  it('should logout', async () => {
    mockLogin.mockResolvedValue({
      token: 'test-token',
      user: { id: 1, username: 'admin', name: 'Admin', role: 'admin' },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await userEvent.click(screen.getByText('Login'));
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'));

    await userEvent.click(screen.getByText('Logout'));
    expect(screen.getByTestId('auth').textContent).toBe('false');
  });
});
