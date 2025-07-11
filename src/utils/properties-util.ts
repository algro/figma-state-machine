// Types for instance property processing
export interface InstancePropertyData {
  instanceId: string;
  instanceName: string;
  mainComponentId: string | null;
  mainComponentName: string | null;
  baseComponentId: string | null;
  baseComponentName: string | null;
  properties: ComponentProperties;
  propertyDefinitions: { [propertyName: string]: ComponentPropertyDefinition };
  isNested: boolean;
  parentPath: string[];
}

export interface ComponentProperties {
  [propertyName: string]: string | boolean | VariableAlias;
}

// Helper type for component property definitions
export interface ComponentPropertyDefinition {
  type: ComponentPropertyType;
  defaultValue: string | boolean;
  preferredValues?: InstanceSwapPreferredValue[];
  variantOptions?: string[];
  readonly boundVariables?: { [key: string]: VariableAlias };
}

// PropertiesUtil class to handle instance property extraction
export class PropertiesUtil {
  
  /**
   * Find all instance nodes within a given node tree (including nested ones)
   */
  static findAllInstances(node: SceneNode): InstanceNode[] {
    const instances: InstanceNode[] = [];
    
    // If the node itself is an instance, add it
    if (node.type === 'INSTANCE') {
      instances.push(node as InstanceNode);
    }
    
    // Recursively search children if the node has children
    if ('children' in node) {
      for (const child of node.children) {
        instances.push(...this.findAllInstances(child));
      }
    }
    
    return instances;
  }
  
  /**
   * Get unique instances based on their main component
   * If multiple instances have the same main component, only return one
   * Also filters out instances with no properties
   */
  static async getUniqueInstances(instances: InstanceNode[]): Promise<InstanceNode[]> {
    const uniqueMap = new Map<string | null, InstanceNode>();
    
    for (const instance of instances) {
      const mainComponent = await instance.getMainComponentAsync();
      
      // Skip instances with no properties or broken component sets
      let properties: any = {};
      try {
        properties = instance.componentProperties;
      } catch {
        continue;
      }
      
      if (Object.keys(properties).length === 0) {
        continue;
      }
      
      // Get the base component ID (parent of variant components)
      let baseComponentId: string | null = null;
      if (mainComponent) {
        // If the main component is a variant (has a parent), use the parent's ID
        if (mainComponent.parent && mainComponent.parent.type === 'COMPONENT_SET') {
          baseComponentId = mainComponent.parent.id;
        } else {
          baseComponentId = mainComponent.id;
        }
      }
      
      // If we haven't seen this base component before, add it
      if (!uniqueMap.has(baseComponentId)) {
        uniqueMap.set(baseComponentId, instance);
      }
    }
    
    return Array.from(uniqueMap.values());
  }
  
  /**
   * Get the path to an instance node for debugging/identification
   */
  static getInstancePath(instance: InstanceNode): string[] {
    const path: string[] = [];
    let currentNode: BaseNode | null = instance;
    
    while (currentNode && currentNode.parent) {
      path.unshift(currentNode.name);
      currentNode = currentNode.parent;
    }
    
    return path;
  }
  
  /**
   * Extract properties from an instance node
   */
  static async getInstanceProperties(instance: InstanceNode): Promise<InstancePropertyData> {
    const mainComponent = await instance.getMainComponentAsync();
    const parentPath = this.getInstancePath(instance);
    
    // Convert componentProperties to our interface format
    const properties: ComponentProperties = {};
    const componentProps = instance.componentProperties;
    
    for (const [key, value] of Object.entries(componentProps)) {
      if (typeof value === 'object' && value !== null && 'value' in value) {
        // Handle ComponentPropertyDefinition format
        properties[key] = value.value;
      } else {
        // Handle direct value format
        properties[key] = value as string | boolean | VariableAlias;
      }
    }
    
    // Get property definitions from the correct component (component set or base component)
    const propertyDefinitions: { [propertyName: string]: ComponentPropertyDefinition } = {};
    
    try {
      let componentForDefinitions: BaseNode | null = null;
      
      // Check if main component exists and get the right component for definitions
      if (mainComponent) {
        // If the main component is a variant (has a parent that's a component set), 
        // get definitions from the component set
        if (mainComponent.parent && mainComponent.parent.type === 'COMPONENT_SET') {
          componentForDefinitions = mainComponent.parent;
        } else {
          // If it's a non-variant component, use it directly
          componentForDefinitions = mainComponent;
        }
      }
      
      // Only try to access componentPropertyDefinitions if we have a valid component
      if (componentForDefinitions && 'componentPropertyDefinitions' in componentForDefinitions) {
        const definitions = (componentForDefinitions as any).componentPropertyDefinitions;
        for (const [key, definition] of Object.entries(definitions)) {
          propertyDefinitions[key] = definition as ComponentPropertyDefinition;
        }
      }
    } catch (error) {
      console.warn('Could not get component property definitions:', error);
    }
    
    // Get base component information
    let baseComponentId: string | null = null;
    let baseComponentName: string | null = null;
    if (mainComponent) {
      if (mainComponent.parent && mainComponent.parent.type === 'COMPONENT_SET') {
        baseComponentId = mainComponent.parent.id;
        baseComponentName = mainComponent.parent.name;
      } else {
        baseComponentId = mainComponent.id;
        baseComponentName = mainComponent.name;
      }
    }
    
    return {
      instanceId: instance.id,
      instanceName: instance.name,
      mainComponentId: mainComponent?.id || null,
      mainComponentName: mainComponent?.name || null,
      baseComponentId: baseComponentId,
      baseComponentName: baseComponentName,
      properties: properties,
      propertyDefinitions: propertyDefinitions,
      isNested: parentPath.length > 1, // More than just the instance name
      parentPath: parentPath
    };
  }
  
  /**
   * Main function to process instance properties from selected nodes
   */
  static async processInstanceProperties(nodes: SceneNode[]): Promise<InstancePropertyData[]> {
    
    
    // Find all instances in the selected nodes
    const allInstances: InstanceNode[] = [];
    for (const node of nodes) {
      allInstances.push(...this.findAllInstances(node));
    }
    
    
    
    // Get unique instances based on main component
    const uniqueInstances = await this.getUniqueInstances(allInstances);
    
    
    // Extract properties for each unique instance
    const instanceData: InstancePropertyData[] = [];
    for (const instance of uniqueInstances) {
      const data = await this.getInstanceProperties(instance);
      instanceData.push(data);
      
      
    }
    
    return instanceData;
  }
  
  /**
   * Process instances from current selection
   */
  static async processCurrentSelection(): Promise<InstancePropertyData[]> {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      
      return [];
    }
    
    return await this.processInstanceProperties(Array.from(selection));
  }
  
  /**
   * Get properties for a single instance node
   */
  static async getSingleInstanceProperties(instance: InstanceNode): Promise<InstancePropertyData> {
    return await this.getInstanceProperties(instance);
  }
} 