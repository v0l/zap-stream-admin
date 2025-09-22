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
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Collapse,
  Tooltip,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { useLogin } from "../services/login";
import { AdminAPI, AuditLogEntry, User } from "../services/api";
import { UserProfile } from "../components/UserProfile";

interface ExpandableRowProps {
  entry: AuditLogEntry;
}

// Helper function to create a minimal User object from a pubkey
const createUserFromPubkey = (pubkey: string): User => ({
  id: 0, // Not needed for profile display
  pubkey,
  created: 0, // Not needed for profile display
  balance: 0, // Not needed for profile display
  is_admin: false, // Not needed for audit log display
  is_blocked: false, // Not needed for audit log display
  tos_accepted: null, // Not needed for profile display
  title: "", // Not needed for profile display
  summary: "", // Not needed for profile display
});

const ExpandableRow: React.FC<ExpandableRowProps> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);

  const getActionColor = (action: string) => {
    switch (action) {
      case "grant_admin":
      case "add_credit":
        return "success";
      case "revoke_admin":
      case "block_user":
      case "delete_stream":
        return "error";
      case "unblock_user":
      case "regenerate_stream_key":
        return "warning";
      default:
        return "default";
    }
  };

  const formatAction = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatMetadata = (metadataString: string) => {
    try {
      const metadata = JSON.parse(metadataString);
      return JSON.stringify(metadata, null, 2);
    } catch {
      return metadataString;
    }
  };

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            disabled={!entry.metadata}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{entry.id}</TableCell>
        <TableCell>
          <UserProfile
            user={createUserFromPubkey(entry.admin_pubkey)}
            size="small"
            showCopyButton={true}
          />
        </TableCell>
        <TableCell>
          <Chip
            label={formatAction(entry.action)}
            color={getActionColor(entry.action) as any}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {entry.target_type}
          </Typography>
          {entry.target_pubkey ? (
            <UserProfile
              user={createUserFromPubkey(entry.target_pubkey)}
              size="small"
              showCopyButton={true}
            />
          ) : (
            <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
              {entry.target_id}
            </Typography>
          )}
        </TableCell>
        <TableCell>{entry.message}</TableCell>
        <TableCell>
          <Typography variant="body2">
            {format(new Date(entry.created * 1000), "MMM dd, yyyy")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {format(new Date(entry.created * 1000), "HH:mm:ss")}
          </Typography>
        </TableCell>
      </TableRow>
      {entry.metadata && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Typography variant="h6" gutterBottom component="div">
                  Metadata
                </Typography>
                <Paper sx={{ p: 2, bgcolor: "background.default" }}>
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      color: "text.primary",
                    }}
                  >
                    {formatMetadata(entry.metadata)}
                  </Typography>
                </Paper>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export const AuditLogPage: React.FC = () => {
  const { signer } = useLogin();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  const adminAPI = React.useMemo(() => {
    return signer ? AdminAPI.current(signer) : null;
  }, [signer]);

  const loadAuditLogs = async (pageNum: number, limit: number) => {
    if (!adminAPI) return;

    try {
      setLoading(true);
      setError("");
      const response = await adminAPI.getAuditLogs(pageNum, limit);
      setAuditLogs(response.logs);
      setTotalCount(response.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load audit logs",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs(page, rowsPerPage);
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
          <HistoryIcon />
          <Typography variant="h4" gutterBottom>
            Audit Log
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Track all administrative actions performed on the platform
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width={50}></TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No audit log entries found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((entry) => (
                  <ExpandableRow key={entry.id} entry={entry} />
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
