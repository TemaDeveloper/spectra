import React, { Component } from 'react';
import logo from '../spectra_dark_logo.png';
import withNavigation from './with_nav.component.js'; 

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
        };
    }

    encodeCredentials = (username, password, publicKey) => {
        const credentials = `${username}:${password}:${publicKey}`; // Concatenate username and password with colon
        return btoa(credentials); // Base64 encode the string
    }

    generateRSAKeyPair = async () => {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: { name: "SHA-256" }
            },
            true,
            ["encrypt", "decrypt"]
        );

        // Export public key
        const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);

        // Export and store private key in IndexedDB
        const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
        const privateKeyBase64 = this.arrayBufferToBase64(privateKey);
        await this.storePrivateKeyInIndexedDB(privateKeyBase64);

        // Convert public key to Base64 for sending to backend
        const publicKeyBase64 = this.arrayBufferToBase64(publicKey);
        return publicKeyBase64;
    };

    // Handle form submission
    handleSubmit = async (event) => {
        event.preventDefault();
        console.log('Form submitted');

        const { username, password } = this.state;
        const publicKey = await this.generateRSAKeyPair();
        const encodedCredentials = this.encodeCredentials(username, password, publicKey); // add public key here as well
        

        try {
            const response = await fetch('http://127.0.0.1:3001/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ credentials: encodedCredentials }),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.text();
                console.log('Response:', result); 
                this.props.setIsAuthenticated(true);
                this.props.navigate('/home');
                //this.setState({ loginSuccess: true });
                // Redirect to home or show a success message
            } else {
                console.error('Failed to login:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error during fetch:', error);
        }
    };

    componentDidMount() {
        window.history.pushState(null, null, window.location.href);
        window.addEventListener('popstate', this.handleBackButton);
    }

    componentWillUnmount() {
        window.removeEventListener('popstate', this.handleBackButton);
    }

    handleBackButton = (event) => {
        window.history.pushState(null, null, window.location.href);
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

    arrayBufferToBase64 = (buffer) => {
        const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
        return btoa(binary);
    };

    storePrivateKeyInIndexedDB = async (privateKeyBase64) => {
        const db = await this.openIndexedDB();
        const transaction = db.transaction(["privateKeys"], "readwrite");
        const store = transaction.objectStore("privateKeys");
        store.put({ id: 'userPrivateKey', privateKey: privateKeyBase64 });
    };

    openIndexedDB = () => {
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open("keysSpectraDB", 1);

            request.onupgradeneeded = function () {
                const db = request.result;
                if (!db.objectStoreNames.contains("privateKeys")) {
                    db.createObjectStore("privateKeys", { keyPath: "id" });
                }
            };

            request.onsuccess = function () {
                resolve(request.result);
            };

            request.onerror = function (event) {
                reject("Error opening IndexedDB:", event);
            };
        });
    };


    render() {
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
                                            value={this.state.username}
                                            onChange={this.handleUsernameChange}
                                            className="form-control"
                                            placeholder="username123"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            value={this.state.password}
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
export default withNavigation(Login)
