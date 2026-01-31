import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from "@mui/material";
import {
  Payment as PaymentIcon,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  AttachMoney,
} from "@mui/icons-material";
import { format } from "date-fns";
import { useLogin } from "../services/login";
import { AdminAPI, Payment, PaymentsSummary, PaymentTypeStats } from "../services/api";
import { MilliSatsDisplay } from "../components/MilliSatsDisplay";
import { UserProfile } from "../components/UserProfile";

// Helper function to create a minimal User object from user_id and pubkey
const createUserFromPayment = (userId: number, pubkey: string | null) => ({
  id: userId,
  pubkey: pubkey || "",
  created: 0,
  balance: 0,
  is_admin: false,
  is_blocked: false,
  tos_accepted: null,
  title: "",
  summary: "",
});

export const PaymentsPage: React.FC = () => {
  const { signer } = useLogin();
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [userIdFilter, setUserIdFilter] = useState<string>("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("");
  const [isPaidFilter, setIsPaidFilter] = useState<string>("");

  const adminAPI = React.useMemo(() => {
    return signer ? AdminAPI.current(signer) : null;
  }, [signer]);

  const loadSummary = async () => {
    if (!adminAPI) return;

    try {
      setSummaryLoading(true);
      const response = await adminAPI.getPaymentsSummary();
      setSummary(response);
    } catch (err) {
      console.error("Failed to load payments summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadPayments = async (
    pageNum: number,
    limit: number,
    userId?: number,
    paymentType?: string,
    isPaid?: boolean,
  ) => {
    if (!adminAPI) return;

    try {
      setLoading(true);
      setError("");
      const response = await adminAPI.getPayments(
        pageNum,
        limit,
        userId,
        paymentType,
        isPaid,
      );
      setPayments(response.data);
      setTotalCount(response.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load payments",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [adminAPI]);

  useEffect(() => {
    const userId = userIdFilter ? parseInt(userIdFilter) : undefined;
    const paymentType = paymentTypeFilter || undefined;
    const isPaid =
      isPaidFilter === "true"
        ? true
        : isPaidFilter === "false"
          ? false
          : undefined;

    loadPayments(page, rowsPerPage, userId, paymentType, isPaid);
  }, [adminAPI, page, rowsPerPage, userIdFilter, paymentTypeFilter, isPaidFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleApplyFilters = () => {
    setPage(0);
    const userId = userIdFilter ? parseInt(userIdFilter) : undefined;
    const paymentType = paymentTypeFilter || undefined;
    const isPaid =
      isPaidFilter === "true"
        ? true
        : isPaidFilter === "false"
          ? false
          : undefined;

    loadPayments(0, rowsPerPage, userId, paymentType, isPaid);
  };

  const handleClearFilters = () => {
    setUserIdFilter("");
    setPaymentTypeFilter("");
    setIsPaidFilter("");
    setPage(0);
    loadPayments(0, rowsPerPage);
  };

  const formatPaymentType = (type: string) => {
    return type
      .replace(/([A-Z])/g, " $1")
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getPaymentTypeColor = (type: string) => {
    const normalized = type.toLowerCase();
    switch (normalized) {
      case "topup":
      case "top_up":
        return "success";
      case "zap":
        return "info";
      case "credit":
        return "primary";
      case "withdrawal":
        return "error";
      case "admissionfee":
      case "admission_fee":
        return "warning";
      default:
        return "default";
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
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <PaymentIcon />
          <Typography variant="h4" gutterBottom>
            Payments
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          View payment summary and transaction history
        </Typography>
      </Box>

      {/* Summary Cards */}
      {summaryLoading ? (
        <Box display="flex" justifyContent="center" mb={4}>
          <CircularProgress />
        </Box>
      ) : summary ? (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <AccountBalance fontSize="small" color="primary" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Balance
                  </Typography>
                </Box>
                <MilliSatsDisplay
                  milliSats={summary.total_balance}
                  variant="h5"
                  color="primary"
                />
                <Typography variant="caption" color="text.secondary">
                  Across {summary.total_users} users
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <AttachMoney fontSize="small" color="warning" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Stream Costs
                  </Typography>
                </Box>
                <MilliSatsDisplay
                  milliSats={summary.total_stream_costs}
                  variant="h5"
                  color="warning.main"
                />
                <Typography variant="caption" color="text.secondary">
                  Accumulated costs
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  {summary.balance_difference >= 0 ? (
                    <TrendingUp fontSize="small" color="success" />
                  ) : (
                    <TrendingDown fontSize="small" color="error" />
                  )}
                  <Typography variant="subtitle2" color="text.secondary">
                    Balance Difference
                  </Typography>
                </Box>
                <MilliSatsDisplay
                  milliSats={summary.balance_difference}
                  variant="h5"
                  color={
                    summary.balance_difference >= 0
                      ? "success.main"
                      : "error.main"
                  }
                />
                <Typography variant="caption" color="text.secondary">
                  {summary.balance_difference >= 0 ? "Surplus" : "Deficit"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PaymentIcon fontSize="small" color="info" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Payments
                  </Typography>
                </Box>
                <Typography variant="h5" color="info.main">
                  {summary.total_payments.toLocaleString()}
                </Typography>
                <Box display="flex" gap={1} mt={1}>
                  <Typography variant="caption" color="success.main">
                    Paid: <MilliSatsDisplay milliSats={summary.total_paid_amount} variant="caption" color="success.main" />
                  </Typography>
                </Box>
                <Typography variant="caption" color="warning.main">
                  Pending: <MilliSatsDisplay milliSats={summary.total_pending_amount} variant="caption" color="warning.main" />
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Type Breakdown */}
          {Object.entries(summary.payments_by_type).map(([type, stats]) => {
            const typeStats = stats as PaymentTypeStats;
            return (
              <Grid item xs={12} sm={6} md={2.4} key={type}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {formatPaymentType(type)}
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {typeStats.count.toLocaleString()}
                    </Typography>
                    <MilliSatsDisplay
                      milliSats={typeStats.total_amount}
                      variant="body2"
                      color="text.primary"
                    />
                    <Box mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        Paid: {typeStats.paid_count} (
                        <MilliSatsDisplay
                          milliSats={typeStats.paid_amount}
                          variant="caption"
                          color="text.secondary"
                        />
                        )
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : null}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="User ID"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              type="number"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Type</InputLabel>
              <Select
                value={paymentTypeFilter}
                label="Payment Type"
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="topup">Top Up</MenuItem>
                <MenuItem value="zap">Zap</MenuItem>
                <MenuItem value="credit">Credit</MenuItem>
                <MenuItem value="withdrawal">Withdrawal</MenuItem>
                <MenuItem value="admissionfee">Admission Fee</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={isPaidFilter}
                label="Payment Status"
                onChange={(e) => setIsPaidFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Paid</MenuItem>
                <MenuItem value="false">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                fullWidth
              >
                Apply
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                fullWidth
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Payments Table */}
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Payment Hash</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Fee</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Expires</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No payments found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.payment_hash} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                      >
                        {payment.payment_hash.slice(0, 16)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {payment.user_pubkey ? (
                        <UserProfile
                          user={createUserFromPayment(
                            payment.user_id,
                            payment.user_pubkey,
                          )}
                          size="small"
                          showCopyButton={true}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          User {payment.user_id} (deleted)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatPaymentType(payment.payment_type)}
                        color={getPaymentTypeColor(payment.payment_type) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <MilliSatsDisplay
                        milliSats={payment.amount}
                        variant="body2"
                        color={
                          payment.amount >= 0 ? "success.main" : "error.main"
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <MilliSatsDisplay
                        milliSats={payment.fee}
                        variant="body2"
                        color="text.secondary"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.is_paid ? "Paid" : "Pending"}
                        color={payment.is_paid ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(
                          new Date(payment.created * 1000),
                          "MMM dd, yyyy",
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(payment.created * 1000), "HH:mm:ss")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(
                          new Date(payment.expires * 1000),
                          "MMM dd, yyyy",
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(payment.expires * 1000), "HH:mm:ss")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
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
