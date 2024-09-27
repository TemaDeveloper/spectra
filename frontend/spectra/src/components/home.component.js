import React, { Component } from 'react';
import ChatHeader from '../min-components/header.js';
import UsersList from '../min-components/userList.js';
import ChatWindow from '../min-components/chatWindowComponent.js';
import MessageInput from '../min-components/inputBox.js';
import withNavigation from './with_nav.component'; 

class Home extends Component {

    state = {
        rooms: [], 
        userName: '',
    };

    selectRoom = (room) => {
        const { socket, currentRoom, setCurrentRoom } = this.props;

        if (currentRoom !== room.room_name) {
            socket.emit('leave', currentRoom);
            socket.emit('join', room.room_name);
            setCurrentRoom(room.room_name);  // Update room in App.js
        }
    };

    async componentDidMount() {
        const userId = this.props.userId;
        try {
            const [roomsResponse, userNameResponse] = await Promise.all([
                fetch('http://127.0.0.1:3001/room/get-rooms', {
                    method: 'GET',
                    credentials: 'include',  // Include credentials if your API requires authentication
                }),
                fetch(`http://127.0.0.1:3001/user/get-user-name/${userId}`, {
                    method: 'GET',
                    credentials: 'include',
                })
            ]);

            // Process the responses
            if (roomsResponse.ok && userNameResponse.ok) {
                const roomsData = await roomsResponse.json();
                const userNameData = await userNameResponse.json();

                this.setState({
                    rooms: roomsData.rooms || [],  // Set rooms in state
                    userName: userNameData.user_name || '',  // Set user name in state
                });
            } else {
                console.error('Failed to fetch rooms or user name');
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }

        // You don't need to handle socket logic here, just handle back button prevention
        window.history.pushState(null, null, window.location.href);
        window.addEventListener('popstate', this.handleBackButton);
    }
    
    componentWillUnmount() {
        // Clean up only the event listener for the back button
        window.removeEventListener('popstate', this.handleBackButton);
    }

    handleLogout = async () => {

        try {
            const response = await fetch('http://127.0.0.1:3001/user/logout', {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                const rooms = data.rooms || [];  // Extract the rooms array
                this.setState({ rooms }); 
            } else {
                console.error('Failed to fetch rooms:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error during fetch:', error);
        }
    };

    handleBackButton = () => {
        window.history.pushState(null, null, window.location.href);
    };

    render() {
        const { currentRoom, messages, sendMessage } = this.props;       
        const { rooms, userName } = this.state;
        return (
            <div className="home-container">
                {/* Header now includes username and logout functionality */}
                <ChatHeader userName={userName} handleLogout={this.handleLogout} recipient={currentRoom} />

                <div className="home-content">
                    {/* List of users (rooms) on the left */}
                    <UsersList
                        currentRoom={currentRoom}
                        rooms={rooms}
                        selectRoom={this.selectRoom}  // Change the room when a user is selected
                    />

                    {/* Vertical line separator */}
                    <div className="separator"></div>

                    {/* Chat window on the right */}
                    <div className="chat-section">
                        <ChatWindow
                            username = {userName}
                            messages={messages}
                            recipient={currentRoom}
                        />
                        <MessageInput
                            sendMessage={sendMessage}
                        />
                    </div>
                </div>
            </div>
        );
    }
}


// Export the component with navigation
export default withNavigation(Home);
