import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useLogin } from "../services/login";
import { AdminAPI, BalanceOffset } from "../services/api";
import { MilliSatsDisplay } from "../components/MilliSatsDisplay";
import { UserProfile } from "../components/UserProfile";

// Helper function to create a minimal User object from user_id and pubkey
const createUserFromBalanceOffset = (userId: number, pubkey: string) => ({
  id: userId,
  pubkey: pubkey,
  created: 0,
  balance: 0,
  is_admin: false,
  is_blocked: false,
  tos_accepted: null,
  title: "",
  summary: "",
});

export const BalanceAuditPage: React.FC = () => {
  const { signer } = useLogin();
  const [balanceOffsets, setBalanceOffsets] = useState<BalanceOffset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  const adminAPI = React.useMemo(() => {
    return signer ? AdminAPI.current(signer) : null;
  }, [signer]);

  const loadBalanceOffsets = async (pageNum: number, limit: number) => {
    if (!adminAPI) return;

    try {
      setLoading(true);
      setError("");
      const response = await adminAPI.getBalanceOffsets(pageNum, limit);
      setBalanceOffsets(response.data);
      setTotalCount(response.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load balance offsets",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalanceOffsets(page, rowsPerPage);
  }, [adminAPI, page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getOffsetStatus = (offset: number) => {
    if (offset === 0) {
      return {
        label: "Balanced",
        color: "success" as const,
        icon: <CheckCircleIcon fontSize="small" />,
      };
    } else if (offset > 0) {
      return {
        label: "Surplus",
        color: "warning" as const,
        icon: <WarningIcon fontSize="small" />,
      };
    } else {
      return {
        label: "Deficit",
        color: "error" as const,
        icon: <ErrorIcon fontSize="small" />,
      };
    }
  };

  if (!signer) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Alert severity="error">Authentication required</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Balance Audit
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Users with the biggest balance discrepancies between their current
          account balance and calculated balance based on payment history and
          stream costs. Positive offsets indicate surplus (user has more than
          expected), negative offsets indicate deficit (user has less than
          expected).
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell align="right">Current Balance</TableCell>
                <TableCell align="right">Total Payments</TableCell>
                <TableCell align="right">Total Stream Costs</TableCell>
                <TableCell align="right">Expected Balance</TableCell>
                <TableCell align="right">Balance Offset</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : balanceOffsets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No balance offsets found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                balanceOffsets.map((offset) => {
                  const status = getOffsetStatus(offset.balance_offset);
                  const expectedBalance =
                    offset.total_payments - offset.total_stream_costs;

                  return (
                    <TableRow key={offset.user_id} hover>
                      <TableCell>
                        <UserProfile
                          user={createUserFromBalanceOffset(
                            offset.user_id,
                            offset.pubkey,
                          )}
                          size="small"
                          showCopyButton={true}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <MilliSatsDisplay
                          milliSats={offset.current_balance}
                          variant="body2"
                          color={
                            offset.current_balance < 0
                              ? "error.main"
                              : "inherit"
                          }
                          wholeSatsOnly={true}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <MilliSatsDisplay
                          milliSats={offset.total_payments}
                          variant="body2"
                          color={
                            offset.total_payments < 0
                              ? "error.main"
                              : "success.main"
                          }
                          wholeSatsOnly={true}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <MilliSatsDisplay
                          milliSats={offset.total_stream_costs}
                          variant="body2"
                          color={
                            offset.total_stream_costs < 0
                              ? "error.main"
                              : "inherit"
                          }
                          wholeSatsOnly={true}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <MilliSatsDisplay
                          milliSats={expectedBalance}
                          variant="body2"
                          color={
                            expectedBalance < 0
                              ? "error.main"
                              : "text.secondary"
                          }
                          wholeSatsOnly={true}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <MilliSatsDisplay
                          milliSats={offset.balance_offset}
                          variant="body2"
                          color={
                            offset.balance_offset > 0
                              ? "warning.main"
                              : offset.balance_offset < 0
                                ? "error.main"
                                : "success.main"
                          }
                          wholeSatsOnly={true}
                          showSign={true}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={status.icon}
                          label={status.label}
                          color={status.color}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
};
