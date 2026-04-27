import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DeleteAccountModal({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setError("");
    setLoading(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/auth/account`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      logout();
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete account");
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Delete Account</h2>
        <p>Are you sure you want to permanently delete your account? This will remove all your listings, messages, and data. <strong>This cannot be undone.</strong></p>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Go Back
          </button>
          <button className="btn-danger" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Yes, Delete My Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
