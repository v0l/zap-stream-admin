import React from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
} from "@mui/material";
import { PeopleAlt, Security, TrendingUp, Settings } from "@mui/icons-material";

export const DashboardPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 3 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to the zap.stream admin panel
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <PeopleAlt color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Users</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                -
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total registered users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Security color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Admins</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                -
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active admin accounts
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Activity</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                -
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recent activity
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Settings color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">System</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                ✓
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System status
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Use the navigation menu to access user management, system settings,
            and other admin functions.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};
