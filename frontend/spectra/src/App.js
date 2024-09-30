import React, { useState, useEffect, useRef } from 'react'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { io } from 'socket.io-client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/login.component'
import Home from './components/home.component'
import PrivateRoute from './components/private.route'

function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setsocketConnection] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState("Home");
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    console.log(`Joining room: ${currentRoom}`);
    socket?.emit("join", currentRoom);
  }, [currentRoom]);

  useEffect(() => {

    // if (onceRef.current) {
    //   return;
    // }

    //onceRef.current = true;
    if (socketRef.current) return;

    console.log("Attempting to establish WebSocket connection...");

    // Make the auth request as before
    fetch('http://127.0.0.1:3001/', {
      method: 'GET',
      credentials: 'include',
    })
      .then((response) => {
        if (response.ok) {
          return response.text();
        } else {
          setIsAuthenticated(false);
          setLoading(false);
        }
      })
      .then((userId) => {
        if (userId) {
          setUserId(userId);
          localStorage.setItem('userId', userId); // Save to localStorage
          setIsAuthenticated(true);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        setLoading(false);
      });

      //socketConnection init
      const socketConnection = io('ws://127.0.0.1:3001', {
        transports: ['websocket'], // Force WebSocket connection (in case it's using polling)
        withCredentials: true 
      });

      //setsocketConnection(socketConnection);
      socketRef.current = socketConnection;

      socketRef.current.on("connect", () => {
        console.log("Connected to socketConnection server");
        console.log("joining room", currentRoom);
        socketRef.current.emit("join", currentRoom);
      });

      socketRef.current.on("message", (msg) => {
        console.log("Message received", msg);
        msg.date = new Date(msg.date.split('.')[0] + 'Z');
        setMessages((prevMessages) => [...prevMessages, msg]);
      });
    
      socketRef.current.on("messages", (msgs) => {
        console.log("Messages received", msgs);
        let parsedMessages = msgs.messages.map((msg) => {
          msg.date = new Date(msg.date);
          return msg;
        });
        setMessages(parsedMessages);
      });

      socketRef.current.on("connect_error", (err) => {
        console.error("Connection error:", err);
      });

      return () => {
        if (socketRef.current.readyState === 1) { // the state has to be ready to be closed 
          socketRef.current.close();
      }
        //socketConnection.disconnect();
      };

  }, []);

  const sendMessage = (messageText) => {
    const newMessage = {
      content: messageText.trim(),
      room: currentRoom,
      user_id: userId,
      time: new Date().toISOString(),
    };

    if (socketRef.current) {
      console.log(`Sending message to room: ${currentRoom}`); 
      socketRef.current.emit("message", newMessage); 
    }
  };

  if (loading) {
    // Show a loading spinner or something while checking authentication
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route exact path="/"
            element={
              <Login setIsAuthenticated={setIsAuthenticated} />
            }
          />
          <Route
            path="/sign-in"
            element={
              <Login setIsAuthenticated={setIsAuthenticated} />
            }
          />
          <Route
            path="/home"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated} >
                <Home
                  userId={userId}
                  socket={socketRef.current}
                  setMessages={setMessages}
                  messages={messages}  // Pass messages from App.js
                  sendMessage={sendMessage}  // Pass sendMessage function
                  currentRoom={currentRoom}
                  setCurrentRoom={setCurrentRoom}  // Pass setCurrentRoom function
                />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/home' : '/sign-in'} />} />
        </Routes>

      </div>
    </Router>
  )
}
export default App