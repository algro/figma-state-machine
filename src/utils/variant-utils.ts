// Variant Utils - Handles variant extraction and processing

export class VariantUtils {
  
  /**
   * Get variants for a specific property
   */
  static getVariantsForProperty(selectedInstance: any, propertyName: string, globalInstanceData: any[]): string[] {
    const propertyValue = selectedInstance.properties[propertyName];
    let variants: string[] = [];
    
    if (typeof propertyValue === 'boolean') {
      // Boolean property - show true/false options
      variants = ['true', 'false'];
    } else if (typeof propertyValue === 'string') {
      // Get variants from the component's property definitions
      const propertyDefinitions = selectedInstance.propertyDefinitions;
      const propertyDefinition = propertyDefinitions[propertyName];
      
      if (propertyDefinition && propertyDefinition.variantOptions) {
        // Use the variant options defined in the component
        variants = propertyDefinition.variantOptions;
      } else if (propertyDefinition && propertyDefinition.preferredValues) {
        // Use preferred values if available
        variants = propertyDefinition.preferredValues.map((pv: any) => pv.name);
      } else {
        // Fallback: get all instances with the same main component
        const mainComponentId = selectedInstance.mainComponentId;
        
        if (mainComponentId) {
          // Find all instances with the same main component
          const sameComponentInstances = globalInstanceData.filter(instance => 
            instance.mainComponentId === mainComponentId
          );
          
          // Extract all unique values for this property
          const allValues = sameComponentInstances
            .map(instance => instance.properties[propertyName])
            .filter(value => value !== undefined)
            .map(value => String(value));
          
          // Remove duplicates and sort
          variants = Array.from(new Set(allValues)).sort();
        } else {
          // Fallback to current value if no main component
          variants = [String(propertyValue)];
        }
      }
    }
    
    return variants;
  }
} 