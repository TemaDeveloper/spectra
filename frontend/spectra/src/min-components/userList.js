import React, { useState } from 'react';
import { FaBars } from 'react-icons/fa'; // For toggle icons

const UsersList = ({ rooms, selectRoom, currentRoom }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);
    const [selectedRoomId, setSelectedRoomId] = useState(null); // Track selected room

    const filterRooms = (rooms, searchTerm) => {
        // Ensure rooms is an array before filtering
        if (!Array.isArray(rooms)) {
            console.error('Rooms is not an array:', rooms);
            return [];
        }

        return rooms.filter(room =>
            room.room_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const toggleUserList = () => {
        setIsExpanded(!isExpanded);
    };

    const handleUserClick = (room) => {
        setSelectedRoomId(room.room_id); // Set selected room ID
        selectRoom(room); // Trigger the selectRoom function, which will update the current room
    };

    // Filter the rooms based on the search term
    const filteredRooms = filterRooms(rooms, searchTerm);

    return (
        <div className={`users-list-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
            {/* Toggle Button */} 
            <div className="toggle-button" onClick={toggleUserList}>
                <FaBars />
            </div>

            {/* Search input and room list only visible if expanded */}
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
                        {filteredRooms.map((room) => (
                            <li 
                                key={room.room_id} 
                                className={`user-item ${(currentRoom === room.room_name && selectedRoomId === room.room_id) ? 'active' : ''}`} // Add 'active' class for selected room
                                onClick={() => handleUserClick(room)}
                            >
                                <div className="user-avatar">
                                    <span>{room.room_name[0]}</span> {/* First letter of room's name */}
                                </div>
                                <div className="user-name">
                                    {room.room_name}
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
