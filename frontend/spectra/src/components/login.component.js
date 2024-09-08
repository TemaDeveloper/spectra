import React, { Component } from 'react'
import logo from '../logo.jpg';
import bigImage from '../image_lotus.png';

export default class Login extends Component {
    render() {
        return (
            <div className="container-flex">
                {/* Left side with content */}
                <div className="left-content">
                    <h2>Welcome to Spectra</h2>
                    <p>
                        Do whatever you want to.<br/>
                        Make new friends, create, develop, hack, copy.<br/>
                        It all anonymously! Nobody knows you, you know nobody.<br/>
                        Data is encrypted.<br/>
                        Usernames are randomly generated.<br/>
                        Enjoy the game.
                    </p>
                </div>

                <div className="right-content">

                    <div className="auth-wrapper">
                        <div className='auth-inner'>

                            <form>
                                <div className="text-center mb-3">
                                    <img
                                        src={logo}
                                        alt="Logo"
                                        style={{
                                            width: '150px', // Adjust size as needed
                                            height: '150px',
                                            borderRadius: '50%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </div>
                                <div className="auth-wrapper">
                                    <div className="mb-3">
                                        <label>Username</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="username123"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="qwe-123-rty-123"
                                        />
                                    </div>
                                </div>
                                <div className="d-grid" style={{ marginTop: '20px' }}>
                                    <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#000', color: '#fff', border: '#000' }}>
                                        Log in
                                    </button>
                                </div>

                            </form>

                        </div>
                    </div>


                </div>
            </div>
        )
    }
}