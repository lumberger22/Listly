import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function getInitialTheme() {
  const saved = localStorage.getItem("listly_theme");
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("listly_theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === "light" ? "☾" : "☀"}
        </button>
        <Link to="/" className="navbar-brand">Listly</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Browse</Link>
        <Link to="/reports">Reports</Link>
        {user && <Link to="/my-listings">My Listings</Link>}
        {user && <Link to="/my-offers">My Offers</Link>}
        {user && <Link to="/messages">Messages</Link>}
        {user && <Link to="/profile">Profile</Link>}
        {user?.is_admin && (
          <div className="admin-dropdown">
            <span className="admin-dropdown-trigger">Admin ▾</span>
            <div className="admin-dropdown-menu">
              <Link to="/admin/users">User Management</Link>
              <Link to="/admin/listings">Listing Management</Link>
            </div>
          </div>
        )}
        {user ? (
          <button onClick={handleLogout} className="btn-link">Logout</button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
