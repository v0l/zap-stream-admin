import React from "react";
import {
  Box,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useUserProfile } from "@snort/system-react";
import { User } from "../services/api";
import {
  AdminPanelSettings as AdminIcon,
  Block as BlockIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import { hexToBech32 } from "@snort/shared";

interface UserProfileProps {
  user: User;
  withName?: boolean;
  size?: "small" | "medium" | "large";
  showBadges?: boolean;
  direction?: "row" | "column";
  showCopyButton?: boolean;
  onClick?: () => void;
  nameFirst?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  withName = true,
  size = "medium",
  showBadges = false,
  direction = "row",
  showCopyButton = false,
  onClick,
  nameFirst = false,
}) => {
  const userProfile = useUserProfile(user.pubkey);

  const displayName = userProfile?.display_name || userProfile?.name || "";
  const fallbackName = hexToBech32("npub", user.pubkey).slice(0, 12);
  const userName = displayName || fallbackName;
  const npub = hexToBech32("npub", user.pubkey);

  const handleCopyNpub = async () => {
    try {
      await navigator.clipboard.writeText(npub);
    } catch (err) {
      console.error("Failed to copy npub:", err);
    }
  };

  const avatarSize = {
    small: 32,
    medium: 40,
    large: 56,
  }[size];

  const nameVariant = {
    small: "body2" as const,
    medium: "body1" as const,
    large: "h6" as const,
  }[size];

  const profileContent = (
    <>
      {withName && nameFirst && (
        <Box display="flex" flexDirection="column" gap={0.5} minWidth={0}>
          <Typography variant={nameVariant} noWrap title={userName}>
            {userName}
          </Typography>

          {showBadges && (
            <Box display="flex" gap={0.5} flexWrap="wrap">
              {user.is_admin && (
                <Chip
                  size="small"
                  icon={<AdminIcon />}
                  label="Admin"
                  color="primary"
                  variant="outlined"
                />
              )}
              {user.is_blocked && (
                <Chip
                  size="small"
                  icon={<BlockIcon />}
                  label="Blocked"
                  color="error"
                  variant="outlined"
                />
              )}
            </Box>
          )}
        </Box>
      )}

      <Avatar
        src={userProfile?.picture}
        sx={{
          width: avatarSize,
          height: avatarSize,
          bgcolor: "#737373", // neutral-500 for better visibility
          color: "#fafafa", // neutral-50 for text contrast
        }}
      >
        {userName.charAt(0).toUpperCase()}
      </Avatar>

      {withName && !nameFirst && (
        <Box display="flex" flexDirection="column" gap={0.5} minWidth={0}>
          <Typography variant={nameVariant} noWrap title={userName}>
            {userName}
          </Typography>

          {showBadges && (
            <Box display="flex" gap={0.5} flexWrap="wrap">
              {user.is_admin && (
                <Chip
                  size="small"
                  icon={<AdminIcon />}
                  label="Admin"
                  color="primary"
                  variant="outlined"
                />
              )}
              {user.is_blocked && (
                <Chip
                  size="small"
                  icon={<BlockIcon />}
                  label="Blocked"
                  color="error"
                  variant="outlined"
                />
              )}
            </Box>
          )}
        </Box>
      )}

      {showCopyButton && (
        <Tooltip title={`Copy ${npub}`}>
          <IconButton size="small" onClick={handleCopyNpub} sx={{ ml: 0.5 }}>
            <CopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </>
  );

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1.5}
      flexDirection={direction}
      onClick={onClick}
      sx={onClick ? { cursor: "pointer" } : undefined}
    >
      {profileContent}
    </Box>
  );
};
