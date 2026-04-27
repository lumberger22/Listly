import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DeleteAccountModal from "../components/DeleteAccountModal";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchData();
  }, [user]);

  async function fetchData() {
    const headers = { Authorization: `Bearer ${user.token}` };
    try {
      const [listRes, txRes, revRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/listings/mine`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/transactions/${user.uid}`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/reviews/${user.sid}`),
      ]);
      setListings(listRes.data);
      setTransactions(txRes.data);
      setReviews(revRes.data);
    } catch {
      // partial failures are ok
    }
  }

  function avgRating() {
    if (!reviews.length) return null;
    return (reviews.reduce((s, r) => s + r.Rating, 0) / reviews.length).toFixed(1);
  }

  if (!user) return null;

  return (
    <div className="page">
      <div className="profile-header">
        <div className="profile-avatar">{user.username[0].toUpperCase()}</div>
        <div>
          <h1>{user.username}</h1>
          <p>{user.email}</p>
          {user.address && <p>{user.address}</p>}
          {avgRating() && <p className="avg-rating">★ {avgRating()} ({reviews.length} reviews)</p>}
        </div>
      </div>

      <section className="profile-section">
        <h2>My Listings ({listings.length})</h2>
        {listings.length === 0 ? (
          <p className="empty">No listings yet. <Link to="/sell">Post one</Link>.</p>
        ) : (
          <div className="listing-grid small">
            {listings.slice(0, 6).map((l) => (
              <Link to={`/listing/${l.LID}`} key={l.LID} className="listing-card">
                {l.Images && <img src={l.Images} alt={l.Name} className="listing-img" />}
                <div className="listing-info">
                  <h3>{l.Name}</h3>
                  <p className="listing-price">${parseFloat(l.Price).toFixed(2)}</p>
                  <p className={`status-badge status-${l.Status}`}>{l.Status}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
        {listings.length > 6 && <Link to="/my-listings">View all listings</Link>}
      </section>

      <section className="profile-section">
        <h2>Transaction History ({transactions.length})</h2>
        {transactions.length === 0 ? (
          <p className="empty">No transactions yet.</p>
        ) : (
          <div className="tx-list">
            {transactions.map((tx) => (
              <div key={tx.TID} className="tx-row">
                <span className="tx-listing">{tx.ListingName}</span>
                <span>${parseFloat(tx.Price).toFixed(2)}</span>
                <span className={`status-badge status-${tx.Status}`}>{tx.Status}</span>
                <span className="tx-role">
                  {tx.BuyerName === user.username ? "Bought from " + tx.SellerName : "Sold to " + tx.BuyerName}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="profile-section">
        <h2>Reviews Received ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="empty">No reviews yet.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.ReviewID} className="review-card">
              <div className="review-top">
                <strong>{r.BuyerName}</strong>
                <span className="review-stars">{"★".repeat(r.Rating)}{"☆".repeat(5 - r.Rating)}</span>
              </div>
              {r.Content && <p>{r.Content}</p>}
              {r.ListingName && <p className="review-listing">re: {r.ListingName}</p>}
            </div>
          ))
        )}
      </section>

      <div className="danger-zone">
        <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </button>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
