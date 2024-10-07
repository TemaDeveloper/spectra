import React, { useEffect, useRef, useState } from 'react';

const ChatWindow = ({ messages, currentUserId, username }) => {
    const chatWindowRef = useRef(null);
    const [popup, setPopup] = useState({ show: false, x: 0, y: 0, messageId: null });
    // Scroll to the bottom whenever messages change
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages]); // Runs every time `messages` changes

    const handleMessageClick = (e, sender_id) => {
        const rect = e.target.getBoundingClientRect();
        setPopup({
            show: true,
            x: rect.right + 10, // Positioning near the message bubble
            y: rect.top - 20, 
            sender_id
        });
    };

    const handleOutsideClick = () => {
        setPopup({ show: false, x: 0, y: 0, messageId: null });
    };

    useEffect(() => {
        if (popup.show) {
            document.addEventListener('click', handleOutsideClick);
        } else {
            document.removeEventListener('click', handleOutsideClick);
        }
        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, [popup.show]);

    const handleStartPrivateChat = () => {
        //startPrivateChat(popup.messageId);  // Pass the clicked message ID to start a private chat
        setPopup({ show: false, x: 0, y: 0, sender_id: null });
    };

    return (
        <div className="chat-window" ref={chatWindowRef} style={{ overflowY: 'scroll', height: '400px' }}>
            {messages.map((message, index) => (
                <div
                    key={index}
                    onClick={(e) => handleMessageClick(e, message.sender_id)} 
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
            {/* Pop-up for "Start Private Chat" */}
            {popup.show && (
                <div
                    className="popup-window"
                    style={{ position: 'absolute', top: popup.y, left: popup.x, backgroundColor: 'white', padding: '10px', border: '1px solid black' }}
                >
                    <button onClick={handleStartPrivateChat}>Start Private Chat</button>
                </div>
            )}

        </div>
    );
};

export default ChatWindow;
