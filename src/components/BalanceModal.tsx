import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  InputAdornment,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import {
  AccountBalance as BalanceIcon,
  History as HistoryIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { User, HistoryItem } from "../services/api";
import { formatDistanceToNow } from "date-fns";
import { useLogin } from "../services/login";
import { UserProfile } from "./UserProfile";
import { MilliSatsDisplay } from "./MilliSatsDisplay";

interface BalanceModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const BalanceModal: React.FC<BalanceModalProps> = ({
  user,
  open,
  onClose,
  onUpdate,
}) => {
  const { getAdminAPI } = useLogin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const [creditAmount, setCreditAmount] = useState("");
  const [creditMemo, setCreditMemo] = useState("");

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });

  const loadHistory = async () => {
    if (!user) return;

    try {
      setHistoryLoading(true);
      const adminAPI = await getAdminAPI();
      if (adminAPI) {
        const response = await adminAPI.getUserHistory(
          user.id,
          paginationModel.page,
          paginationModel.pageSize,
        );
        setHistory(response.items);
      }
    } catch (err) {
      console.error("Failed to load balance history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (user && open) {
      setCreditAmount("");
      setCreditMemo("");
      setActiveTab(0);
      if (activeTab === 1) {
        loadHistory();
      }
    }
    setError(null);
  }, [user, open]);

  useEffect(() => {
    if (user && open && activeTab === 1) {
      loadHistory();
    }
  }, [activeTab, paginationModel]);

  const handleAddCredits = async () => {
    if (!user || !creditAmount || parseFloat(creditAmount) <= 0) return;

    setLoading(true);
    setError(null);

    try {
      const adminAPI = await getAdminAPI();
      if (adminAPI) {
        const amount = Math.floor(parseFloat(creditAmount) * 1000); // Convert sats to msats
        await adminAPI.addCredits(user.id, amount, creditMemo || undefined);
        onUpdate();
        // Refresh history if we're on history tab
        if (activeTab === 1) {
          loadHistory();
        }
        setCreditAmount("");
        setCreditMemo("");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add credits");
    } finally {
      setLoading(false);
    }
  };

  const historyColumns: GridColDef[] = [
    {
      field: "created",
      headerName: "Date",
      width: 180,
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
      field: "amount",
      headerName: "Amount",
      width: 150,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" height="100%">
          <Typography
            variant="body2"
            color={params.row.type === 0 ? "success.main" : "error.main"}
          >
            {params.row.type === 0 ? "+" : "-"}
            {params.value.toLocaleString()} sats
          </Typography>
        </Box>
      ),
    },
    {
      field: "desc",
      headerName: "Description",
      width: 250,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" height="100%">
          <Typography variant="body2" noWrap title={params.value}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
  ];

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <BalanceIcon />
          <Typography variant="h6">Balance Management</Typography>
        </Box>
        <Box mt={1}>
          <UserProfile
            user={user}
            size="medium"
            showBadges={true}
            direction="row"
          />
        </Box>
        <Box mt={2} mb={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Current Balance
          </Typography>
          <MilliSatsDisplay 
            milliSats={user.balance} 
            color="success.main"
            variant="h4"
          />
        </Box>
        <Box>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
          >
            <Tab icon={<AddIcon />} label="Add Credits" />
            <Tab icon={<HistoryIcon />} label="Balance History" />
          </Tabs>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Tab Content */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Add Credits
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                fullWidth
                label="Credit Amount"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                type="number"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">sats</InputAdornment>
                    ),
                  },
                }}
                helperText="Amount in satoshis to add to user's balance"
              />
              <TextField
                fullWidth
                label="Memo (Optional)"
                value={creditMemo}
                onChange={(e) => setCreditMemo(e.target.value)}
                multiline
                rows={2}
                helperText="Optional description for the credit transaction"
              />
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Balance History
            </Typography>
            <DataGrid
              rows={history}
              columns={historyColumns}
              loading={historyLoading}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              getRowId={(row) => `${row.created}-${row.type}-${row.amount}`}
              sx={{
                height: 400,
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "rgba(115, 115, 115, 0.2)", // neutral-500 with lighter opacity
                },
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
        {activeTab === 0 && (
          <Button
            onClick={handleAddCredits}
            variant="contained"
            disabled={loading || !creditAmount || parseFloat(creditAmount) <= 0}
          >
            {loading ? "Adding Credits..." : "Add Credits"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
