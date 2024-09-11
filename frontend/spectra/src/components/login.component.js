import React, { Component } from 'react';
import logo from '../spectra_dark_logo.png';

export default class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
        };
    }

    encodeCredentials = (username, password) => {
        const credentials = `${username}:${password}`; // Concatenate username and password with colon
        return btoa(credentials); // Base64 encode the string
    }

    // Handle form submission
    handleSubmit = async (event) => {
        event.preventDefault();
        console.log('Form submitted');

        const { username, password } = this.state;
        const encodedCredentials = this.encodeCredentials(username, password);

        try {
            const response = await fetch('http://127.0.0.1:3000/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ credentials: encodedCredentials }),
            });

            if (response.ok) {
                const result = await response.text();
                console.log('Response:', result); // Log the result or do something with it

                // Example: Redirect to home or show a success message
                this.setState({ loginSuccess: true });
            } else {
                console.error('Failed to login:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error during fetch:', error);
        }
    };

    // Handle username input with validation
    handleUsernameChange = (event) => {
        const value = event.target.value;

        // Validation: No spaces, exactly 8 characters, one capital letter max
        const noSpaces = value.replace(/\s/g, '');
        const capitalLetterCount = (noSpaces.match(/[A-Z]/g) || []).length;

        if (noSpaces.length <= 8 && capitalLetterCount <= 1) {
            this.setState({ username: noSpaces });
        }
    };

    handlePasswordChange = (event) => {
        this.setState({ password: event.target.value });
    };

    render() {
        const { username, password, loginSuccess } = this.state;

        // Example: Redirect user after successful login
        if (loginSuccess) {
            return <div>Login successful! Redirecting...</div>;
        }

        return (
            <div className="container-flex">
                {/* Left side with content */}
                <div className="left-content">
                    <h2>Welcome to Spectra</h2>
                    <p>
                        Do whatever you want to.<br />
                        Make new friends, create, develop, hack, copy.<br />
                        It all anonymously! Nobody knows you, you know nobody.<br />
                        Data is encrypted.<br />
                        Usernames are randomly generated.<br />
                        Enjoy the game.
                    </p>
                </div>

                <div className="right-content">
                    <div className="auth-wrapper">
                        <div className="auth-inner">
                            <form onSubmit={this.handleSubmit}>
                                <div className="text-center mb-3">
                                    <img
                                        src={logo}
                                        alt="Logo"
                                        style={{
                                            width: '150px', // Adjust size as needed
                                            height: '150px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                </div>

                                <div className="auth-wrapper">
                                    <div className="mb-3">
                                        <label>Username</label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={this.handleUsernameChange}
                                            className="form-control"
                                            placeholder="username123"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={this.handlePasswordChange}
                                            className="form-control"
                                            placeholder="qwe-123-rty-123"
                                        />
                                    </div>
                                </div>
                                <div className="d-grid" style={{ marginTop: '20px' }}>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ backgroundColor: '#000', color: '#fff', border: '#000' }}
                                    >
                                        Log in
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
