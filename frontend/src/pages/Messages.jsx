import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeCid, setActiveCid] = useState(location.state?.activeCid || null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (activeCid) fetchMessages(activeCid);
  }, [activeCid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchConversations() {
    try {
      const res = await axios.get(`http://localhost:3001/conversations/${user.uid}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setConversations(res.data);
      if (!activeCid && res.data.length) setActiveCid(res.data[0].CID);
    } catch {
      setConversations([]);
    }
  }

  async function fetchMessages(cid) {
    try {
      const res = await axios.get(`http://localhost:3001/messages/${cid}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessages(res.data);
    } catch {
      setMessages([]);
    }
  }

  function getOtherUser(conv) {
    if (conv.UID_1 === user.uid) return { uid: conv.UID_2, name: conv.Username_2 };
    return { uid: conv.UID_1, name: conv.Username_1 };
  }

  function getReceiverUid() {
    const conv = conversations.find((c) => c.CID === activeCid);
    if (!conv) return null;
    return getOtherUser(conv).uid;
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMsg.trim()) return;
    const receiverUid = getReceiverUid();
    if (!receiverUid) return;
    try {
      await axios.post(
        "http://localhost:3001/messages",
        { cid: activeCid, uid_receiver: receiverUid, content: newMsg.trim() },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setNewMsg("");
      fetchMessages(activeCid);
    } catch {
      alert("Failed to send message");
    }
  }

  if (!user) return null;

  const activeConv = conversations.find((c) => c.CID === activeCid);

  return (
    <div className="messages-layout">
      <div className="conversations-panel">
        <h3>Conversations</h3>
        {conversations.length === 0 ? (
          <p className="empty">No conversations yet.</p>
        ) : (
          conversations.map((conv) => {
            const other = getOtherUser(conv);
            return (
              <div
                key={conv.CID}
                className={`conv-item ${conv.CID === activeCid ? "active" : ""}`}
                onClick={() => setActiveCid(conv.CID)}
              >
                <strong>{other.name}</strong>
                {conv.LastMessage && <p className="conv-preview">{conv.LastMessage}</p>}
              </div>
            );
          })
        )}
      </div>

      <div className="thread-panel">
        {!activeCid ? (
          <p className="empty center">Select a conversation</p>
        ) : (
          <>
            <div className="thread-header">
              <h3>{activeConv ? getOtherUser(activeConv).name : ""}</h3>
            </div>
            <div className="thread-messages">
              {messages.map((msg) => (
                <div
                  key={msg.MID}
                  className={`msg-bubble ${msg.UID_Sender === user.uid ? "sent" : "received"}`}
                >
                  <p>{msg.Content}</p>
                  <span className="msg-time">{new Date(msg.Time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form className="msg-input-row" onSubmit={sendMessage}>
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit" className="btn-primary">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
