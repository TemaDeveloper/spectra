import React, { useState, useEffect, useRef } from 'react';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { io } from 'socket.io-client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login.component';
import Home from './components/home.component';
import PrivateRoute from './components/private.route';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setsocketConnection] = useState(null);
  const [currentRoom, setCurrentRoom] = useState('Home');
  const [messages, setMessages] = useState([]);
  const [sessionKey, setSessionKey] = useState(null);
  const socketRef = useRef(null);
  const [keyPair, setKeyPair] = useState(null);

  //TODO: create the one session key for everybody because now it works for one user at a group 
  //TODO: check the socket = null error appeared in home.component

  // Convert ArrayBuffer to Base64
  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return window.btoa(binary);
  }

  function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) { // Ensure 'i < len', not 'i = len'
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Generate or retrieve session key
  useEffect(() => {
    if (!userId) return;

    const fetchSessionKey = async () => {
      try {
        // Step 1: Check if a session key exists on the backend
        const sessionKeyResponse = await fetch('http://127.0.0.1:3001/message/check-session-key', {
          method: 'GET',
          credentials: 'include',
        });

        if (sessionKeyResponse.ok) {
          const data = await sessionKeyResponse.json();
          if (data.session_key) {
            // Session key exists, import it
            const sessionKeyBase64 = data.session_key.trim();
            console.log('Session key received from backend:', sessionKeyBase64);
            console.log('Session key Base64 length:', sessionKeyBase64.length); // Should be ~44 characters

            const keyBuffer = base64ToArrayBuffer(sessionKeyBase64);
            console.log('Decoded key buffer length:', keyBuffer.byteLength); // Should be 32 bytes

            if (keyBuffer.byteLength !== 32) {
              console.error('Invalid key length:', keyBuffer.byteLength);
              return;
            }

            try {
              const importedKey = await window.crypto.subtle.importKey(
                'raw',
                keyBuffer,
                { name: 'AES-GCM' },
                true,
                ['encrypt', 'decrypt']
              );
              setSessionKey(importedKey);
              console.log('Session key imported successfully:', importedKey);
            } catch (importError) {
              console.error('Error importing session key:', importError);
            }
          } else {
            // Session key does not exist, generate and set it
            const newKey = await window.crypto.subtle.generateKey(
              {
                name: 'AES-GCM',
                length: 256,
              },
              true,
              ['encrypt', 'decrypt']
            );

            const exportedKey = await window.crypto.subtle.exportKey('raw', newKey);
            console.log('Exported key length:', exportedKey.byteLength); // Should be 32 bytes

            const keyBase64 = arrayBufferToBase64(exportedKey);
            console.log('Generated session key Base64:', keyBase64);
            console.log('Generated session key Base64 length:', keyBase64.length); // Should be ~44 characters

            // Step 2: Update the session key on the backend for the user
            await fetch(`http://127.0.0.1:3001/message/update-session-key/${userId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ session_key: keyBase64 }),
              credentials: 'include',
            });

            setSessionKey(newKey);
            console.log('Session key generated, sent to backend, and set:', newKey);
          }
        } else {
          console.error('Failed to fetch session key from backend');
        }
      } catch (error) {
        console.error('Error fetching session key:', error);
      }
    };

    fetchSessionKey();
  }, [userId]);



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
    if (!sessionKey || socketRef.current) return;

    console.log('Attempting to establish WebSocket connection...');

    const socketConnection = io('ws://127.0.0.1:3001', {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socketConnection;

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
      console.log('Joining room', currentRoom);
      socketRef.current.emit('join', currentRoom);
    });

    socketRef.current.on('message', async (msg) => {
      console.log('Message received', msg);

      if (!sessionKey) {
        console.error('Session key is not available.');
        return;
      }

      try {
        const decryptedContent = await decryptMessage(msg.content, msg.iv);
        msg.content = decryptedContent;
        msg.date = new Date(msg.time);
        setMessages((prevMessages) => [...prevMessages, msg]);
      } catch (error) {
        console.error('Error decrypting message:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
    });

    socketRef.current.on('messages', async (msgs) => {
      console.log('Messages received:', msgs);
      const decryptedMessages = await Promise.all(
        msgs.messages.map(async (msg) => {
          try {
            if (!msg.iv) {
              console.error('No IV provided for message:', msg);
              msg.content = '[Unable to decrypt message: Missing IV]';
              return msg;
            }
    
            // Decode IV and check length
            const ivBuffer = base64ToArrayBuffer(msg.iv);
            if (ivBuffer.byteLength !== 12) {
              console.error('Invalid IV length:', ivBuffer.byteLength);
              msg.content = '[Unable to decrypt message: Invalid IV length]';
              return msg;
            }
    
            // Log the message being decrypted
            console.log('Decrypting message:', msg.content);
            console.log('Using IV:', msg.iv);
    
            // Proceed with decryption
            const decryptedContent = await decryptMessage(msg.content, msg.iv);
    
            console.log('Decrypted content:', decryptedContent);
    
            // Update message content with decrypted text
            msg.content = decryptedContent;
            msg.date = new Date(msg.date || msg.sending_time || msg.time);
            return msg;
          } catch (error) {
            console.error('Error decrypting message:', error);
            msg.content = '[Error decrypting message]';
            return msg;
          }
        })
      );
      setMessages(decryptedMessages.filter((msg) => msg !== null));
    });
    


    socketRef.current.on('connect_error', (err) => {
      console.error('Connection error:', err);
    });

    return () => {
      if (socketRef.current.readyState === 1) {
        socketRef.current.close();
      }
    };
  }, [sessionKey, keyPair]);

  

  const encryptMessage = async (message) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      sessionKey,
      data
    );

    return {
      encryptedContent: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv),
    };
  };

  const decryptMessage = async (encryptedContentBase64, ivBase64) => {
    const encryptedContent = base64ToArrayBuffer(encryptedContentBase64);
    const iv = base64ToArrayBuffer(ivBase64);

    console.log('Starting decryption...');
    console.log('Session key:', sessionKey);
    console.log('Encrypted content (Base64):', encryptedContentBase64);
    console.log('IV (Base64):', ivBase64);
    console.log('Encrypted content length:', encryptedContent.byteLength);
    console.log('IV length:', iv.byteLength);

    if (!sessionKey) {
      console.error('Session key is not available.');
      throw new Error('Session key is not available.');
    }

    try {
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        sessionKey,
        encryptedContent
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Error during decryption:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      throw error;
    }
  };

  const sendMessage = async (messageText) => {
    if (!sessionKey) {
      console.error('Session key is not available.');
      return;
    }

    if (!socketRef.current) {
      console.error('Socket is not connected.');
      return;
    }

    const { encryptedContent, iv } = await encryptMessage(messageText.trim());

    const newMessage = {
      content: encryptedContent,
      iv: iv,
      room: currentRoom,
      sender_id: userId,
      time: new Date().toISOString(),
    };

    if (socketRef.current) {
      console.log(`Sending message to room: ${currentRoom}`);
      socketRef.current.emit('message', newMessage);
    }
  };

  useEffect(() => {
    if (!socketRef.current || !socketRef.current.connected) return;
    //setMessages([]);
    console.log(`Joining room: ${currentRoom}`);
    socketRef.current.emit("join", currentRoom);
  }, [currentRoom]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            exact
            path="/"
            element={<Login setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route
            path="/sign-in"
            element={<Login setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route
            path="/home"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Home
                  userId={userId}
                  socket={socketRef.current}
                  setMessages={setMessages}
                  messages={messages}
                  sendMessage={sendMessage}
                  currentRoom={currentRoom}
                  setCurrentRoom={setCurrentRoom}
                  decryptMessage={decryptMessage}
                />
              </PrivateRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? '/home' : '/sign-in'} />}
          />
        </Routes>
      </div>
    </Router>
  );
}
export default App;
