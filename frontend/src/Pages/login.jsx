import React, { useState } from "react";
import API from "../config/api";
import { storeAuth } from "../config/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Login({ onAuth }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await API.post("/user/login", { login, password });
      const { token, user } = res.data;

      storeAuth(user, token);
      if (onAuth) onAuth(user);

      navigate("/dashboard"); // ✅ LOGIN SUCCESS → DASHBOARD
    } catch (err) {
      setMsg(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* LEFT PANEL */}
        <div className="hidden md:flex flex-col justify-center bg-orange-500 text-white p-10">
          <h1 className="text-3xl font-bold mb-4">Welcome Back</h1>
          <p className="opacity-90">
            Login to access your dashboard, orders, and profile.
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6">
            <span className="text-orange-500">Login</span> Your Account
          </h2>

          {msg && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
              {msg}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">

            <input
              type="text"
              placeholder="Email Address"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-orange-500" />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-orange-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded font-semibold transition disabled:opacity-60"
            >
              {loading ? "Logging in..." : "SUBMIT"}
            </button>

            <div className="text-center text-sm text-gray-600">
              Don’t have an account?
              <Link
                to="/register"
                className="text-orange-500 ml-1 hover:underline"
              >
                Create Account
              </Link>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
