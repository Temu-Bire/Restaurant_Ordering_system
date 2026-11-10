import ThemeSwitcher from "./components/ThemeSwitcher";

function App() {
  return (
    <main style={{ padding: "32px" }}>
      <h1>RestroGo</h1>

      <p>Restaurant Ordering & Management System</p>

      <div style={{ marginTop: "24px" }}>
        <ThemeSwitcher />
      </div>

      <section
        style={{
          marginTop: "32px",
          padding: "24px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
        }}
      >
        <h2>Welcome to RestroGo</h2>

        <p style={{ color: "var(--color-text-muted)" }}>
          Your restaurant management experience starts here.
        </p>

        <button
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            background: "var(--color-primary)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
          }}
        >
          Explore Menu
        </button>
      </section>
    </main>
  );
}

export default App;