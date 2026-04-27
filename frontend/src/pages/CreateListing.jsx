import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  "Electronics", "Clothing & Apparel", "Furniture", "Books & Media",
  "Sports & Outdoors", "Toys & Games", "Home & Garden", "Vehicles & Parts",
  "Collectibles & Art", "Musical Instruments", "Health & Beauty",
  "Pet Supplies", "Tools & Hardware", "Other",
];

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", description: "", images: "", price: "", category: "Other",
  });
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/listings`, form, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      navigate(`/listing/${res.data.lid}`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create listing");
    }
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="page">
      <div className="form-card">
        <h2>Post a Listing</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>Item Name</label>
          <input name="name" value={form.name} onChange={handleChange} required />

          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} />

          <label>Image URL (optional)</label>
          <input name="images" value={form.images} onChange={handleChange} placeholder="https://..." />

          <label>Price ($)</label>
          <input name="price" type="number" step="0.01" min="0.01" value={form.price} onChange={handleChange} required />

          <label>Category</label>
          <select name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button type="submit" className="btn-primary">Post Listing</button>
        </form>
      </div>
    </div>
  );
}
