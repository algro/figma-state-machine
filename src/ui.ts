import App from './App.js'
import './styles.css'
import { NotificationHandler } from './utils/notification-handler.js'

const appElement = document.querySelector('#app');
if (appElement) {
  appElement.innerHTML = App;
}

// Listen for messages from the plugin
window.onmessage = async (event) => {
  console.log('UI received message:', event.data);
  
  const message = event.data.pluginMessage;
  
  if (message && message.type === 'notification') {
    console.log('Processing notification:', message);
    NotificationHandler.show(message.message, message.notificationType);
  }
};
