import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Divider,
  Alert,
} from "@mui/material";
import { User } from "../services/api";
import { formatDistanceToNow } from "date-fns";
import { useLogin } from "../services/login";
import { UserProfile } from "./UserProfile";

interface UserManagementModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  user,
  open,
  onClose,
  onUpdate,
}) => {
  const { getAdminAPI } = useLogin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [image, setImage] = useState("");
  const [tags, setTags] = useState("");
  const [contentWarning, setContentWarning] = useState("");
  const [goal, setGoal] = useState("");

  React.useEffect(() => {
    if (user) {
      setIsAdmin(user.is_admin);
      setIsBlocked(user.is_blocked);
      setTitle(user.title || "");
      setSummary(user.summary || "");
      setImage("");
      setTags("");
      setContentWarning("");
      setGoal("");
    }
    setError(null);
  }, [user, open]);

  const formatBalance = (balance: number) => {
    return (balance / 1000).toLocaleString() + " sats";
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const updates: any = {};

      // Admin status
      if (isAdmin !== user.is_admin) {
        updates.set_admin = isAdmin;
      }

      // Blocked status
      if (isBlocked !== user.is_blocked) {
        updates.set_blocked = isBlocked;
      }

      // Stream settings
      if (title !== (user.title || "")) {
        updates.title = title;
      }
      if (summary !== (user.summary || "")) {
        updates.summary = summary;
      }
      if (image) {
        updates.image = image;
      }
      if (tags) {
        updates.tags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
      }
      if (contentWarning) {
        updates.content_warning = contentWarning;
      }
      if (goal) {
        updates.goal = goal;
      }

      if (Object.keys(updates).length > 0) {
        const adminAPI = await getAdminAPI();
        if (adminAPI) {
          await adminAPI.updateUser(user.id, updates);
          onUpdate();
          onClose();
        }
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6">User Settings</Typography>
        </Box>
        <Box mt={1}>
          <UserProfile
            user={user}
            size="medium"
            showBadges={true}
            direction="row"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* User Info */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Account Information
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Box flex="1" minWidth="200px">
              <Typography variant="body2">
                <strong>Balance:</strong> {formatBalance(user.balance)}
              </Typography>
            </Box>
            <Box flex="1" minWidth="200px">
              <Typography variant="body2">
                <strong>User ID:</strong> #{user.id}
              </Typography>
            </Box>
            <Box flex="1" minWidth="200px">
              <Typography variant="body2">
                <strong>Created:</strong>{" "}
                {formatDistanceToNow(new Date(user.created * 1000), {
                  addSuffix: true,
                })}
              </Typography>
            </Box>
            <Box flex="1" minWidth="200px">
              <Typography variant="body2">
                <strong>ToS Accepted:</strong> {user.tos_accepted ? "✓" : "✗"}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Admin Controls */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Administrative Actions
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Box flex="1" minWidth="200px">
              <FormControlLabel
                control={
                  <Switch
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    color="primary"
                  />
                }
                label="Admin Privileges"
              />
            </Box>
            <Box flex="1" minWidth="200px">
              <FormControlLabel
                control={
                  <Switch
                    checked={isBlocked}
                    onChange={(e) => setIsBlocked(e.target.checked)}
                    color="error"
                  />
                }
                label="Block User"
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Stream Settings */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Stream Settings
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              fullWidth
              label="Default Stream Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              fullWidth
              label="Default Stream Summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              multiline
              rows={2}
            />
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Default Image URL"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
              <TextField
                fullWidth
                label="Default Tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                helperText="Comma-separated tags"
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Content Warning"
                value={contentWarning}
                onChange={(e) => setContentWarning(e.target.value)}
              />
              <TextField
                fullWidth
                label="Streaming Goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
