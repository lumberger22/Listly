import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMsg, setOfferMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:3001/listings/${id}`)
      .then((res) => setListing(res.data))
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleOffer(e) {
    e.preventDefault();
    if (!user) return navigate("/login");
    try {
      await axios.post(
        "http://localhost:3001/offers",
        { lid: listing.LID, price: offerPrice },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setOfferMsg("Offer submitted!");
      setOfferPrice("");
    } catch (err) {
      setOfferMsg(err.response?.data?.error || "Failed to submit offer");
    }
  }

  async function handleMessage() {
    if (!user) return navigate("/login");
    try {
      const res = await axios.post(
        "http://localhost:3001/conversations",
        { uid2: listing.SellerUID },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      navigate("/messages", { state: { activeCid: res.data.cid } });
    } catch {
      alert("Could not start conversation");
    }
  }

  if (loading) return <p className="loading">Loading...</p>;
  if (!listing) return <p className="empty">Listing not found.</p>;

  const isOwner = user && user.uid === listing.SellerUID;

  return (
    <div className="page listing-detail">
      {listing.Images && (
        <img src={listing.Images} alt={listing.Name} className="detail-img" />
      )}
      <div className="detail-info">
        <h1>{listing.Name}</h1>
        <p className="detail-price">${parseFloat(listing.Price).toFixed(2)}</p>
        <p className="detail-category">{listing.Category}</p>
        <p className="detail-desc">{listing.Description}</p>
        <p className="detail-seller">Sold by <strong>{listing.SellerName}</strong></p>
        <p className={`detail-status status-${listing.Status}`}>{listing.Status}</p>

        {!isOwner && listing.Status === "active" && (
          <div className="detail-actions">
            <form onSubmit={handleOffer} className="offer-form">
              <h3>Make an Offer</h3>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Your offer price"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary">Submit Offer</button>
              {offerMsg && <p className="offer-msg">{offerMsg}</p>}
            </form>
            <button onClick={handleMessage} className="btn-secondary">Message Seller</button>
          </div>
        )}

        {isOwner && (
          <p className="owner-note">This is your listing. Manage it in <a href="/my-listings">My Listings</a>.</p>
        )}
      </div>
    </div>
  );
}
