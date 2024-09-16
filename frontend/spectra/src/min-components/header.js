import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

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
                {/* User box with animated FontAwesome icon */}
                <div className={`user-box ${isDropdownVisible ? 'active' : ''}`} onClick={toggleDropdown}>
                    <span>{userName}</span>
                    <FontAwesomeIcon 
                        icon={faChevronDown} 
                        className={`arrow ${isDropdownVisible ? 'rotate-up' : 'rotate-down'}`} 
                    />
                </div>
                {isDropdownVisible && (
                    <div className="dropdown">
                        <button onClick={handleLogout} className="signout-button">
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default ChatHeader;
