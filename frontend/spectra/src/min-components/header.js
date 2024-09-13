import React, { useState } from 'react';

const ChatHeader = ({ userName, handleLogout }) => {
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownVisible(!isDropdownVisible);
    };

    return (
        <header className="chat-header">
            <img src="spectra_dark_logo.png" alt="Chat Logo" className="chat-logo" />
            <h2>Spectra</h2>
            <div className="user-section">
                <span className="user-name" onClick={toggleDropdown}>
                    {userName} ▼
                </span>
                {isDropdownVisible && (
                    <div className="dropdown">
                        <button onClick={handleLogout} className="logout-button">
                            Log Out
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default ChatHeader;
