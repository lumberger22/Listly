import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    axios
      .get("http://localhost:3001/status")
      .then((res) => setStatus(res.data.status))
      .catch(() => setStatus("Could not reach backend"));
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Listly</h1>
      <p>Database: {status}</p>
    </div>
  );
}

export default App;
