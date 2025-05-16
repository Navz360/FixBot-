import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./components/Home";
import About from "./components/About";
import Chatbot from "./components/Chatbot";
import Download from "./components/Download";
import "./App.css";

function App() {
  const [isMobile, setIsMobile] = useState(false);

  return (
    <Router>
      <nav className="navbar">
        <h2 className="logo">🤖 FIXBOT</h2>
        <div className="nav-toggle" onClick={() => setIsMobile(!isMobile)}>
          ☰
        </div>
        <ul className={isMobile ? "nav-links-mobile" : "nav-links"} onClick={() => setIsMobile(false)}>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/bot">Use the Bot</Link></li>
          <li><Link to="/download">Download</Link></li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/bot" element={<Chatbot />} />
        <Route path="/download" element={<Download />} />
      </Routes>
    </Router>
  );
}

export default App;
