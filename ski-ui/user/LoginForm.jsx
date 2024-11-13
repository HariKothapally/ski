import { useState } from "react";

const loginUrl = import.meta.env.VITE_APIBASEURL + "api/users/login";

function LoginForm() {
  const [formData, setFormData] = useState({
    username: "", // Allow login with either username or email
    password: "",
  });
  const [loginStatus, setLoginStatus] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login status

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginStatus(null); // Clear any previous status messages

    try {
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json(); // Get login data (e.g., token, user info)
        setLoginStatus("Login successful!");
        setIsLoggedIn(true);

        // Store token in local storage, session, or however your app manages auth
        localStorage.setItem("authToken", data.token); // Example
        // Redirect to a protected page or update the UI as needed
        // ...
      } else {
        const errorData = await response.json(); // Improved error handling
        setLoginStatus(
          `Login failed: ${errorData.message || response.statusText}`,
        );
      }
    } catch (error) {
      console.error("Error during login:", error);
      setLoginStatus("An error occurred during login.");
    }
  };

  // Conditionally render content based on login status
  if (isLoggedIn) {
    return (
      <div>
        <p>You are logged in!</p>
        {/* ... other logged-in content ... */}
      </div>
    );
  }

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="usernameOrEmail">Username </label>
          <input
            type="text"
            id="username"
            name="username" // Updated name
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {loginStatus && <p>{loginStatus}</p>}
    </div>
  );
}

export default LoginForm;
