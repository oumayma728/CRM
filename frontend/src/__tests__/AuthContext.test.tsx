import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth, homePathFor } from '../app/contexts/AuthContext';

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
  getAuthHeaders: () => ({}),
  API_BASE: '/api',
}));

function TestComponent() {
  const { user, isAuthenticated, isAdmin, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'true' : 'false'}</span>
      <span data-testid="admin">{isAdmin ? 'true' : 'false'}</span>
      <span data-testid="user">{user?.username ?? 'none'}</span>
      <span data-testid="role">{user?.role ?? 'none'}</span>
      <button onClick={() => login('test', 'pass').catch(() => {})}>Login</button>
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
      role: 'ADMIN',
      userId: 1,
      nom: 'Admin',
      prenom: 'Alice',
      email: 'admin@ebi.com',
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
      role: 'ADMIN',
      userId: 1,
      nom: 'Admin',
      prenom: 'Alice',
      email: 'admin@ebi.com',
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

  it('maps the backend user and normalises the role', async () => {
    mockLogin.mockResolvedValue({ ...{
        token: 'test-token',
        role: 'ADMIN',
        userId: 1,
        nom: 'Admin',
        prenom: 'Alice',
        email: 'admin@ebi.com',
      }, role: 'CONFIRMATRICE', typeConfirmatrice: 'CONF2' });
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    await userEvent.click(screen.getByText('Login'));
    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('confirmatrice'));
    expect(screen.getByTestId('user').textContent).toBe('admin@ebi.com');
    expect(screen.getByTestId('admin').textContent).toBe('false');
  });

  it('reports first-login / forced password change instead of throwing', async () => {
    let result: string | undefined;
    function FirstLogin() {
      const { login } = useAuth();
      return <button onClick={async () => { result = await login('new@ebi.com', 'tmp'); }}>Go</button>;
    }
    mockLogin.mockRejectedValue(new Error('COMPTE_EN_ATTENTE:Veuillez changer votre mot de passe.'));
    render(
      <AuthProvider>
        <FirstLogin />
      </AuthProvider>
    );
    await userEvent.click(screen.getByText('Go'));
    await waitFor(() => expect(result).toBe('pending_first_login'));
  });
});

describe('homePathFor', () => {
  it.each([
    [{ role: 'superadmin' }, '/superadmin/dashboard'],
    [{ role: 'admin' }, '/admin/realtime'],
    [{ role: 'agent' }, '/agent/dashboard'],
    [{ role: 'qualite' }, '/qualite/dashboard'],
    [{ role: 'commercial' }, '/commercial/dashboard'],
    [{ role: 'tech' }, '/technique/dashboard'],
    [{ role: 'confirmatrice', typeConfirmatrice: 'CONF1' }, '/confirmation1/dashboard'],
    [{ role: 'confirmatrice', typeConfirmatrice: 'CONF2' }, '/confirmation2/dashboard'],
    [{ role: 'confirmatrice', typeConfirmatrice: 'CONFCLIENT' }, '/confirmation-client/dashboard'],
  ])('%o → %s', (user, path) => {
    expect(homePathFor(user as any)).toBe(path);
  });

  it('sends anonymous users to the login page', () => {
    expect(homePathFor(null)).toBe('/login');
  });
});
