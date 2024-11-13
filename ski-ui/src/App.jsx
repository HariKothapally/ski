// src/App.jsx
import { Link } from "react-router-dom";

const App = () => {
  return (
    <div>
      <h1>App</h1>
      <Link to="/register">Register</Link>
      <Link to="/login">Login</Link>
    </div>
  );
};

export default App;
