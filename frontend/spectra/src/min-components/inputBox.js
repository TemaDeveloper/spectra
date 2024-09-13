import React, { useState } from 'react';

const MessageInput = ({ sendMessage }) => {
    const [message, setMessage] = useState('');

    const handleSend = (event) => {
        event.preventDefault();
        if (message.trim()) {
            sendMessage(message);
            setMessage('');
        }
    };

    return (
        <form onSubmit={handleSend} className="message-input-container">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
            />
            <button type="submit" className="send-button">
                Send
            </button>
        </form>
    );
};



export default MessageInput;
