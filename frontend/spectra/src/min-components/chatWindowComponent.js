import React from 'react';

const ChatWindow = ({ messages, currentUser }) => {
    return (
        <div className="chat-window">
            {messages.map((message, index) => (
                <div
                    key={index}
                    className={message.sender === currentUser ? 'sent-message' : 'received-message'}
                >
                    <p>{message.text}</p>
                    <span className="time-stamp">
                        {new Date(message.time).toLocaleTimeString()} - {new Date(message.time).toLocaleDateString()}
                    </span>
                </div>
            ))}
        </div>
    );
};


export default ChatWindow;
