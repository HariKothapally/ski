// src/Router.js
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import RegistrationForm from "../user/RegistrationForm";
import LoginForm from "../user/LoginForm";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/login" element={<LoginForm />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
