// frontend/src/Profile.jsx
import { useContext } from "react";
import { AuthContext } from "./AuthProvider";
import { Container, Paper, Typography, Avatar, Box, Grid } from "@mui/material";
import Header from "./Header";

const Profile = () => {
  const { user } = useContext(AuthContext);

  return (
    <>
      <Header />
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              src={user?.photoURL}
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
            />
            <Typography variant="h4" gutterBottom>
              {user?.displayName || 'User'}
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Email:</strong> {user?.email}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Account created:</strong> {user?.metadata.creationTime}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Last sign in:</strong> {user?.metadata.lastSignInTime}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Email verified:</strong> {user?.emailVerified ? 'Yes' : 'No'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>User ID:</strong> {user?.uid}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Provider:</strong> {user?.providerData[0]?.providerId}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </>
  );
};

export default Profile;