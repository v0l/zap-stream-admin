import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  PeopleAlt as UsersIcon,
  AccountCircle,
  History as HistoryIcon,
  Cable as IngestIcon,
  Storage as ServerIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useLogin } from "../services/login";
import { UserProfile } from "./UserProfile";
import { ServerSelectorDialog } from "./ServerSelectorDialog";
import {
  User,
  getAPIEndpoints,
  getSelectedAPIEndpoint,
  setSelectedAPIEndpoint,
} from "../services/api";

export const Navigation: React.FC = () => {
  const { logout, publicKey } = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const profileRef = React.useRef<HTMLElement>(null);

  const [apiEndpoints, setApiEndpoints] = React.useState(() => getAPIEndpoints());
  const [selectedEndpoint, setSelectedEndpointState] = React.useState(() =>
    getSelectedAPIEndpoint(),
  );
  const [showServerDialog, setShowServerDialog] = React.useState(false);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    if (profileRef.current) {
      setAnchorEl(profileRef.current);
    }
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const handleEndpointChange = (endpointId: string) => {
    setSelectedAPIEndpoint(endpointId);
    const updatedEndpoints = getAPIEndpoints();
    const newSelectedEndpoint = updatedEndpoints.find((ep) => ep.id === endpointId) || updatedEndpoints[0];

    setApiEndpoints(updatedEndpoints);
    setSelectedEndpointState(newSelectedEndpoint);

    // Reload the page to reinitialize with new API endpoint
    window.location.reload();
  };

  const handleServerDialogClose = () => {
    setShowServerDialog(false);
    // Refresh endpoints in case they were modified
    const updatedEndpoints = getAPIEndpoints();
    const currentSelected = getSelectedAPIEndpoint();
    setApiEndpoints(updatedEndpoints);
    setSelectedEndpointState(currentSelected);
  };

  const isMenuOpen = Boolean(anchorEl);

  const menuItems = [
    { path: "/", label: "Dashboard", icon: <DashboardIcon /> },
    { path: "/users", label: "Users", icon: <UsersIcon /> },
    {
      path: "/ingest-endpoints",
      label: "Ingest Endpoints",
      icon: <IngestIcon />,
    },
    { path: "/audit-log", label: "Audit Log", icon: <HistoryIcon /> },
  ];

  // Create a minimal User object for the logged-in user
  const loggedInUser: User | null = publicKey
    ? {
        id: 0, // Not needed for display
        pubkey: publicKey,
        created: 0, // Not needed for display
        balance: 0, // Not needed for display
        is_admin: true, // Assumed since they can access admin panel
        is_blocked: false,
        tos_accepted: null,
        title: "",
        summary: "",
      }
    : null;

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ mr: 4 }}>
          zap.stream Admin
        </Typography>

        <Box sx={{ flexGrow: 1, display: "flex", gap: 1 }}>
          {menuItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor:
                  location.pathname === item.path
                    ? "rgba(255, 255, 255, 0.1)"
                    : "transparent",
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* API Endpoint Selector */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={selectedEndpoint.id}
                onChange={(e) => handleEndpointChange(e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  color: "white",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255, 255, 255, 0.5)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255, 255, 255, 0.7)",
                  },
                  "& .MuiSvgIcon-root": {
                    color: "white",
                  },
                }}
                renderValue={(value) => {
                  const endpoint = apiEndpoints.find((ep) => ep.id === value);
                  return (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ServerIcon fontSize="small" />
                      <Typography variant="body2" sx={{ color: "white" }}>
                        {endpoint?.name || "Unknown"}
                      </Typography>
                    </Box>
                  );
                }}
              >
                {apiEndpoints.map((endpoint) => (
                  <MenuItem key={endpoint.id} value={endpoint.id}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        {endpoint.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {endpoint.url}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              size="small"
              onClick={() => setShowServerDialog(true)}
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                "&:hover": {
                  color: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                }
              }}
              title="Manage API Endpoints"
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Box>

          {loggedInUser && (
            <Box sx={{ display: { xs: "none", sm: "block" } }} ref={profileRef}>
              <UserProfile
                user={loggedInUser}
                size="small"
                direction="row"
                showBadges={false}
                showCopyButton={false}
                onClick={handleProfileClick}
                nameFirst={true}
              />
            </Box>
          )}
          {/* Fallback menu button for mobile */}
          <Box sx={{ display: { xs: "block", sm: "none" } }}>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          keepMounted
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          open={isMenuOpen}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>

        <ServerSelectorDialog
          open={showServerDialog}
          onClose={handleServerDialogClose}
          onEndpointChange={handleEndpointChange}
        />
      </Toolbar>
    </AppBar>
  );
};
