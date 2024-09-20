import React, { Component } from 'react';
import ChatHeader from '../min-components/header.js';
import UsersList from '../min-components/userList.js';
import ChatWindow from '../min-components/chatWindowComponent.js';
import MessageInput from '../min-components/inputBox.js';
import withNavigation from './with_nav.component'; 

class Home extends Component {

    selectRoom = (room) => {
        const { socket, currentRoom, setCurrentRoom } = this.props;

        if (currentRoom !== room.name) {
            socket.emit('leave', currentRoom);
            socket.emit('join', room.name);
            setCurrentRoom(room.name);  // Update room in App.js
        }
    };

    componentDidMount() {
        // You don't need to handle socket logic here, just handle back button prevention
        window.history.pushState(null, null, window.location.href);
        window.addEventListener('popstate', this.handleBackButton);
    }
    
    componentWillUnmount() {
        // Clean up only the event listener for the back button
        window.removeEventListener('popstate', this.handleBackButton);
    }

    handleLogout = async () => {
        //const userId = this.props.userId;

        try {
            const response = await fetch('http://10.10.9.136:9090/user/logout', {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                console.log('Successfully logged out');
                this.props.navigate('/sign-in', { replace: true });  // Navigate to login page
            } else {
                console.error('Failed to log out:', response.status, response.statusText);
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
        return (
            <div className="home-container">
                {/* Header now includes username and logout functionality */}
                <ChatHeader userName={this.props.userId} handleLogout={this.handleLogout} recipient={currentRoom} />

                <div className="home-content">
                    {/* List of users (rooms) on the left */}
                    <UsersList
                        currentRoom={currentRoom}
                        rooms={[
                            { id: 1, name: 'User1' },
                            { id: 2, name: 'User2' },
                            { id: 3, name: 'Spectra Main' },
                        ]}
                        selectRoom={this.selectRoom}  // Change the room when a user is selected
                    />

                    {/* Vertical line separator */}
                    <div className="separator"></div>

                    {/* Chat window on the right */}
                    <div className="chat-section">
                        <ChatWindow
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
