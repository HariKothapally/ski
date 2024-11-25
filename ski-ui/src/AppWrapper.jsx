import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './hooks/useAuth.jsx';
import Router from './Router.jsx';

const AppWrapper = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Router />
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppWrapper;
