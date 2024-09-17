import React, { useState } from 'react';
import { FaBars } from 'react-icons/fa'; // For toggle icons


const UsersList = ({ users, selectUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);

    // Filter users based on the search term
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleUserList = () => {
        setIsExpanded(!isExpanded);
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
                            <li key={user.id} className="user-item" onClick={() => selectUser(user)}>
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
