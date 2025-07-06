// Property Groups Manager - Handles property groups generation and management

import { VariantUtils } from './variant-utils.js';

export class PropertyGroupsManager {
  
  /**
   * Generate property groups for the selected instance
   */
  static generatePropertyGroups(selectedInstance: any, globalInstanceData: any[]): void {
    const propertyGroupsContainer = document.getElementById('property-groups');
    
    if (propertyGroupsContainer) {
      // Clear existing groups
      propertyGroupsContainer.innerHTML = '';
      
      const properties = selectedInstance.properties;
      const propertyNames = Object.keys(properties);
      
      propertyNames.forEach((propertyName, index) => {
        // Create horizontal group for this property
        const propertyGroup = document.createElement('div');
        propertyGroup.className = 'property-group';
        
        // Create property name display (read-only)
        const propertyNameDiv = document.createElement('div');
        propertyNameDiv.className = 'property-name';
        propertyNameDiv.textContent = propertyName;
        
        // Create variants dropdown
        const variantsSelect = document.createElement('select');
        variantsSelect.className = 'select-input';
        variantsSelect.id = `property-variants-${index}`;
        
        // Get variants for this property
        const variants = VariantUtils.getVariantsForProperty(selectedInstance, propertyName, globalInstanceData);
        
        // Add variant options with the first one pre-selected
        variants.forEach((variant, variantIndex) => {
          const option = document.createElement('option');
          option.value = variant;
          option.textContent = variant;
          
          // Prefill with the first variant
          if (variantIndex === 0) {
            option.selected = true;
          }
          
          variantsSelect.appendChild(option);
        });
        
        // Add elements to the group
        propertyGroup.appendChild(propertyNameDiv);
        propertyGroup.appendChild(variantsSelect);
        
        // Add group to container
        propertyGroupsContainer.appendChild(propertyGroup);
      });
      
      console.log(`Generated ${propertyNames.length} property groups`);
    }
  }
  
  /**
   * Clear property groups
   */
  static clearPropertyGroups(): void {
    const propertyGroupsContainer = document.getElementById('property-groups');
    if (propertyGroupsContainer) {
      propertyGroupsContainer.innerHTML = '';
    }
  }
} 