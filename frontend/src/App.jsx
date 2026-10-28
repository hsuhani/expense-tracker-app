
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5006";

export default function App() {
  const [mode, setMode] = useState("login");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
  });
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(url, options = {}) {
    const response = await fetch(`${API}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  }

  async function loadExpenses() {
    try {
      const data = await request("/expenses");
      setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    if (token) loadExpenses();
  }, [token]);

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const endpoint = mode === "login" ? "/login" : "/register";
      const body =
        mode === "login"
          ? { email: authForm.email, password: authForm.password }
          : authForm;

      const data = await request(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (mode === "register") {
        setMessage("Account created! Please log in.");
        setMode("login");
        setAuthForm({ name: "", email: authForm.email, password: "" });
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setMessage("");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function addExpense(event) {
    event.preventDefault();
    setMessage("");

    try {
      await request("/expense", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });
      setForm({ title: "", amount: "", category: "Food" });
      await loadExpenses();
      setMessage("Expense added successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteExpense(id) {
    if (!window.confirm("Delete this expense?")) return;

    try {
      await request(`/expense/${id}`, { method: "DELETE" });
      setExpenses((current) =>
        current.filter((expense) => expense._id !== id)
      );
      setMessage("Expense deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    setExpenses([]);
    setMode("login");
    setMessage("");
  }

  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  if (!token) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand-icon">₹</div>
          <p className="eyebrow">PERSONAL FINANCE</p>
          <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="muted">
            {mode === "login"
              ? "Sign in to manage your money."
              : "Start tracking your spending today."}
          </p>

          <form onSubmit={handleAuth}>
            {mode === "register" && (
              <label>
                Full name
                <input
                  required
                  value={authForm.name}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, name: e.target.value })
                  }
                  placeholder="Your name"
                />
              </label>
            )}

            <label>
              Email address
              <input
                required
                type="email"
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm({ ...authForm, email: e.target.value })
                }
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password
              <input
                required
                type="password"
                minLength={6}
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm({ ...authForm, password: e.target.value })
                }
                placeholder="Enter password"
              />
            </label>

            <button className="primary-btn" disabled={busy}>
              {busy
                ? "Please wait..."
                : mode === "login"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          {message && <p className="message">{message}</p>}

          <p className="switch-text">
            {mode === "login" ? "New here?" : "Already have an account?"}{" "}
            <button
              className="text-btn"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setMessage("");
              }}
            >
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon small">₹</div>
          <span>SpendWise</span>
        </div>
        <div className="profile">
          <span>{user?.name || user?.email || "My account"}</span>
          <button className="logout-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <section className="welcome">
        <div>
          <p className="eyebrow">YOUR FINANCIAL OVERVIEW</p>
          <h1>Expense dashboard</h1>
          <p className="muted">Keep track of where your money goes.</p>
        </div>
        <span className="date-chip">
          {new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </section>

      {message && <p className="message dashboard-message">{message}</p>}

      <section className="stats">
        <article className="stat-card">
          <span className="stat-label">Total spending</span>
          <h2>₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</h2>
          <p>Across all recorded expenses</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">Total transactions</span>
          <h2>{expenses.length}</h2>
          <p>Expenses recorded</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">Categories</span>
          <h2>{new Set(expenses.map((e) => e.category)).size}</h2>
          <p>Different spending categories</p>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <h2>Add an expense</h2>
          <p className="muted">Enter the details below.</p>

          <form onSubmit={addExpense} className="expense-form">
            <label>
              Expense title
              <input
                required
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="e.g. Grocery shopping"
              />
            </label>

            <label>
              Amount (₹)
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: e.target.value })
                }
                placeholder="0.00"
              />
            </label>

            <label>
              Category
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                <option>Food</option>
                <option>Transport</option>
                <option>Shopping</option>
                <option>Bills</option>
                <option>Health</option>
                <option>Education</option>
                <option>Entertainment</option>
                <option>Other</option>
              </select>
            </label>

            <button className="primary-btn">+ Add expense</button>
          </form>
        </article>

        <article className="panel">
          <div className="list-heading">
            <div>
              <h2>Recent expenses</h2>
              <p className="muted">Your latest transactions</p>
            </div>
            <span className="count">{expenses.length}</span>
          </div>

          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">₹</div>
              <h3>No expenses yet</h3>
              <p>Add your first expense using the form.</p>
            </div>
          ) : (
            <div className="expense-list">
              {[...expenses].reverse().map((expense) => (
                <div className="expense-row" key={expense._id}>
                  <div className="expense-symbol">
                    {expense.category?.charAt(0)?.toUpperCase() || "E"}
                  </div>
                  <div className="expense-info">
                    <strong>{expense.title}</strong>
                    <span>{expense.category}</span>
                  </div>
                  <div className="expense-right">
                    <strong>
                      −₹
                      {Number(expense.amount).toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                    <button
                      className="delete-btn"
                      onClick={() => deleteExpense(expense._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
      <footer>SpendWise · Manage your money with clarity.</footer>
    </main>
  );
}
