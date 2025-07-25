import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
import { useLogin } from "../services/login";
import { IngestEndpoint, IngestEndpointsResponse } from "../services/api";
import { MilliSatsDisplay } from "../components/MilliSatsDisplay";
import { IngestEndpointModal } from "../components/IngestEndpointModal";

export const IngestEndpointsPage: React.FC = () => {
  const { getAdminAPI } = useLogin();
  const [endpoints, setEndpoints] = useState<IngestEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<IngestEndpoint | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const loadEndpoints = async () => {
    try {
      setLoading(true);
      setError(null);
      const api = await getAdminAPI();
      if (!api) {
        setError("Authentication required");
        return;
      }
      const response: IngestEndpointsResponse = await api.getIngestEndpoints(
        page,
        limit,
      );
      setEndpoints(response.endpoints);
      setTotal(response.total);
    } catch (err) {
      console.error("Error loading ingest endpoints:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load ingest endpoints",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEndpoints();
  }, [getAdminAPI, page, limit]);

  const handleCreateEndpoint = () => {
    setEditingEndpoint(null);
    setIsModalOpen(true);
  };

  const handleEditEndpoint = (endpoint: IngestEndpoint) => {
    setEditingEndpoint(endpoint);
    setIsModalOpen(true);
  };

  const handleDeleteEndpoint = async (id: number) => {
    if (!confirm("Are you sure you want to delete this ingest endpoint?"))
      return;

    try {
      setDeleteLoading(id);
      const api = await getAdminAPI();
      if (!api) {
        setError("Authentication required");
        return;
      }
      await api.deleteIngestEndpoint(id);
      await loadEndpoints(); // Refresh the list
    } catch (err) {
      console.error("Error deleting ingest endpoint:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete ingest endpoint",
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEndpoint(null);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setEditingEndpoint(null);
    loadEndpoints(); // Refresh the list
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatCapabilities = (capabilities: string[]) => {
    return capabilities.map((cap, index) => (
      <Chip
        key={index}
        label={cap}
        size="small"
        variant="outlined"
        sx={{ mr: 0.5, mb: 0.5 }}
      />
    ));
  };


  const handleCopyUrl = async (url: string, type: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(`${type}-${url}`);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Ingest Endpoints
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadEndpoints}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateEndpoint}
          >
            Create Endpoint
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>URLs</TableCell>
                <TableCell>Cost per Minute</TableCell>
                <TableCell>Capabilities</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : endpoints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No ingest endpoints found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                endpoints.map((endpoint) => (
                  <TableRow key={endpoint.id} hover>
                    <TableCell>{endpoint.id}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {endpoint.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {endpoint.urls && endpoint.urls.length > 0 ? (
                          endpoint.urls.map((url, index) => (
                            <Box
                              key={index}
                              sx={{ display: "flex", alignItems: "center", gap: 1 }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                              >
                                {url}
                              </Typography>
                              <Tooltip
                                title={
                                  copySuccess === `URL-${url}`
                                    ? "Copied!"
                                    : "Copy URL"
                                }
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopyUrl(url, "URL")}
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No URLs available
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <MilliSatsDisplay milliSats={endpoint.cost} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ maxWidth: 300 }}>
                        {formatCapabilities(endpoint.capabilities)}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleEditEndpoint(endpoint)}
                            title="Edit endpoint"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteEndpoint(endpoint.id)}
                            disabled={deleteLoading === endpoint.id}
                            title="Delete endpoint"
                          >
                            {deleteLoading === endpoint.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DeleteIcon />
                            )}
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={limit}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <IngestEndpointModal
        open={isModalOpen}
        endpoint={editingEndpoint}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </Box>
  );
};
