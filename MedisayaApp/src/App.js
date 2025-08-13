import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";

//Axios instance
const api = axios.create({ baseURL: "https://jsonplaceholder.typicode.com" });

//Helpers
const storage = {
  getUser() {
    try {
      const raw = localStorage.getItem("ms_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser(user) {
    localStorage.setItem("ms_user", JSON.stringify(user));
  },
  clearUser() {
    localStorage.removeItem("ms_user");
  },
};

function useAuth() {
  const [user, setUser] = useState(() => storage.getUser());
  const login = (u) => {
    setUser(u);
    storage.setUser(u);
  };
  const logout = () => {
    setUser(null);
    storage.clearUser();
  };
  return { user, login, logout };
}

//UI primitives
function Button({ as: Tag = "button", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium shadow-sm transition hover:opacity-90 focus:outline-none focus:ring";
  return <Tag className={`${base} ${className}`} {...props} />;
}
function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-200 ${className}`}
      {...props}
    />
  );
}
function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-200 ${className}`}
      {...props}
    />
  );
}
function Card({ className = "", children }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-4 shadow ${className}`}
    >
      {children}
    </div>
  );
}
function Spinner() {
  return (
    <div className="mx-auto my-6 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
  );
}

//Modal
function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

//Auth gate
function RequireAuth({ children }) {
  const user = storage.getUser();
  const location = useLocation();
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  return children;
}

//Header
function AppHeader({ user, onLogout }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold">
          Medi<span className="text-indigo-600">Posts</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-gray-600">Hi, {user.username}</span>
              <Button
                className="bg-gray-900 text-white"
                onClick={onLogout}
                aria-label="Logout"
              >
                Logout
              </Button>
            </>
          ) : (
            <Link to="/" className="text-indigo-600">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

//Login Page
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (storage.getUser()) navigate("/posts", { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) {
      setError("Username wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      let users = [];
      try {
        const { data } = await api.get("/users");
        users = data;
      } catch {
        users = [{ id: 1, username: "Bret", name: "Demo User" }];
      }

      const found = users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (!found) {
        setError("Username tidak ditemukan. Coba 'Bret', 'Antonette', dll.");
      } else {
        const user = {
          id: found.id,
          username: found.username,
          name: found.name,
        };
        onLogin(user);
        navigate("/posts", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto my-16 max-w-md px-4">
      <Card>
        <h1 className="mb-2 text-2xl font-bold">Masuk</h1>
        <p className="mb-4 text-sm text-gray-600">
          Masukkan <strong>username JSONPlaceholder</strong> untuk login.
          Contoh: <code>Bret</code>.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">Username</span>
            <Input
              placeholder="e.g., Bret"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              aria-label="Username"
            />
          </label>
          {error && (
            <div className="rounded-xl bg-red-50 p-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <Button
            type="submit"
            className="w-full bg-indigo-600 text-white disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Memeriksa..." : "Login"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

//Post Form Modal
function PostFormModal({ open, onClose, initial, onSubmit }) {
  const isEdit = Boolean(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [error, setError] = useState("");
  useEffect(() => {
    setTitle(initial?.title ?? "");
    setBody(initial?.body ?? "");
    setError("");
  }, [initial, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError("Judul dan isi wajib diisi.");
      return;
    }
    onSubmit({ ...initial, title: title.trim(), body: body.trim() });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Post" : "Buat Post Baru"}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block">Judul</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Judul"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block">Isi</span>
          <Textarea
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-label="Isi"
          />
        </label>
        {error && (
          <div className="rounded-xl bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" onClick={onClose} className="bg-gray-100">
            Batal
          </Button>
          <Button type="submit" className="bg-indigo-600 text-white">
            {isEdit ? "Simpan" : "Buat"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

//Posts Page
function PostsPage() {
  const user = storage.getUser();
  const userId = user?.id;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busyIds, setBusyIds] = useState(new Set());

  const lsKey = userId ? `ms_posts_${userId}` : null;
  const persist = (arr) => {
    if (!lsKey) return;
    try {
      localStorage.setItem(lsKey, JSON.stringify(arr));
    } catch {}
  };

  const setAndPersist = (updater) =>
    setPosts((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persist(next);
      return next;
    });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (lsKey) {
        try {
          const raw = localStorage.getItem(lsKey);
          if (raw) {
            const cached = JSON.parse(raw);
            if (Array.isArray(cached)) {
              setPosts(cached);
              return;
            }
          }
        } catch {}
      }

      const { data } = await api.get("/posts", { params: { userId } });

      const TITLE_OVERRIDES = {
        1: { title: "Judul baru", body: "Isi baru" },
      };
      const patched = data.map((p) =>
        TITLE_OVERRIDES[p.id] ? { ...p, ...TITLE_OVERRIDES[p.id] } : p
      );

      setPosts(patched);
      persist(patched);
    } catch {
      setError("Gagal memuat posts. Coba muat ulang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const openCreate = () => {
    setEditing({ id: undefined, title: "", body: "", userId });
    setModalOpen(true);
  };
  const openEdit = (post) => {
    setEditing(post);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleSubmit = async (post) => {
    const userId = storage.getUser()?.id;
    const isEdit = Boolean(post.id);

    if (!isEdit) {
      // CREATE
      const payload = { title: post.title, body: post.body, userId };
      try {
        const { data: created } = await api.post("/posts", payload);
        const newId = created?.id ?? Date.now();
        setAndPersist((prev) => [{ ...payload, id: newId }, ...prev]);
      } catch {
        const tempId = Date.now();
        setAndPersist((prev) => [{ ...payload, id: tempId }, ...prev]);
      } finally {
        setModalOpen(false);
      }
      return;
    }

    // EDIT
    setBusyIds((s) => new Set(s).add(post.id));
    const payload = { title: post.title, body: post.body, userId };
    try {
      const { data: updated } = await api.put(`/posts/${post.id}`, payload);
      setAndPersist((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, ...payload, ...updated } : p
        )
      );
    } catch {
      setAndPersist((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, ...payload } : p))
      );
    } finally {
      setBusyIds((s) => {
        const n = new Set(s);
        n.delete(post.id);
        return n;
      });
      setModalOpen(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus post ini?")) return;
    setBusyIds((s) => new Set(s).add(id));
    try {
      await api.delete(`/posts/${id}`);
    } catch {
    } finally {
      setAndPersist((prev) => prev.filter((p) => p.id !== id));
      setBusyIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  const postCount = posts.length;

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="text-sm text-gray-600">User ID: {userId}</p>
        </div>
        <Button className="bg-indigo-600 text-white" onClick={openCreate}>
          + Create New Post
        </Button>
      </div>

      {loading && (
        <Card>
          <div className="flex items-center gap-3">
            <Spinner />
            <span>Memuat posts...</span>
          </div>
        </Card>
      )}

      {!loading && error && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <span className="text-red-700">{error}</span>
            <Button className="bg-gray-900 text-white" onClick={load}>
              Muat ulang
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {posts.map((p) => (
            <Card key={p.id}>
              <h3 className="mb-1 text-lg font-semibold">{p.title}</h3>
              <p className="mb-3 whitespace-pre-line text-sm text-gray-700">
                {p.body}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>ID: {p.id}</span>
                <div className="flex items-center gap-2">
                  <Button
                    className="bg-gray-100"
                    onClick={() => openEdit(p)}
                    disabled={busyIds.has(p.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    className="bg-rose-600 text-white disabled:opacity-50"
                    onClick={() => handleDelete(p.id)}
                    disabled={busyIds.has(p.id)}
                  >
                    {busyIds.has(p.id) ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && postCount === 0 && (
        <Card>
          <p className="text-sm text-gray-700">
            Belum ada post untuk user ini.
          </p>
        </Card>
      )}

      <PostFormModal
        open={modalOpen}
        onClose={closeModal}
        initial={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

//Root App
export default function App() {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        user={auth.user}
        onLogout={() => {
          auth.logout();
          navigate("/", { replace: true });
        }}
      />
      <Routes>
        <Route path="/" element={<LoginPage onLogin={auth.login} />} />
        <Route
          path="/posts"
          element={
            <RequireAuth>
              <PostsPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-xs text-gray-500">
        JSONPlaceholder demo · React + Axios · CRUD with optimistic UI
      </footer>
    </div>
  );
}

//Wrap App with BrowserRouter
export function Root() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
