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
} from "@mui/material";
import {
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  PeopleAlt as UsersIcon,
  AccountCircle,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useLogin } from "../services/login";
import { UserProfile } from "./UserProfile";
import { User } from "../services/api";

export const Navigation: React.FC = () => {
  const { logout, publicKey } = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const profileRef = React.useRef<HTMLElement>(null);

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

  const isMenuOpen = Boolean(anchorEl);

  const menuItems = [
    { path: "/", label: "Dashboard", icon: <DashboardIcon /> },
    { path: "/users", label: "Users", icon: <UsersIcon /> },
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

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
      </Toolbar>
    </AppBar>
  );
};
