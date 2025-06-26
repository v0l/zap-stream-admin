import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Box } from "@mui/material";
import { UserList, UserListRef } from "../components/UserList";
import { UserManagementModal } from "../components/UserManagementModal";
import { BalanceModal } from "../components/BalanceModal";
import { User } from "../services/api";

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const userListRef = useRef<UserListRef>(null);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setSettingsModalOpen(true);
  };

  const handleManageBalance = (user: User) => {
    setSelectedUser(user);
    setBalanceModalOpen(true);
  };

  const handleInspectUser = (user: User) => {
    navigate(`/users/${user.id}`, { state: { user } });
  };

  const handleCloseSettingsModal = () => {
    setSettingsModalOpen(false);
    setSelectedUser(null);
  };

  const handleCloseBalanceModal = () => {
    setBalanceModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserUpdate = () => {
    userListRef.current?.refresh();
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3 }}>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage users, permissions, and account settings
        </Typography>
      </Box>

      <UserList
        ref={userListRef}
        onEditUser={handleEditUser}
        onManageBalance={handleManageBalance}
        onInspectUser={handleInspectUser}
      />

      <UserManagementModal
        user={selectedUser}
        open={settingsModalOpen}
        onClose={handleCloseSettingsModal}
        onUpdate={handleUserUpdate}
      />

      <BalanceModal
        user={selectedUser}
        open={balanceModalOpen}
        onClose={handleCloseBalanceModal}
        onUpdate={handleUserUpdate}
      />
    </Container>
  );
};
