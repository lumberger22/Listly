import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  "Electronics", "Clothing & Apparel", "Furniture", "Books & Media",
  "Sports & Outdoors", "Toys & Games", "Home & Garden", "Vehicles & Parts",
  "Collectibles & Art", "Musical Instruments", "Health & Beauty",
  "Pet Supplies", "Tools & Hardware", "Other",
];

export default function MyListings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [offers, setOffers] = useState({}); // lid -> offers[]
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchMyListings();
  }, [user]);

  async function fetchMyListings() {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/listings/mine`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setListings(res.data);
    } catch {
      setListings([]);
    }
  }

  async function fetchOffers(lid) {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/offers/${lid}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setOffers((prev) => ({ ...prev, [lid]: res.data }));
    } catch {
      setOffers((prev) => ({ ...prev, [lid]: [] }));
    }
  }

  async function handleDelete(lid) {
    if (!confirm("Remove this listing?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/listings/${lid}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchMyListings();
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed");
    }
  }

  function startEdit(listing) {
    setEditingId(listing.LID);
    setEditForm({
      name: listing.Name,
      description: listing.Description || "",
      images: listing.Images || "",
      price: listing.Price,
      category: listing.Category,
    });
  }

  async function saveEdit(lid) {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/listings/${lid}`, editForm, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setEditingId(null);
      fetchMyListings();
    } catch (err) {
      setError(err.response?.data?.error || "Update failed");
    }
  }

  async function respondToOffer(oid, status) {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/offers/${oid}`, { status }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      // Refresh offers for all listings
      listings.forEach((l) => { if (offers[l.LID]) fetchOffers(l.LID); });
    } catch (err) {
      setError(err.response?.data?.error || "Action failed");
    }
  }

  if (!user) return null;

  return (
    <div className="page">
      <h1>My Listings</h1>
      {error && <p className="error">{error}</p>}
      <Link to="/sell" className="btn-primary" style={{ display: "inline-block", marginBottom: "1.5rem" }}>
        + New Listing
      </Link>

      {listings.length === 0 ? (
        <p className="empty">You haven't posted any listings yet.</p>
      ) : (
        listings.map((listing) => (
          <div key={listing.LID} className="my-listing-card">
            {editingId === listing.LID ? (
              <div className="edit-form">
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Name"
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  placeholder="Description"
                />
                <input
                  value={editForm.images}
                  onChange={(e) => setEditForm({ ...editForm, images: e.target.value })}
                  placeholder="Image URL"
                />
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  placeholder="Price"
                />
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="edit-actions">
                  <button className="btn-primary" onClick={() => saveEdit(listing.LID)}>Save</button>
                  <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="my-listing-header">
                {listing.Images && <img src={listing.Images} alt={listing.Name} className="my-listing-img" />}
                <div className="my-listing-info">
                  <Link to={`/listing/${listing.LID}`}><h3>{listing.Name}</h3></Link>
                  <p>${parseFloat(listing.Price).toFixed(2)} · {listing.Category}</p>
                  <p className={`status-badge status-${listing.Status}`}>{listing.Status}</p>
                </div>
                <div className="my-listing-actions">
                  {listing.Status === "active" && (
                    <button className="btn-secondary" onClick={() => startEdit(listing)}>Edit</button>
                  )}
                  {listing.Status === "active" && (
                    <button className="btn-danger" onClick={() => handleDelete(listing.LID)}>Remove</button>
                  )}
                  <button
                    className="btn-ghost"
                    onClick={() => offers[listing.LID] ? setOffers((p) => { const n = {...p}; delete n[listing.LID]; return n; }) : fetchOffers(listing.LID)}
                  >
                    {offers[listing.LID] ? "Hide Offers" : "View Offers"}
                  </button>
                </div>
              </div>
            )}

            {offers[listing.LID] && (
              <div className="offers-section">
                <h4>Offers ({offers[listing.LID].length})</h4>
                {offers[listing.LID].length === 0 ? (
                  <p className="empty">No offers yet.</p>
                ) : (
                  offers[listing.LID].map((offer) => (
                    <div key={offer.OID} className="offer-row">
                      <span><strong>{offer.BuyerName}</strong> offered ${parseFloat(offer.Price).toFixed(2)}</span>
                      <span className={`status-badge status-${offer.Status}`}>{offer.Status}</span>
                      {offer.Status === "pending" && (
                        <div className="offer-btns">
                          <button className="btn-primary" onClick={() => respondToOffer(offer.OID, "accepted")}>Accept</button>
                          <button className="btn-danger" onClick={() => respondToOffer(offer.OID, "rejected")}>Reject</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
