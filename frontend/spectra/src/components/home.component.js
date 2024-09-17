import React, { Component } from 'react';
import ChatHeader from '../min-components/header.js';
import UsersList from '../min-components/userList.js';
import ChatWindow from '../min-components/chatWindowComponent.js';
import MessageInput from '../min-components/inputBox.js';
import withNavigation from './with_nav.component'; 

class Home extends Component {
    state = {
        users: [
            { id: 1, name: 'User1' },
            { id: 2, name: 'User2' },
            { id: 3, name: 'Spectra Main' },
        ],
        messages: [],
        recipient: 'User2',
        currentUser: 'User1', // This would be the logged-in user
    };

    handleSendMessage = (text) => {
        const newMessage = {
            recipient: this.state.recipient,
            sender: this.state.currentUser,
            text: text,
            time: new Date().toISOString(),
        };

        this.setState({ messages: [...this.state.messages, newMessage] });
    };

    // Logout using the userId prop and handle navigation
    handleLogout = async () => {
        const userId = this.props.userId;

        try {
            const response = await fetch('http://127.0.0.1:3000/user/logout', {
                method: 'POST',
                credentials: 'include', // Include cookies in the request
            });

            if (response.ok) {
                console.log('Successfully logged out');
                this.props.navigate('/sign-in', { replace: true }); // Navigate to login page
            } else {
                console.error('Failed to log out:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error during fetch:', error);
        }
    };

    componentDidMount() {
        // Prevent back button navigation after logging out
        window.history.pushState(null, null, window.location.href);
        window.addEventListener('popstate', this.handleBackButton);
    }

    componentWillUnmount() {
        window.removeEventListener('popstate', this.handleBackButton);
    }

    handleBackButton = (event) => {
        window.history.pushState(null, null, window.location.href);
    };

    render() {
        return (
            <div className="home-container">
                {/* Header now includes username and logout functionality */}
                <ChatHeader userName={this.state.currentUser} handleLogout={this.handleLogout} recipient={this.state.recipient} />

                <div className="home-content">
                    {/* List of users on the left */}
                    <UsersList
                        users={this.state.users}
                        selectUser={(user) => this.setState({ recipient: user.name })}
                    />

                     {/* Vertical line separator */}
                    <div className="separator"></div>

                    {/* Chat window on the right */}
                    <div className="chat-section">
                        <ChatWindow
                            messages={this.state.messages}
                            recipient={this.state.recipient}
                        />
                        <MessageInput sendMessage={this.handleSendMessage} />
                    </div>
                </div>

               
            </div>
        );
    }
}

// Export the component with navigation
export default withNavigation(Home);
