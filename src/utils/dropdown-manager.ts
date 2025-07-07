// Dropdown Manager - Handles dropdown population and interactions

export class DropdownManager {
  
    /**
   * Populate the mouse down target dropdown with unique instance names
   */
  static populateInstanceDropdowns(instances: any[], onInstanceChange: (event: Event) => void): void {
    const mouseDownTargetSelect = document.getElementById('click-target') as HTMLSelectElement;
    
    if (mouseDownTargetSelect) {
      // Get unique instance names
      const uniqueInstanceNames = Array.from(new Set(instances.map(instance => instance.instanceName)));
      
      // Clear existing options and add default option
      mouseDownTargetSelect.innerHTML = '<option value="">Choose an instance...</option>';
      
      // Add instance options
      uniqueInstanceNames.forEach(instanceName => {
        const option = document.createElement('option');
        option.value = instanceName;
        option.textContent = instanceName;
        mouseDownTargetSelect.appendChild(option);
      });
      
      // Add change listener
      mouseDownTargetSelect.addEventListener('change', onInstanceChange);
      
 
    }
  }
} 