import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const headers = { Authorization: `Bearer ${user.token}` };

  useEffect(() => { fetchListings(); }, []);

  async function fetchListings() {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/listings`, { headers });
      setListings(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(lid, name) {
    if (!confirm(`Remove listing "${name}"?`)) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/listings/${lid}`, { headers });
      setListings((prev) =>
        prev.map((l) => l.LID === lid ? { ...l, Status: "removed" } : l)
      );
    } catch (err) {
      setError(err.response?.data?.error || "Remove failed");
    }
  }

  const filtered = filter === "all" ? listings : listings.filter((l) => l.Status === filter);
  const counts = listings.reduce((acc, l) => { acc[l.Status] = (acc[l.Status] || 0) + 1; return acc; }, {});

  return (
    <div className="page">
      <div className="admin-page-header">
        <h1>Listing Management</h1>
        <span className="admin-count">{listings.length} total listings</span>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="offer-filters">
        {["all", "active", "sold", "removed"].map((s) => (
          <button
            key={s}
            className={`filter-btn ${filter === s ? "active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({s === "all" ? listings.length : counts[s] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>LID</th>
                <th>Name</th>
                <th>Seller</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="report-empty">No listings found.</td></tr>
              ) : filtered.map((l) => (
                <tr key={l.LID}>
                  <td className="admin-muted">{l.LID}</td>
                  <td>
                    <Link to={`/listing/${l.LID}`} className="admin-listing-link">
                      {l.Images && <img src={l.Images} alt="" className="admin-thumb" />}
                      {l.Name}
                    </Link>
                  </td>
                  <td className="report-bold">{l.SellerName}</td>
                  <td className="admin-muted">{l.Category}</td>
                  <td className="report-money">${parseFloat(l.Price).toFixed(2)}</td>
                  <td><span className={`status-badge status-${l.Status}`}>{l.Status}</span></td>
                  <td>
                    {l.Status === "active" && (
                      <button className="btn-danger" onClick={() => handleRemove(l.LID, l.Name)}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
