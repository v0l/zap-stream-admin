import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Typography,
  Tooltip,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import {
  Search as SearchIcon,
  AdminPanelSettings as AdminIcon,
  Block as BlockIcon,
  AccountBalance as BalanceIcon,
  Settings as SettingsIcon,
  Visibility as InspectIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { User } from "../services/api";
import { formatDistanceToNow } from "date-fns";
import { useLogin } from "../services/login";
import { UserProfile } from "./UserProfile";
import { MilliSatsDisplay } from "./MilliSatsDisplay";
import { tryParseNostrLink } from "@snort/system";
import { NostrPrefix } from "@snort/shared";

interface UserListProps {
  onEditUser: (user: User) => void;
  onManageBalance: (user: User) => void;
  onInspectUser: (user: User) => void;
}

export interface UserListRef {
  refresh: () => void;
}

export const UserList = forwardRef<UserListRef, UserListProps>(
  ({ onEditUser, onManageBalance, onInspectUser }, ref) => {
    const { getAdminAPI } = useLogin();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [searchError, setSearchError] = useState<string | null>(null);
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>(
      {
        page: 0,
        pageSize: 25,
      },
    );
    const [totalRows, setTotalRows] = useState(0);

    const loadUsers = useCallback(async () => {
      const adminAPI = await getAdminAPI();
      if (!adminAPI) return;

      setLoading(true);
      try {
        let searchQuery = search;

        // Try to parse npub/nostr link if search has content
        if (search.trim()) {
          try {
            const parsed = tryParseNostrLink(search.trim());
            if (
              parsed?.type === NostrPrefix.Profile ||
              parsed?.type === NostrPrefix.PublicKey
            ) {
              searchQuery = parsed.id;
              setSearchError(null);
            } else if (parsed) {
              setSearchError("Only user profiles (npub) are supported");
              return;
            } else {
              setSearchError("Invalid data");
              return;
            }
          } catch (error) {
            // If parsing fails, treat as regular search
            searchQuery = search;
            setSearchError(null);
          }
        } else {
          setSearchError(null);
        }

        const response = await adminAPI.getUsers(
          paginationModel.page,
          paginationModel.pageSize,
          searchQuery || undefined,
        );
        setUsers(response.data);
        setTotalRows(response.total);
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setLoading(false);
      }
    }, [getAdminAPI, paginationModel.page, paginationModel.pageSize, search]);

    useEffect(() => {
      loadUsers();
    }, [loadUsers]);

    useImperativeHandle(ref, () => ({
      refresh: loadUsers,
    }));

    const handleSearchChange = (value: string) => {
      setSearch(value);

      // Clear error when input is empty
      if (!value.trim()) {
        setSearchError(null);
        return;
      }

      // Try to parse immediately for validation feedback
      try {
        const parsed = tryParseNostrLink(value.trim());
        if (parsed && parsed.type !== "pubkey") {
          setSearchError("Only user profiles (npub) are supported");
        } else {
          setSearchError(null);
        }
      } catch (error) {
        // If it doesn't parse as nostr link, it's fine - treat as regular search
        setSearchError(null);
      }
    };

    const formatDate = (timestamp: number) => {
      return formatDistanceToNow(new Date(timestamp * 1000), {
        addSuffix: true,
      });
    };

    const columns: GridColDef[] = [
      {
        field: "id",
        headerName: "ID",
        width: 80,
        type: "number",
      },
      {
        field: "pubkey",
        headerName: "User",
        width: 240,
        renderCell: (params) => (
          <Box display="flex" alignItems="center" height="100%" py={1}>
            <UserProfile
              user={params.row}
              size="small"
              showBadges={false}
              showCopyButton={true}
            />
          </Box>
        ),
      },
      {
        field: "balance",
        headerName: "Balance",
        width: 120,
        type: "number",
        renderCell: (params) => (
          <Box display="flex" alignItems="center" height="100%">
            <MilliSatsDisplay
              milliSats={params.value}
              color="success.main"
              variant="body2"
            />
          </Box>
        ),
      },
      {
        field: "created",
        headerName: "Created",
        width: 120,
        renderCell: (params) => (
          <Box display="flex" alignItems="center" height="100%">
            <Typography variant="body2">{formatDate(params.value)}</Typography>
          </Box>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 180,
        renderCell: (params) => (
          <Box display="flex" alignItems="center" height="100%" gap={0.5}>
            {params.row.is_admin && (
              <Chip
                size="small"
                icon={<AdminIcon />}
                label="Admin"
                color="primary"
                variant="outlined"
                sx={{ cursor: "pointer" }}
              />
            )}
            {params.row.is_blocked && (
              <Chip
                size="small"
                icon={<BlockIcon />}
                label="Blocked"
                color="error"
                variant="outlined"
                sx={{ cursor: "pointer" }}
              />
            )}
            {params.row.stream_dump_recording && (
              <Tooltip title="Stream dump enabled">
                <Chip
                  size="small"
                  icon={<DownloadIcon />}
                  label="Dump"
                  color="info"
                  variant="outlined"
                  sx={{ cursor: "pointer" }}
                />
              </Tooltip>
            )}
          </Box>
        ),
      },
      {
        field: "title",
        headerName: "Stream Title",
        width: 200,
        renderCell: (params) => (
          <Box display="flex" alignItems="center" height="100%">
            <Typography variant="body2" noWrap>
              {params.value || "No title"}
            </Typography>
          </Box>
        ),
      },
      {
        field: "tos_accepted",
        headerName: "ToS Accepted",
        width: 120,
        renderCell: (params) => (
          <Box display="flex" alignItems="center" height="100%">
            <Typography variant="body2">{params.value ? "✓" : "✗"}</Typography>
          </Box>
        ),
      },
      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 140,
        getActions: (params) => [
          <GridActionsCellItem
            icon={<InspectIcon />}
            label="Inspect"
            onClick={() => onInspectUser(params.row)}
          />,
          <GridActionsCellItem
            icon={<SettingsIcon />}
            label="Settings"
            onClick={() => onEditUser(params.row)}
          />,
          <GridActionsCellItem
            icon={<BalanceIcon />}
            label="Balance"
            onClick={() => onManageBalance(params.row)}
          />,
        ],
      },
    ];

    return (
      <Box>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">User Management</Typography>
            <TextField
              size="small"
              placeholder="Search by public key or npub..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              error={!!searchError}
              helperText={searchError}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
          </Box>

          <DataGrid
            rows={users}
            columns={columns}
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            rowCount={totalRows}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            autoHeight
            sx={{
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "rgba(115, 115, 115, 0.2)", // neutral-500 with lighter opacity
              },
            }}
          />
        </Paper>
      </Box>
    );
  },
);
