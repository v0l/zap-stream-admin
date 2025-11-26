import React, { useState } from "react";
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Article } from "@mui/icons-material";
import { AdminAPI } from "../services/api";
import { useLogin } from "../services/login";

interface PipelineLogButtonProps {
  streamId: string;
  size?: "small" | "medium" | "large";
}

export const PipelineLogButton: React.FC<PipelineLogButtonProps> = ({
  streamId,
  size = "small",
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pipelineLog, setPipelineLog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signer } = useLogin();

  const handleOpen = async () => {
    setDialogOpen(true);
    setLoading(true);
    setError(null);
    setPipelineLog(null);

    if (!signer) {
      setError("No signer available");
      setLoading(false);
      return;
    }

    try {
      const api = AdminAPI.current(signer);
      const log = await api.getPipelineLog(streamId);
      setPipelineLog(log);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch pipeline log",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setPipelineLog(null);
    setError(null);
  };

  return (
    <>
      <IconButton
        size={size}
        onClick={handleOpen}
        aria-label="pipeline log"
        title="View Pipeline Log"
      >
        <Article />
      </IconButton>

      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>Pipeline Log - {streamId}</DialogTitle>
        <DialogContent>
          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}
          {error && <Typography color="error">{error}</Typography>}
          {pipelineLog && (
            <Box
              component="pre"
              sx={{
                bgcolor: "background.default",
                p: 2,
                borderRadius: 1,
                overflowX: "auto",
                overflowY: "auto",
                maxHeight: 500,
                fontSize: "0.875rem",
                fontFamily: "monospace",
                whiteSpace: "pre",
              }}
            >
              {pipelineLog}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
