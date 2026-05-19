// app.jsx — top-level. Renders the merged HAUL app fullscreen.

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Haul />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
