import App from './App.js'
import './styles.css'
import { NotificationHandler } from './utils/notification-handler.js'
import { UIStateManager } from './utils/ui-state-manager.js'
import { DropdownManager } from './utils/dropdown-manager.js'
import { PropertyGroupsManager } from './utils/property-groups-manager.js'

// Store instance data globally
let globalInstanceData: any[] = [];

const appElement = document.querySelector('#app');
if (appElement) {
  appElement.innerHTML = App;
}

// Handle change in the second instance dropdown
function handleSecondInstanceChange(event: Event) {
  const selectedInstanceName = (event.target as HTMLSelectElement).value;
  
  if (selectedInstanceName) {
    // Find the selected instance data
    const selectedInstance = globalInstanceData.find(instance => instance.instanceName === selectedInstanceName);
    
    if (selectedInstance) {
      // Generate property groups
      PropertyGroupsManager.generatePropertyGroups(selectedInstance, globalInstanceData);
      
      console.log(`Generated property groups for instance: ${selectedInstanceName}`);
    }
  } else {
    // Clear property groups if no instance is selected
    PropertyGroupsManager.clearPropertyGroups();
  }
}

// Update UI state and populate dropdowns
function updateUIState(instances: any[]) {
  globalInstanceData = instances; // Store for later use
  
  // Update UI visibility
  UIStateManager.updateUIState(instances);
  
  // Populate dropdowns if instances exist
  if (instances && instances.length > 0) {
    DropdownManager.populateInstanceDropdowns(instances, handleSecondInstanceChange);
  }
}



// Listen for messages from the plugin
window.onmessage = async (event) => {
  console.log('UI received message:', event.data);
  
  const message = event.data.pluginMessage;
  
  if (message && message.type === 'notification') {
    console.log('Processing notification:', message);
    NotificationHandler.show(message.message, message.notificationType);
  } else if (message && message.type === 'instance-properties') {
    console.log('Processing instance properties:', message.data);
    updateUIState(message.data);
  }
};
