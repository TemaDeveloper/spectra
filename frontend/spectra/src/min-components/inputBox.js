import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const MessageInput = ({ sendMessage }) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef(null);

    const handleInputChange = (e) => {
        setMessage(e.target.value);
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 250)}px`; 
    };

    const handleSend = (event) => {
        event.preventDefault();
        if (message.trim()) {
            sendMessage(message);  // Pass the message to the sendMessage function in Home.js
            setMessage('');  // Clear the input field after sending
            textareaRef.current.style.height = 'auto';  // Reset the textarea height
        }
    };

    return (
        <form onSubmit={handleSend} className="message-input-container">
            <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="message-input"
                rows="1"
            />
            <button type="submit" className="send-button">
                <FontAwesomeIcon icon={faPaperPlane} />
            </button>
        </form>
    );
};

export default MessageInput;
