import React, { useState } from 'react';
import { FaBars } from 'react-icons/fa'; // For toggle icons

const UsersList = ({ rooms, selectRoom, currentRoom }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);
    const [selectedRoomId, setSelectedRoomId] = useState(null); // Track selected user

    // Filter users based on the search term
    const filteredUsers = rooms.filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleUserList = () => {
        setIsExpanded(!isExpanded);
    };

    const handleUserClick = (room) => {
        setSelectedRoomId(room.id); // Set selected user
        selectRoom(room); // Trigger the selectUser function, which will update the current room
    };

    return (
        <div className={`users-list-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
            {/* Toggle Button */} 
            <div className="toggle-button" onClick={toggleUserList}>
                <FaBars />
            </div>

            {/* Search input and user list only visible if expanded */}
            {isExpanded && (
                <div className="user-list-content">
                    <input
                        type="text"
                        placeholder="Find a room..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />

                    <ul className="users">
                        {filteredUsers.map((room) => (
                            <li 
                                key={room.id} 
                                className={`user-item ${(currentRoom === room.id && selectedRoomId === room.id) ? 'active' : ''}`} // Add 'active' class for selected user
                                onClick={() => handleUserClick(room)}
                            >
                                <div className="user-avatar">
                                    <span>{room.name[0]}</span> {/* First letter of user's name */}
                                </div>
                                <div className="user-name">
                                    {room.name}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default UsersList;
