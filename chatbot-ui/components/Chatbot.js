import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
// import "./App.css";
import "../App.css";


function App() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved
      ? JSON.parse(saved)
      : [{ sender: "bot", text: "Hello! How can I assist you with machine repairs?" }];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/chat", {
        message: input,
      });

      const botResponse = {
        sender: "bot",
        text: response.data.response,
      };

      setMessages([...newMessages, botResponse]);
    } catch (error) {
      setMessages([
        ...newMessages,
        { sender: "bot", text: "❌ Error: Unable to reach chatbot server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const clearChat = () => {
    setMessages([
      { sender: "bot", text: "Hello! How can I assist you with machine repairs?" },
    ]);
    localStorage.removeItem("chatHistory");
  };

  return (
    <div className={`chat-container ${darkMode ? "dark" : ""}`}>
     <button
  onClick={() => setDarkMode(!darkMode)}
  className="theme-toggle"
  title="Toggle Theme"
>
  {darkMode ? "🌞" : "🌙"}
</button>


      <div className="chat-box">
        <h2 className="chat-title">
          <h3>
            <b>🤖 FIXBOT</b>
          </h3>
        </h2>

        <div className="chat-messages" ref={chatContainerRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          {loading && <div className="message bot">Typing...</div>}
        </div>

        <div className="chat-input">
          <input
            type="text"
            placeholder="Ask about CNC machine repairs..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button onClick={sendMessage}>Send</button>
          <button onClick={clearChat} style={{ background: "#dc3545", marginLeft: "10px" }}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
