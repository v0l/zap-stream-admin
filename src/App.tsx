import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box, Typography } from "@mui/material";
import { NostrSystem } from "@snort/system";
import { SnortContext } from "@snort/system-react";
import { darkTheme } from "./theme";
import { useLogin } from "./services/login";
import { LoginForm } from "./components/LoginForm";
import { Navigation } from "./components/Navigation";
import { DashboardPage } from "./pages/DashboardPage";
import { UsersPage } from "./pages/UsersPage";
import { UserInspectPage } from "./pages/UserInspectPage";
import { AuditLogPage } from "./pages/AuditLogPage";

// Create Nostr system instance
const system = new NostrSystem({});

[
  "wss://relay.snort.social",
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
].forEach((r) => system.ConnectToRelay(r, { read: true, write: true }));

const AdminDashboard: React.FC = () => {
  return (
    <Box>
      <Navigation />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:userId" element={<UserInspectPage />} />
        <Route path="/audit-log" element={<AuditLogPage />} />
      </Routes>
    </Box>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useLogin();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return isAuthenticated ? <AdminDashboard /> : <LoginForm />;
};

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <SnortContext.Provider value={system}>
        <Router>
          <AppContent />
        </Router>
      </SnortContext.Provider>
    </ThemeProvider>
  );
}

export default App;
