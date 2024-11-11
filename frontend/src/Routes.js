import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import App from './App';
import Login from './Login';
import SignUp from './SignUp';
import Profile from './Profile';
import PrivateRoute from './PrivateRoute';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<App />} />
      <Route path="login" element={<Login />} />
      <Route path="sign-up" element={<SignUp />} />
      <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
    </Route>
  </Routes>
);

export default AppRoutes;