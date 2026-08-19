import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAutoClockIn } from '../app/hooks/useAutoClockIn';
import { useAuth } from '../app/contexts/AuthContext';

const { mockClockIn } = vi.hoisted(() => ({
  mockClockIn: vi.fn(),
}));

vi.mock('../app/services/api', () => ({
  clockIn: mockClockIn,
}));

vi.mock('../app/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function TestComponent() {
  const autoClockIn = useAutoClockIn();
  return <button onClick={autoClockIn}>Pointer</button>;
}

describe('useAutoClockIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clock in automatically when the user is an agent', async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 1, username: 'agent1', name: 'Agent 1', role: 'agent' },
    } as any);
    mockClockIn.mockResolvedValue({ success: true });

    render(<TestComponent />);
    await userEvent.click(screen.getByText('Pointer'));

    await waitFor(() => expect(mockClockIn).toHaveBeenCalledTimes(1));
  });

  it('should NOT clock in for non-agent roles (admin/qualite)', async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 2, username: 'admin', name: 'Admin', role: 'admin' },
    } as any);

    render(<TestComponent />);
    await userEvent.click(screen.getByText('Pointer'));

    expect(mockClockIn).not.toHaveBeenCalled();
  });

  it('should not throw when clock-in fails (non-blocking)', async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 1, username: 'agent1', name: 'Agent 1', role: 'agent' },
    } as any);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockClockIn.mockRejectedValue(new Error('network error'));

    render(<TestComponent />);
    await userEvent.click(screen.getByText('Pointer'));

    await waitFor(() => expect(mockClockIn).toHaveBeenCalledTimes(1));
    consoleError.mockRestore();
  });
});