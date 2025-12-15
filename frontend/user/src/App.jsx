import React, { useEffect, useState } from "react";

export default function App() {
  const [data, setData] = useState(null);
  const API = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    fetch(`${API}/api/health/`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ ok: false }));
  }, [API]);

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold">User App</h1>
      <pre className="mt-4 p-4 border rounded-lg bg-white">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
