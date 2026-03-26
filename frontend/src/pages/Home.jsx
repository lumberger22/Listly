import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const CATEGORIES = [
  "Electronics", "Clothing & Apparel", "Furniture", "Books & Media",
  "Sports & Outdoors", "Toys & Games", "Home & Garden", "Vehicles & Parts",
  "Collectibles & Art", "Musical Instruments", "Health & Beauty",
  "Pet Supplies", "Tools & Hardware", "Other",
];

export default function Home() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchListings() {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await axios.get("http://localhost:3001/listings", { params });
      setListings(res.data);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchListings();
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    fetchListings();
  }

  return (
    <div className="page">
      <div className="browse-header">
        <h1>Browse Listings</h1>
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : listings.length === 0 ? (
        <p className="empty">No listings found.</p>
      ) : (
        <div className="listing-grid">
          {listings.map((item) => (
            <Link to={`/listing/${item.LID}`} key={item.LID} className="listing-card">
              {item.Images && (
                <img src={item.Images} alt={item.Name} className="listing-img" />
              )}
              <div className="listing-info">
                <h3>{item.Name}</h3>
                <p className="listing-price">${parseFloat(item.Price).toFixed(2)}</p>
                <p className="listing-category">{item.Category}</p>
                <p className="listing-seller">by {item.SellerName}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
