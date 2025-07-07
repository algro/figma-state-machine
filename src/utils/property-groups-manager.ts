// Property Groups Manager - Handles property groups generation and management

import { VariantUtils } from './variant-utils.js';

export class PropertyGroupsManager {
  
  /**
   * Generate property groups for the selected instance
   */
  static generatePropertyGroups(selectedInstance: any, globalInstanceData: any[]): void {
    this.generatePropertyGroupsForContainer('property-groups', selectedInstance, globalInstanceData, false);
  }
  
  /**
   * Generate property groups for the "other" section with "Keep initial" option
   */
  static generateOtherPropertyGroups(selectedInstance: any, globalInstanceData: any[]): void {
    this.generatePropertyGroupsForContainer('property-groups-others', selectedInstance, globalInstanceData, true);
  }
  
  /**
   * Generate property groups for a specific container
   */
  private static generatePropertyGroupsForContainer(
    containerId: string, 
    selectedInstance: any, 
    globalInstanceData: any[], 
    includeKeepInitial: boolean
  ): void {
    const propertyGroupsContainer = document.getElementById(containerId);
    
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
        variantsSelect.id = `${containerId}-variants-${index}`;
        
        // Get variants for this property
        const variants = VariantUtils.getVariantsForProperty(selectedInstance, propertyName, globalInstanceData);
        
        // Add "Keep initial" option if requested
        if (includeKeepInitial) {
          const keepInitialOption = document.createElement('option');
          keepInitialOption.value = 'keep-initial';
          keepInitialOption.textContent = 'Keep initial';
          keepInitialOption.selected = true; // Default selected
          variantsSelect.appendChild(keepInitialOption);
        }
        
        // Add variant options
        variants.forEach((variant, variantIndex) => {
          const option = document.createElement('option');
          option.value = variant;
          option.textContent = variant;
          
          // Prefill with the first variant (only if not including keep initial)
          if (!includeKeepInitial && variantIndex === 0) {
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
      
      
    }
  }
  
  /**
   * Clear property groups
   */
  static clearPropertyGroups(): void {
    const propertyGroupsContainer = document.getElementById('property-groups');
    const otherPropertyGroupsContainer = document.getElementById('property-groups-others');
    
    if (propertyGroupsContainer) {
      propertyGroupsContainer.innerHTML = '';
    }
    
    if (otherPropertyGroupsContainer) {
      otherPropertyGroupsContainer.innerHTML = '';
    }
  }
} 