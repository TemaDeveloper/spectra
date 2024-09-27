import React from 'react';

const ChatWindow = ({ messages, recipient, username }) => {
    return (
        <div className="chat-window">
            {messages.map((message, index) => (
                <div
                    key={index}
                    className={message.user_id === recipient ? 'message-received-container' : 'message-sent-container'}
                >
                    {/* Avatar for the message */}
                    <div className="message-avatar">
                        <span>{username?.charAt(0)}</span>
                    </div>

                    {/* Message bubble */}
                    <div className={`message-bubble ${message.user_id === recipient ? 'received-message' : 'sent-message'}`}>
                        <p>{message.content}</p>
                        <span className="timestamp">
                            {new Date(message.date).toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};


export default ChatWindow;
