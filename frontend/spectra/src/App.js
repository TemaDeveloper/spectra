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
  const [currentRoom, setCurrentRoom] = useState("Home");
  const [messages, setMessages] = useState([]);
  const [keyPair, setKeyPair] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    console.log(`Joining room: ${currentRoom}`);
    socket?.emit("join", currentRoom);
  }, [currentRoom]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {

    // async function initializeKeys() {
    //   const keys = await generateKeys();
    //   setKeyPair(keys);
    //   // Store public key for sharing with other users
    //   const publicKey = await window.crypto.subtle.exportKey("spki", keys.publicKey);
    //   localStorage.setItem('publicKey', publicKey);  // Save public key in local storage
    //   // Send public key to the server for sharing with other users
    // }

    // initializeKeys();
    
    if (socketRef.current) return;

    console.log("Attempting to establish WebSocket connection...");


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

      socketRef.current.on("message", async (msg) => {
        console.log("Message received", msg);
        msg.date = new Date(msg.date.split('.')[0] + 'Z');

        //msg.content = decryptedMessage;
        setMessages((prevMessages) => [...prevMessages, msg]);
        // if (keyPair && keyPair.privateKey) {
        //   const decryptedMessage = await decryptMessage(keyPair.privateKey, msg.content);
        //   msg.content = decryptedMessage;
        //   setMessages((prevMessages) => [...prevMessages, msg]);
        // }
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

  }, [keyPair]);

  const sendMessage = async (messageText) => {
    //const recipientPublicKey = await fetchRecipientPublicKey();  // Fetch recipient public key from backend
    //const encryptedMessage = await encryptMessage(recipientPublicKey, messageText.trim());
    const newMessage = {
      //content: encryptedMessage,
      content: messageText,
      room: currentRoom,
      sender_id: userId,
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