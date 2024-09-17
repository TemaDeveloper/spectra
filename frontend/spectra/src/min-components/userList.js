import React, { useState } from 'react';
import { FaBars } from 'react-icons/fa'; // For toggle icons

const UsersList = ({ users, selectUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState(null); // Track selected user

    // Filter users based on the search term
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleUserList = () => {
        setIsExpanded(!isExpanded);
    };

    const handleUserClick = (user) => {
        setSelectedUserId(user.id); // Set selected user
        selectUser(user); // Trigger the selectUser function
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
                        placeholder="Find a user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />

                    <ul className="users">
                        {filteredUsers.map((user) => (
                            <li 
                                key={user.id} 
                                className={`user-item ${selectedUserId === user.id ? 'active' : ''}`} // Add 'active' class for selected user
                                onClick={() => handleUserClick(user)}
                            >
                                <div className="user-avatar">
                                    <span>{user.name[0]}</span> {/* First letter of user's name */}
                                </div>
                                <div className="user-name">
                                    {user.name}
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
