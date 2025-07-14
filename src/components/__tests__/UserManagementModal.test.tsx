import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserManagementModal } from '../UserManagementModal';
import { User } from '../../services/api';

// Mock the login service
jest.mock('../../services/login', () => ({
  useLogin: () => ({
    getAdminAPI: () => Promise.resolve(null),
  }),
}));

const mockUser: User = {
  id: 1,
  pubkey: 'test-pubkey',
  created: Date.now() / 1000,
  balance: 50000,
  is_admin: false,
  is_blocked: false,
  tos_accepted: Date.now() / 1000,
  title: 'Test User',
  summary: 'Test summary',
  stream_key: 'test-stream-key-12345',
};

describe('UserManagementModal', () => {
  const defaultProps = {
    user: mockUser,
    open: true,
    onClose: jest.fn(),
    onUpdate: jest.fn(),
  };

  test('renders stream key management section when modal is open', () => {
    render(<UserManagementModal {...defaultProps} />);
    
    expect(screen.getByText('Stream Key Management')).toBeInTheDocument();
    expect(screen.getByLabelText('Stream Key')).toBeInTheDocument();
  });

  test('shows load button when no stream key is present', () => {
    const userWithoutKey = { ...mockUser, stream_key: undefined };
    render(<UserManagementModal {...defaultProps} user={userWithoutKey} />);
    
    expect(screen.getByText('Load Stream Key')).toBeInTheDocument();
  });

  test('shows masked stream key when key is present', () => {
    render(<UserManagementModal {...defaultProps} />);
    
    const streamKeyInput = screen.getByLabelText('Stream Key') as HTMLInputElement;
    expect(streamKeyInput.value).toBe('test-str•••••••2345');
  });

  test('does not render when modal is closed', () => {
    render(<UserManagementModal {...defaultProps} open={false} />);
    
    expect(screen.queryByText('Stream Key Management')).not.toBeInTheDocument();
  });

  test('does not render when user is null', () => {
    render(<UserManagementModal {...defaultProps} user={null} />);
    
    expect(screen.queryByText('Stream Key Management')).not.toBeInTheDocument();
  });
});