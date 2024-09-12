import React, { useState, useEffect } from 'react'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/login.component'
import Home from './components/home.component'
import PrivateRoute from './components/private.route'

function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true); // To handle loading state

  useEffect(() => {

    // Make the auth request as before
    fetch('http://127.0.0.1:3000/message/check-auth', {
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
                <Home userId={userId} />
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