import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Divider,
  Chip,
  IconButton,
  Alert,
} from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import {
  ArrowBack as BackIcon,
  Settings as SettingsIcon,
  AccountBalance as BalanceIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
} from "@mui/icons-material";
import { UserProfile } from "../components/UserProfile";
import { UserManagementModal } from "../components/UserManagementModal";
import { BalanceModal } from "../components/BalanceModal";
import { User, Stream } from "../services/api";
import { formatDistanceToNow } from "date-fns";
import { useLogin } from "../services/login";

export const UserInspectPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getAdminAPI } = useLogin();

  const [user, setUser] = useState<User | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [streamsLoading, setStreamsLoading] = useState(true);
  const [totalStreams, setTotalStreams] = useState(0);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);

  // Get user from router state
  const routerUser = location.state?.user as User | undefined;

  const loadStreams = async () => {
    if (!userId) return;

    try {
      setStreamsLoading(true);
      const adminAPI = await getAdminAPI();
      if (adminAPI) {
        const response = await adminAPI.getUserStreams(
          parseInt(userId),
          paginationModel.page,
          paginationModel.pageSize,
        );
        setStreams(response.streams);
        setTotalStreams(response.total);
      }
    } catch (err) {
      console.error("Failed to load streams:", err);
    } finally {
      setStreamsLoading(false);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        setError("User ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Use user from router state if available
        if (routerUser) {
          setUser(routerUser);
        } else {
          // Fallback: try to fetch user data from API
          const adminAPI = await getAdminAPI();
          if (adminAPI) {
            try {
              const userData = await adminAPI.getUser(parseInt(userId));
              setUser(userData);
            } catch (apiError) {
              setError("User not found or failed to load user data");
              setLoading(false);
              return;
            }
          } else {
            setError("Authentication required");
            setLoading(false);
            return;
          }
        }

        // Load stream data
        await loadStreams();
      } catch (err: any) {
        setError(err.message || "Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId, routerUser, getAdminAPI]);

  // Load streams when pagination changes
  useEffect(() => {
    if (user) {
      loadStreams();
    }
  }, [paginationModel]);

  const handleRefresh = async () => {
    // Re-fetch user data
    if (!userId || !user) return;

    try {
      setLoading(true);
      const adminAPI = await getAdminAPI();
      if (adminAPI) {
        try {
          const userData = await adminAPI.getUser(parseInt(userId));
          setUser(userData);
        } catch (apiError) {
          console.error("Failed to refresh user data:", apiError);
        }
      }

      // Also refresh stream data
      await loadStreams();
    } catch (err) {
      console.error("Failed to refresh data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (state: Stream["state"]) => {
    switch (state) {
      case "live":
        return "error";
      case "ended":
        return "default";
      case "planned":
        return "warning";
      case "unknown":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (state: Stream["state"]) => {
    switch (state) {
      case "live":
        return "LIVE";
      case "ended":
        return "ENDED";
      case "planned":
        return "PLANNED";
      case "unknown":
        return "UNKNOWN";
      default:
        return "UNKNOWN";
    }
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatCost = (cost: number) => {
    return Math.ceil(cost / 1000).toLocaleString() + " sats";
  };

  const columns: GridColDef[] = [
    {
      field: "title",
      headerName: "Title",
      width: 250,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" height="100%">
          <Typography variant="body2" noWrap title={params.value}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "state",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" height="100%">
          <Chip
            label={getStatusLabel(params.value)}
            color={getStatusColor(params.value)}
            size="small"
            icon={params.value === "live" ? <PlayIcon /> : <StopIcon />}
          />
        </Box>
      ),
    },
    {
      field: "starts",
      headerName: "Started",
      width: 150,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" height="100%">
          <Typography variant="body2">
            {formatDistanceToNow(new Date(params.value * 1000), {
              addSuffix: true,
            })}
          </Typography>
        </Box>
      ),
    },
    {
      field: "duration",
      headerName: "Duration",
      width: 100,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" height="100%">
          <Typography variant="body2">
            {formatDuration(params.value)}
          </Typography>
        </Box>
      ),
    },
    {
      field: "cost",
      headerName: "Cost",
      width: 120,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" height="100%">
          <Typography variant="body2" color="warning.main">
            {formatCost(params.value)}
          </Typography>
        </Box>
      ),
    },
    {
      field: "tags",
      headerName: "Tags",
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" height="100%" gap={0.5}>
          {params.value &&
            params.value
              .slice(0, 2)
              .map((tag: string, index: number) => (
                <Chip key={index} label={tag} size="small" variant="outlined" />
              ))}
          {params.value && params.value.length > 2 && (
            <Chip
              label={`+${params.value.length - 2}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      ),
    },
  ];

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Typography>Loading user data...</Typography>
      </Container>
    );
  }

  if (error || !user) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Alert severity="error">{error || "User not found"}</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate("/users")}
          sx={{ mt: 2 }}
        >
          Back to Users
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3 }}>
      {/* Header */}
      <Box mb={3}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <IconButton onClick={() => navigate("/users")}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4">User Inspection</Typography>
        </Box>
      </Box>

      {/* User Profile Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <UserProfile
            user={user}
            size="large"
            showBadges={true}
            showCopyButton={true}
          />

          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setSettingsModalOpen(true)}
            >
              Settings
            </Button>
            <Button
              variant="outlined"
              startIcon={<BalanceIcon />}
              onClick={() => setBalanceModalOpen(true)}
            >
              Balance
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* User Stats */}
        <Box display="flex" flexWrap="wrap" gap={3}>
          <Box flex="1" minWidth="200px">
            <Typography variant="subtitle2" color="text.secondary">
              Account Created
            </Typography>
            <Typography variant="body1">
              {formatDistanceToNow(new Date(user.created * 1000), {
                addSuffix: true,
              })}
            </Typography>
          </Box>
          <Box flex="1" minWidth="200px">
            <Typography variant="subtitle2" color="text.secondary">
              Current Balance
            </Typography>
            <Typography variant="body1" color="success.main">
              {(user.balance / 1000).toLocaleString()} sats
            </Typography>
          </Box>
          <Box flex="1" minWidth="200px">
            <Typography variant="subtitle2" color="text.secondary">
              Total Streams
            </Typography>
            <Typography variant="body1">{streams.length}</Typography>
          </Box>
          <Box flex="1" minWidth="200px">
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Box display="flex" gap={0.5}>
              {user.is_admin && (
                <Chip size="small" label="Admin" color="primary" />
              )}
              {user.is_blocked && (
                <Chip size="small" label="Blocked" color="error" />
              )}
              {!user.is_admin && !user.is_blocked && (
                <Chip size="small" label="Regular User" />
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Stream History */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Stream History
        </Typography>

        <DataGrid
          rows={streams}
          columns={columns}
          loading={streamsLoading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          paginationMode="server"
          rowCount={totalStreams}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{
            height: 600,
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "rgba(115, 115, 115, 0.2)", // neutral-500 with lighter opacity
            },
          }}
        />
      </Paper>

      {/* Modals */}
      <UserManagementModal
        user={user}
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onUpdate={handleRefresh}
      />

      <BalanceModal
        user={user}
        open={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        onUpdate={handleRefresh}
      />
    </Container>
  );
};
