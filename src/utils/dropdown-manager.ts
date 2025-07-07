// Dropdown Manager - Handles dropdown population and interactions

export class DropdownManager {
  
    /**
   * Populate the click target dropdown with unique instance names
   */
  static populateInstanceDropdowns(instances: any[], onInstanceChange: (event: Event) => void): void {
    const clickTargetSelect = document.getElementById('click-target') as HTMLSelectElement;
    
    if (clickTargetSelect) {
      // Get unique instance names
      const uniqueInstanceNames = Array.from(new Set(instances.map(instance => instance.instanceName)));
      
      // Clear existing options and add default option
      clickTargetSelect.innerHTML = '<option value="">Choose an instance...</option>';
      
      // Add instance options
      uniqueInstanceNames.forEach(instanceName => {
        const option = document.createElement('option');
        option.value = instanceName;
        option.textContent = instanceName;
        clickTargetSelect.appendChild(option);
      });
      
      // Add change listener
      clickTargetSelect.addEventListener('change', onInstanceChange);
      
 
    }
  }
} 