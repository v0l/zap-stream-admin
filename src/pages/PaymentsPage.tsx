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
import {
  AdminAPI,
  Payment,
  PaymentsSummary,
  PaymentTypeStats,
} from "../services/api";
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

  // Current timestamp in seconds, recalculated when payments change
  const currentTimestamp = React.useMemo(() => Date.now() / 1000, [payments]);

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
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse filters
  const parseFilters = () => {
    const userId = userIdFilter ? parseInt(userIdFilter) : undefined;
    const paymentType = paymentTypeFilter || undefined;
    const isPaid =
      isPaidFilter === "true"
        ? true
        : isPaidFilter === "false"
          ? false
          : undefined;
    return { userId, paymentType, isPaid };
  };

  useEffect(() => {
    loadSummary();
  }, [adminAPI]);

  useEffect(() => {
    const { userId, paymentType, isPaid } = parseFilters();
    loadPayments(page, rowsPerPage, userId, paymentType, isPaid);
  }, [
    adminAPI,
    page,
    rowsPerPage,
    userIdFilter,
    paymentTypeFilter,
    isPaidFilter,
  ]);

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
    const { userId, paymentType, isPaid } = parseFilters();
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

  const getPaymentTypeColor = (
    type: string,
  ): "success" | "info" | "primary" | "error" | "warning" | "default" => {
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

  const isPaymentExpired = (payment: Payment): boolean => {
    return !payment.is_paid && payment.expires < currentTimestamp;
  };

  const getPaymentStatus = (payment: Payment): string => {
    if (payment.is_paid) {
      return "Paid";
    }
    return isPaymentExpired(payment) ? "Expired" : "Pending";
  };

  const getPaymentStatusColor = (
    payment: Payment,
  ): "success" | "error" | "warning" => {
    if (payment.is_paid) {
      return "success";
    }
    return isPaymentExpired(payment) ? "error" : "warning";
  };

  if (!signer) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Alert severity="error">Authentication required</Alert>
      </Container>
    );
  }

  const total_topups =
    (summary?.payments_by_type.top_up?.paid_amount ?? 0) +
    (summary?.payments_by_type.zap?.paid_amount ?? 0) -
    (summary?.payments_by_type.withdrawal?.paid_amount ?? 0);
  const paid_topups_only =
    (summary?.payments_by_type.top_up?.paid_amount ?? 0) -
    (summary?.payments_by_type.withdrawal?.paid_amount ?? 0);
  const topup_totals =
    total_topups + (summary?.payments_by_type.credit?.paid_amount ?? 0);
  const balance_diff =
    (summary?.total_balance ?? 0) -
    topup_totals +
    (summary?.total_stream_costs ?? 0);

  const pnl =
    total_topups +
    (summary?.total_stream_costs ?? 0) -
    (summary?.payments_by_type.credit?.paid_amount ?? 0) -
    (summary?.total_balance ?? 0);

  // Determine if stream costs are consuming paid credits vs free credits
  const stream_costs = summary?.total_stream_costs ?? 0;
  const paid_credits_consumed = Math.min(stream_costs, paid_topups_only);
  const free_credits_consumed = Math.max(0, stream_costs - paid_topups_only);
  const isConsumingPaidCredits = stream_costs > paid_topups_only;
  return (
    <Container maxWidth="xl" sx={{ mt: 3 }}>
      {/* Payment Summary */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Payment Summary
        </Typography>
        {summaryLoading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        ) : summary ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment Type</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Total Amount</TableCell>
                      <TableCell align="right">Paid Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(summary.payments_by_type).map(
                      ([type, stats]) => (
                        <TableRow key={type}>
                          <TableCell>
                            <Chip
                              label={formatPaymentType(type.replace("_", " "))}
                              color={getPaymentTypeColor(type)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {stats.count} ({stats.paid_count})
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              paid
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <MilliSatsDisplay
                              milliSats={stats.total_amount}
                              variant="body2"
                              wholeSatsOnly={true}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <MilliSatsDisplay
                              milliSats={stats.paid_amount}
                              variant="body2"
                              color="success.main"
                              wholeSatsOnly={true}
                            />
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                    <TableRow
                      sx={{
                        borderTop: 2,
                        borderColor: "divider",
                        "& td": { fontWeight: "bold" },
                      }}
                    >
                      <TableCell>Totals</TableCell>
                      <TableCell align="right">
                        {summary.total_payments}
                      </TableCell>
                      <TableCell align="right">
                        <MilliSatsDisplay
                          milliSats={
                            summary.total_paid_amount +
                            summary.total_pending_amount
                          }
                          variant="body2"
                          wholeSatsOnly={true}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <MilliSatsDisplay
                          milliSats={summary.total_paid_amount}
                          variant="body2"
                          color="success.main"
                          wholeSatsOnly={true}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ pb: 2, "&:last-child": { pb: 2 } }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <AccountBalance color="primary" fontSize="small" />
                        <Typography>Profit</Typography>
                      </Box>
                      <MilliSatsDisplay
                        milliSats={pnl}
                        variant="h6"
                        color={pnl > 0 ? "success.main" : "error.main"}
                        wholeSatsOnly={true}
                        showSign={true}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ pb: 2, "&:last-child": { pb: 2 } }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <TrendingUp color="success" fontSize="small" />
                        <Typography>Total Topups</Typography>
                      </Box>
                      <MilliSatsDisplay
                        milliSats={total_topups}
                        variant="h6"
                        wholeSatsOnly={true}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ pb: 2, "&:last-child": { pb: 2 } }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <PaymentIcon color="info" fontSize="small" />
                        <Typography>Sats Streamed</Typography>
                      </Box>
                      <MilliSatsDisplay
                        milliSats={summary.total_stream_costs}
                        variant="h6"
                        wholeSatsOnly={true}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                {balance_diff !== 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ pb: 2, "&:last-child": { pb: 2 } }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <PaymentIcon color="info" fontSize="small" />
                          <Box>
                            <Typography>Balance Offset</Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Difference in the total system balances vs sum of
                              all payment history
                            </Typography>
                          </Box>
                        </Box>
                        <Box>
                          <MilliSatsDisplay
                            milliSats={balance_diff}
                            variant="h6"
                            color={
                              balance_diff !== 0 ? "error.main" : "success.main"
                            }
                            wholeSatsOnly={true}
                            showSign={true}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="error">Failed to load payment summary</Alert>
        )}
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              label="User ID"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
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
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                fullWidth
              >
                Apply
              </Button>
              <Button variant="outlined" onClick={handleClearFilters} fullWidth>
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
        <TableContainer>
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
                        color={getPaymentTypeColor(payment.payment_type)}
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
                        label={getPaymentStatus(payment)}
                        color={getPaymentStatusColor(payment)}
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
