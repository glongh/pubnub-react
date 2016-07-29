import React from 'react';
import ChatInput from '../components/ChatInput';
import ChatHistory from '../components/ChatHistory';
import { connect } from 'react-redux';
import { setCurrentUserID, addMessage } from '../actions';

class App extends React.Component {
  static propTypes = {
    history: React.PropTypes.array,
    userID: React.PropTypes.number,
    addMessage: React.PropTypes.func,
    setUserID: React.PropTypes.func,
  };

  state = {
    history: [],
    userID: Math.round(Math.random() * 1000000),
  }

  componentDidMount() {
    const ID = Math.round(Math.random() * 1000000);
    this.props.setUserID(ID);
    this.PubNub = PUBNUB.init({
      publish_key: 'pub-c-199f8cfb-5dd3-470f-baa7-d6cb52929ca4',
      subscribe_key: 'sub-c-d2a5720a-1d1a-11e6-8b91-02ee2ddab7fe',
      ssl: (location.protocol.toLowerCase() === 'https:'),
    });
    this.PubNub.subscribe({
      channel: 'ReactChat',
      message: this.props.addMessage,
    });
  }

  render() {
    const { sendMessage, props } = this;
    return (
      <div>
        <ChatHistory history={ props.history } />
        <ChatInput userID={ props.userID } sendMessage={ sendMessage } />
      </div>
    );
  }

  sendMessage = (message) => {
    this.PubNub.publish({
      channel: 'ReactChat',
      message: message,
    });
  }
}

function mapDispatchToProps(dispatch) {
  return {
    addMessage: (message) => dispatch(addMessage(message)),
    setUserID: (userID) => dispatch(setCurrentUserID(userID)),
  };
}

function mapStateToProps(state) {
  return {
    history: state.app.get('messages').toJS(),
    userID: state.app.get('userID'),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(App);
