import React, { useEffect, useRef } from 'react';

const ChatWindow = ({ messages, currentUserId, username }) => {
    const chatWindowRef = useRef(null);

    // Scroll to the bottom whenever messages change
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages]); // Runs every time `messages` changes

    return (
        <div className="chat-window" ref={chatWindowRef} style={{ overflowY: 'scroll', height: '400px' }}>
            {messages.map((message, index) => (
                <div
                    key={index}
                    className={message.sender_id === currentUserId ? 'message-sent-container' : 'message-received-container'}
                >
                    {/* Avatar for the message */}
                    <div className="message-avatar">
                        <span>
                            {message.sender_id === currentUserId 
                                ? username?.charAt(0).toUpperCase()  // Current user's username initial
                                : message.sender_id.charAt(0).toUpperCase()}  
                        </span>
                    </div>

                    {/* Message bubble */}
                    <div className={`message-bubble ${message.sender_id === currentUserId ? 'sent-message' : 'received-message'}`}>
                        <p>{message.content}</p>
                        <span className="timestamp">
                            {new Date(message.sending_time).toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChatWindow;
