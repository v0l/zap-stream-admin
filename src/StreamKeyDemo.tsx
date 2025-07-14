import React, { useState } from 'react';
import { Container, Typography, Box, Button, Paper, ThemeProvider } from '@mui/material';
import { UserManagementModal } from './components/UserManagementModal';
import { User } from './services/api';
import { darkTheme } from './theme';

// Mock the login service for demo purposes
jest.mock('./services/login', () => ({
  useLogin: () => ({
    getAdminAPI: async () => ({
      getStreamKey: async () => ({ stream_key: 'sk_live_1234567890abcdef1234567890abcdef' }),
      regenerateStreamKey: async () => ({ stream_key: 'sk_live_newkey567890abcdef1234567890abc' }),
    }),
  }),
}));

// Demo component to showcase stream key functionality
export const StreamKeyDemo: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  // Mock user data for demonstration
  const demoUser: User = {
    id: 1,
    pubkey: '02a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
    created: Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
    balance: 125000, // 125 sats
    is_admin: false,
    is_blocked: false,
    tos_accepted: Math.floor(Date.now() / 1000) - 86400 * 25,
    title: 'Demo Stream Title',
    summary: 'This is a demo stream for testing purposes',
    stream_key: 'sk_live_1234567890abcdef1234567890abcdef',
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Stream Key Management Demo
          </Typography>
          <Typography variant="body1" paragraph>
            This demo shows the new stream key management functionality that has been added to the admin panel.
          </Typography>
          
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Features Added:
            </Typography>
            <ul>
              <li>Display user's stream key (masked for security)</li>
              <li>Toggle visibility to show/hide the full key</li>
              <li>Copy stream key to clipboard functionality</li>
              <li>Regenerate stream key with admin privileges</li>
              <li>Load stream key if not initially available</li>
            </ul>
          </Box>

          <Button 
            variant="contained" 
            onClick={() => setModalOpen(true)}
            sx={{ mb: 2 }}
          >
            Open User Management Modal (Demo)
          </Button>

          <Typography variant="body2" color="text.secondary">
            Click the button above to see the stream key management interface in the User Management Modal.
          </Typography>
        </Paper>

        <UserManagementModal
          user={demoUser}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onUpdate={() => {
            console.log('User updated');
            setModalOpen(false);
          }}
        />
      </Container>
    </ThemeProvider>
  );
};