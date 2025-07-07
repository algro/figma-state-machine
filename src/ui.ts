import App from './App.js'
import './styles.css'
import { NotificationHandler } from './utils/notification-handler.js'
import { UIStateManager } from './utils/ui-state-manager.js'
import { DropdownManager } from './utils/dropdown-manager.js'
import { PropertyGroupsManager } from './utils/property-groups-manager.js'
import { InteractionManager } from './utils/interaction-manager.js'

// Store instance data globally
let globalInstanceData: any[] = [];

const appElement = document.querySelector('#app');
if (appElement) {
  appElement.innerHTML = App;
}

// Handle change in the instance dropdown
function handleInstanceChange(event: Event) {
  const selectedInstanceName = (event.target as HTMLSelectElement).value;
  
  if (selectedInstanceName) {
    // Find the selected instance data
    const selectedInstance = globalInstanceData.find(instance => instance.instanceName === selectedInstanceName);
    
    if (selectedInstance) {
      // Generate property groups for both sections
      PropertyGroupsManager.generatePropertyGroups(selectedInstance, globalInstanceData);
      PropertyGroupsManager.generateOtherPropertyGroups(selectedInstance, globalInstanceData);
      
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
    DropdownManager.populateInstanceDropdowns(instances, handleInstanceChange);
  }
}

// Handle Add Interaction button click
function handleAddInteractionClick() {
  const { firstInstance, secondInstance } = InteractionManager.getSelectedInstances();
  
  if (!firstInstance || !secondInstance) {
    NotificationHandler.show('Please select both instances before adding interactions', 'error');
    return;
  }
  
  // Get property group values from both sections
  const propertyGroups = InteractionManager.getPropertyGroupValues('property-groups');
  const otherPropertyGroups = InteractionManager.getPropertyGroupValues('property-groups-others');
  
  if (propertyGroups.length === 0) {
    NotificationHandler.show('No properties configured for the second instance', 'error');
    return;
  }
  
  // The propertyGroups are for the clicked instance (first property groups)
  // The otherPropertyGroups are for "other" instances of the same component
  // Both are for the same instance type (secondInstance), but different behaviors
  
  // Set up the interactions
  InteractionManager.setupClickInteractions(firstInstance, secondInstance, propertyGroups, otherPropertyGroups)
    .then(() => {
      NotificationHandler.show('Click interactions setup completed successfully!', 'success');
    })
    .catch((error) => {
      console.error('Failed to setup interactions:', error);
      NotificationHandler.show(`Failed to setup interactions: ${error.message}`, 'error');
    });
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

// Add event listener for Add Interaction button
document.addEventListener('DOMContentLoaded', () => {
  const addInteractionButton = document.querySelector('.add-interaction') as HTMLButtonElement;
  if (addInteractionButton) {
    addInteractionButton.addEventListener('click', handleAddInteractionClick);
  }
});
