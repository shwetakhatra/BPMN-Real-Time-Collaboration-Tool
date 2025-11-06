import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JoinForm from '../JoinForm';
import { useDiagramStore } from '@/store/useDiagramStore';
import { initSocket } from '@/services/socket';

vi.mock('@/store/useDiagramStore');
vi.mock('@/services/socket', () => ({
  initSocket: vi.fn(),
  socket: null,
}));

describe('JoinForm', () => {
  const mockSetUsername = vi.fn();
  const mockSetUsers = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useDiagramStore as any).mockReturnValue({
      setUsername: mockSetUsername,
      setUsers: mockSetUsers,
    });
    
    Storage.prototype.getItem = vi.fn(() => null);
    Storage.prototype.setItem = vi.fn();
  });

  it('should render join form', () => {
    render(<JoinForm />);
    
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join/i })).toBeInTheDocument();
  });

  it('should disable join button when input is empty', () => {
    render(<JoinForm />);
    
    const button = screen.getByRole('button', { name: /join/i });
    expect(button).toBeDisabled();
  });

  it('should enable join button when input has value', () => {
    render(<JoinForm />);
    
    const input = screen.getByPlaceholderText('Enter your name');
    const button = screen.getByRole('button', { name: /join/i });
    
    fireEvent.change(input, { target: { value: 'shweta' } });
    
    expect(button).not.toBeDisabled();
  });
});

