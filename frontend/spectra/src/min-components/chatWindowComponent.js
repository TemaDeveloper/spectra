import React from 'react';

const ChatWindow = ({ messages, recipient }) => {
    return (
        <div className="chat-window">
            {messages.map((message, index) => (
                <div
                    key={index}
                    className={message.sender === recipient ? 'message-received-container' : 'message-sent-container'}
                >
                    {/* Avatar for the message */}
                    <div className="message-avatar">
                        <span>{message.sender[0]}</span>
                    </div>

                    {/* Message bubble */}
                    <div className={`message-bubble ${message.sender === recipient ? 'received-message' : 'sent-message'}`}>
                        <p>{message.text}</p>
                        <span className="timestamp">
                            {new Date(message.time).toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};


export default ChatWindow;
