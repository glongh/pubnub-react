import React from 'react';
import ChatInput from '../components/ChatInput';
import ChatHistory from '../components/ChatHistory';
import ChatUsers from '../components/ChatUsers';
import { connect } from 'react-redux';
import { setCurrentUserID, addMessage, addHistory, addUser, removeUser } from '../actions';

class App extends React.Component {
  static propTypes = {
    history: React.PropTypes.array,
    userID: React.PropTypes.number,
    addMessage: React.PropTypes.func,
    setUserID: React.PropTypes.func,
    lastMessageTimestamp: React.PropTypes.string,
    users: React.PropTypes.array,
    addUser: React.PropTypes.func,
    removeUser: React.PropTypes.func,
  };

  state = {
    history: [],
    userID: Math.round(Math.random() * 1000000),
  }



  componentDidMount() {
    const ID = Math.round(Math.random() * 1000000);
    this.props.setUserID(ID);
    this.PubNub = PUBNUB.init({
      publish_key: 'pub-c-46e94e35-ea6d-41f2-81af-a06b88a9b29c',
      subscribe_key: 'sub-c-e568e68c-5691-11e6-a5a4-0619f8945a4f',
      ssl: (location.protocol.toLowerCase() === 'https:'),
      uuid: ID,
      heartbeat: 10, 
    });
    this.PubNub.subscribe({
      channel: 'ReactChat3',
      message: this.props.addMessage,
      presence: this.onPresenceChange,
    });
    this.fetchHistory();
    window.addEventListener('beforeunload', this.leaveChat);
    document.addEventListener('something', this.something);
  }

  componentWillUnmount() {
    this.leaveChat();
  }

  onPresenceChange = (presenceData) => {
    switch (presenceData.action) {
    case 'join':
      this.props.addUser(presenceData.uuid);
      break;
    case 'leave':
    case 'timeout':
      this.props.removeUser(presenceData.uuid);
      break;
    default:
      //console.error('Unknown action: ' + presenceData.action);
    }
  }

  render() {
    const { sendMessage, props, fetchHistory } = this;
    return (
      <div className="message-container">
        <ChatUsers users={ props.users } />
        <ChatHistory history={ props.history } fetchHistory={ fetchHistory } />
        <ChatInput userID={ props.userID } sendMessage={ sendMessage } />
      </div>
    );
  }

  something = () => {
    var msg = {
      Who: this.props.userID,
      What: 'hello World',
      When: new Date().valueOf(),
    }
    this.sendMessage(msg);
  }

  leaveChat = () => {
    this.PubNub.unsubscribe({
      channel: 'ReactChat3',
    });
  }

  sendMessage = (message) => {
    this.PubNub.publish({
      channel: 'ReactChat3',
      message: message,
    });
  }

  fetchHistory = () => {
    const { props } = this;
    this.PubNub.history({
      channel: 'ReactChat3',
      count: 7,
      start: props.lastMessageTimestamp,
      callback: (data) => {
        // data is Array(3), where index 0 is an array of messages
        // and index 1 and 2 are start and end dates of the messages
        props.addHistory(data[0], data[1]);
      },
    });
  }
}

function mapDispatchToProps(dispatch) {
  return {
    addMessage: (message) => dispatch(addMessage(message)),
    setUserID: (userID) => dispatch(setCurrentUserID(userID)),
    addHistory: (messages, timestamp) => dispatch(addHistory(messages, timestamp)),
    addUser: (userID) => dispatch(addUser(userID)),
    removeUser: (userID) => dispatch(removeUser(userID)),
  };
}

function mapStateToProps(state) {
  return {
    history: state.app.get('messages').toJS(),
    userID: state.app.get('userID'),
    lastMessageTimestamp: state.app.get('lastMessageTimestamp'),
    users: state.app.get('users').toJS(),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(App);
