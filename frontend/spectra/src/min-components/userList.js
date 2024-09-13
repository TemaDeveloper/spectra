import React from 'react';

const UsersList = ({ users, selectUser }) => {
    return (
        <div className="users-list">
            <h3>Users</h3>
            <ul>
                {users.map(user => (
                    <li key={user.id} onClick={() => selectUser(user)}>
                        {user.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default UsersList;
