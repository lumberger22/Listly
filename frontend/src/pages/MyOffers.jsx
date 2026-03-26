import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STATUS_ORDER = ["pending", "countered", "accepted", "rejected"];
const EDITABLE = ["pending"];
const WITHDRAWABLE = ["pending", "countered"];

export default function MyOffers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editingOid, setEditingOid] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [actionError, setActionError] = useState({});

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchOffers();
  }, [user]);

  async function fetchOffers() {
    try {
      const res = await axios.get("http://localhost:3001/offers/mine", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setOffers(res.data);
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(offer) {
    setEditingOid(offer.OID);
    setEditPrice(String(parseFloat(offer.Price).toFixed(2)));
    setActionError({});
  }

  function cancelEdit() {
    setEditingOid(null);
    setEditPrice("");
  }

  async function saveEdit(oid) {
    setActionError({});
    try {
      await axios.patch(`http://localhost:3001/offers/${oid}`, { price: editPrice }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setEditingOid(null);
      fetchOffers();
    } catch (err) {
      setActionError({ [oid]: err.response?.data?.error || "Failed to update offer" });
    }
  }

  async function withdraw(oid) {
    setActionError({});
    try {
      await axios.delete(`http://localhost:3001/offers/${oid}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setOffers((prev) => prev.filter((o) => o.OID !== oid));
    } catch (err) {
      setActionError({ [oid]: err.response?.data?.error || "Failed to withdraw offer" });
    }
  }

  const filtered = filter === "all" ? offers : offers.filter((o) => o.Status === filter);

  const counts = offers.reduce((acc, o) => {
    acc[o.Status] = (acc[o.Status] || 0) + 1;
    return acc;
  }, {});

  if (!user) return null;

  return (
    <div className="page">
      <h1>My Offers</h1>

      <div className="offer-filters">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({offers.length})
        </button>
        {STATUS_ORDER.filter((s) => counts[s]).map((s) => (
          <button
            key={s}
            className={`filter-btn ${filter === s ? "active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="empty">
          {filter === "all"
            ? "You haven't made any offers yet. Browse listings to get started."
            : `No ${filter} offers.`}
        </p>
      ) : (
        <div className="my-offers-list">
          {filtered.map((offer) => (
            <div key={offer.OID} className="my-offer-card">
              <Link to={`/listing/${offer.LID}`} className="my-offer-img-wrap">
                {offer.ListingImages ? (
                  <img src={offer.ListingImages} alt={offer.ListingName} />
                ) : (
                  <div className="my-offer-no-img">No image</div>
                )}
              </Link>

              <div className="my-offer-info">
                <Link to={`/listing/${offer.LID}`}>
                  <h3>{offer.ListingName}</h3>
                </Link>
                <p className="my-offer-seller">Seller: {offer.SellerName}</p>
                <p className="my-offer-listing-price">
                  Listed at <strong>${parseFloat(offer.ListingPrice).toFixed(2)}</strong>
                </p>
              </div>

              <div className="my-offer-right">
                {editingOid === offer.OID ? (
                  <div className="my-offer-edit">
                    <span className="my-offer-edit-label">New price ($)</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="my-offer-edit-input"
                      autoFocus
                    />
                    <div className="my-offer-edit-btns">
                      <button className="btn-primary" onClick={() => saveEdit(offer.OID)}>Save</button>
                      <button className="btn-ghost" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="my-offer-price">${parseFloat(offer.Price).toFixed(2)}</p>
                    <p className="my-offer-label">your offer</p>
                    <span className={`status-badge status-${offer.Status}`}>{offer.Status}</span>
                    {offer.Status === "countered" && (
                      <p className="my-offer-counter-note">Seller countered — check the listing</p>
                    )}
                  </>
                )}

                {actionError[offer.OID] && (
                  <p className="error" style={{ marginTop: "0.4rem" }}>{actionError[offer.OID]}</p>
                )}

                {editingOid !== offer.OID && (
                  <div className="my-offer-actions">
                    {EDITABLE.includes(offer.Status) && (
                      <button className="btn-ghost" onClick={() => startEdit(offer)}>Edit</button>
                    )}
                    {WITHDRAWABLE.includes(offer.Status) && (
                      <button className="btn-danger" onClick={() => withdraw(offer.OID)}>Withdraw</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
