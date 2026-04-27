import { useState, useEffect } from "react";
import axios from "axios";

export default function Reports() {
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/reports/sellers`),
      axios.get(`${import.meta.env.VITE_API_URL}/reports/categories`),
    ])
      .then(([sRes, cRes]) => {
        setSellers(sRes.data);
        setCategories(cRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="page">
        <p className="loading">Loading reports...</p>
      </div>
    );

  return (
    <div className="page">
      <h1>Marketplace Reports</h1>

      {/* ── Report 1: Seller Performance ── */}
      <section className="report-section">
        <div className="report-header">
          <h2>Seller Performance Summary</h2>
          <p className="report-desc">
            Ranks all sellers by total revenue. Shows listing activity,
            completed sales, and average review rating to help buyers evaluate
            sellers and identify the most active contributors on the platform.
          </p>
        </div>

        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Active Listings</th>
                <th>Sold Listings</th>
                <th>Transactions</th>
                <th>Total Revenue</th>
                <th>Avg Rating</th>
                <th>Reviews</th>
              </tr>
            </thead>
            <tbody>
              {sellers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="report-empty">
                    No seller data yet.
                  </td>
                </tr>
              ) : (
                sellers.map((s) => (
                  <tr key={s.Username}>
                    <td className="report-bold">{s.Username}</td>
                    <td>{s.active_listings}</td>
                    <td>{s.sold_listings}</td>
                    <td>{s.total_transactions}</td>
                    <td className="report-money">
                      ${parseFloat(s.total_revenue).toFixed(2)}
                    </td>
                    <td>
                      {s.avg_rating ? (
                        <span className="report-rating">
                          {"★".repeat(Math.round(s.avg_rating))} {s.avg_rating}
                        </span>
                      ) : (
                        <span className="report-none">—</span>
                      )}
                    </td>
                    <td>{s.review_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Report 2: Category Market Overview ── */}
      <section className="report-section">
        <div className="report-header">
          <h2>Category Market Overview</h2>
          <p className="report-desc">
            Breaks down the marketplace by category. Shows supply (active vs.
            sold listings), price range, and buyer demand (total offers) so
            users can spot competitive categories and price their items
            appropriately.
          </p>
        </div>

        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Active</th>
                <th>Sold</th>
                <th>Avg Price</th>
                <th>Min Price</th>
                <th>Max Price</th>
                <th>Total Offers</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="report-empty">
                    No category data yet.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.Category}>
                    <td className="report-bold">{c.Category}</td>
                    <td>{c.active_listings}</td>
                    <td>{c.sold_listings}</td>
                    <td className="report-money">
                      {c.avg_price ? (
                        `$${parseFloat(c.avg_price).toFixed(2)}`
                      ) : (
                        <span className="report-none">—</span>
                      )}
                    </td>
                    <td className="report-money">
                      {c.min_price ? (
                        `$${parseFloat(c.min_price).toFixed(2)}`
                      ) : (
                        <span className="report-none">—</span>
                      )}
                    </td>
                    <td className="report-money">
                      {c.max_price ? (
                        `$${parseFloat(c.max_price).toFixed(2)}`
                      ) : (
                        <span className="report-none">—</span>
                      )}
                    </td>
                    <td>{c.total_offers}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
