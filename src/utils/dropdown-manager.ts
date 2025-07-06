// Dropdown Manager - Handles dropdown population and interactions

export class DropdownManager {
  
  /**
   * Populate instance dropdowns with unique instance names
   */
  static populateInstanceDropdowns(instances: any[], onSecondInstanceChange: (event: Event) => void): void {
    const instanceSelects = document.querySelectorAll('.instance-select') as NodeListOf<HTMLSelectElement>;
    
    if (instanceSelects.length > 0) {
      // Get unique instance names
      const uniqueInstanceNames = Array.from(new Set(instances.map(instance => instance.instanceName)));
      
      // Populate all instance select dropdowns
      instanceSelects.forEach((select, index) => {
        // Clear existing options and add default option
        select.innerHTML = '<option value="">Choose an instance...</option>';
        
        // Add instance options
        uniqueInstanceNames.forEach(instanceName => {
          const option = document.createElement('option');
          option.value = instanceName;
          option.textContent = instanceName;
          select.appendChild(option);
        });
        
        // Add change listener for the second dropdown (index 1)
        if (index === 1) {
          select.addEventListener('change', onSecondInstanceChange);
        }
      });
      
      console.log(`Populated ${instanceSelects.length} dropdowns with ${uniqueInstanceNames.length} unique instances`);
    }
  }
} 