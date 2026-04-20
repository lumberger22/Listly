import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const EMPTY_FORM = { username: "", email: "", password: "", address: "", is_admin: false };

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  const headers = { Authorization: `Bearer ${user.token}` };

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const res = await axios.get("http://localhost:3001/admin/users", { headers });
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(uid, username) {
    if (!confirm(`Permanently delete account "${username}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`http://localhost:3001/admin/users/${uid}`, { headers });
      setUsers((prev) => prev.filter((u) => u.UID !== uid));
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed");
    }
  }

  async function handleToggleAdmin(uid, currentlyAdmin) {
    if (uid === user.uid) return alert("You cannot change your own admin status.");
    const action = currentlyAdmin ? "remove admin from" : "make admin";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await axios.put(`http://localhost:3001/admin/users/${uid}/toggle-admin`, {}, { headers });
      setUsers((prev) =>
        prev.map((u) => u.UID === uid ? { ...u, is_admin: u.is_admin ? 0 : 1 } : u)
      );
    } catch (err) {
      setError(err.response?.data?.error || "Action failed");
    }
  }

  function openModal() {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    setCreating(true);
    try {
      const res = await axios.post("http://localhost:3001/admin/users", form, { headers });
      // Refresh the full list to get listing/transaction counts populated correctly
      const listRes = await axios.get("http://localhost:3001/admin/users", { headers });
      setUsers(listRes.data);
      closeModal();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="page">
      <div className="admin-page-header">
        <h1>User Management</h1>
        <span className="admin-count">{users.length} users</span>
        <button className="btn-primary" style={{ marginLeft: "auto" }} onClick={openModal}>
          + Create User
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>UID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Address</th>
                <th>Listings</th>
                <th>Transactions</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.UID}>
                  <td className="admin-muted">{u.UID}</td>
                  <td className="report-bold">
                    {u.Username}
                    {u.UID === user.uid && <span className="admin-you"> (you)</span>}
                  </td>
                  <td>{u.Email}</td>
                  <td className="admin-muted">{u.Address || "—"}</td>
                  <td>{u.listing_count}</td>
                  <td>{u.transaction_count}</td>
                  <td>
                    <span className={`status-badge ${u.is_admin ? "admin-badge-admin" : "admin-badge-user"}`}>
                      {u.is_admin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td>
                    {u.UID === user.uid ? (
                      <span className="admin-muted">—</span>
                    ) : (
                      <div className="admin-actions">
                        <button
                          className="btn-ghost"
                          onClick={() => handleToggleAdmin(u.UID, u.is_admin)}
                        >
                          {u.is_admin ? "Demote" : "Make Admin"}
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(u.UID, u.Username)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: "var(--heading)" }}>Create New User</h2>
            {formError && <p className="error">{formError}</p>}
            <form onSubmit={handleCreate}>
              <label>Username</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                autoFocus
              />
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <label>Address (optional)</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <div className="create-user-admin-row">
                <input
                  id="is_admin"
                  type="checkbox"
                  checked={form.is_admin}
                  onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
                  style={{ width: "auto" }}
                />
                <label htmlFor="is_admin" style={{ margin: 0 }}>Grant admin privileges</label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={creating}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
