// Plugin Interaction Handler - Handles variable collection and reactions on the plugin side

export class PluginInteractionHandler {
  
  /**
   * Find or create a variable collection by name
   */
  static findOrCreateVariableCollection(collectionName: string): any {
    // First try to find existing collection
    const existingCollection = figma.variables.getLocalVariableCollections().find(
      (collection: any) => collection.name === collectionName
    );
    
    if (existingCollection) {
      console.log(`Found existing variable collection: ${collectionName}`);
      return existingCollection;
    }
    
    // Create new collection if it doesn't exist
    const newCollection = figma.variables.createVariableCollection(collectionName);
    console.log(`Created new variable collection: ${collectionName}`);
    return newCollection;
  }
  
  /**
   * Create individual variables for each instance and property
   */
  static createIndividualInstanceVariables(
    variableCollection: any,
    instances: any[],
    firstPropertyGroups: any[],
    otherPropertyGroups: any[]
  ): any[] {
    console.log('=== CREATE INDIVIDUAL INSTANCE VARIABLES ===');
    console.log('Variable collection:', variableCollection.name);
    console.log('Instances:', instances.length);
    console.log('First property groups:', firstPropertyGroups);
    console.log('Other property groups:', otherPropertyGroups);
    
    const allVariables: any[] = [];
    
    // Create variables for each instance
    instances.forEach((instance, instanceIndex) => {
      console.log(`Creating variables for instance ${instanceIndex + 1}: ${instance.name}`);
      
      // Create variables for "Set" properties (first property groups)
      firstPropertyGroups.forEach((propertyGroup) => {
        const { propertyName, selectedVariant } = propertyGroup;
        const variableName = `${instance.name}_${propertyName}_${instanceIndex}`;
        
        // Get property definition to determine variable type
        const propertyDefinition = this.getPropertyDefinition(instance, propertyName);
        const variableType = this.determineVariableType(propertyDefinition, selectedVariant);
        
        const variable = this.findOrCreateVariable(variableCollection, variableName, selectedVariant, variableType);
        allVariables.push(variable);
        console.log(`Created variable: ${variableName} = ${selectedVariant} (type: ${variableType})`);
      });
      
      // Create variables for "And set other" properties (other property groups)
      otherPropertyGroups.forEach((propertyGroup) => {
        const { propertyName, selectedVariant } = propertyGroup;
        
        if (selectedVariant !== 'keep-initial') {
          const variableName = `${instance.name}_${propertyName}_${instanceIndex}`;
          
          // Get property definition to determine variable type
          const propertyDefinition = this.getPropertyDefinition(instance, propertyName);
          const variableType = this.determineVariableType(propertyDefinition, selectedVariant);
          
          const variable = this.findOrCreateVariable(variableCollection, variableName, selectedVariant, variableType);
          allVariables.push(variable);
          console.log(`Created variable: ${variableName} = ${selectedVariant} (type: ${variableType})`);
        } else {
          console.log(`Skipping variable for ${instance.name}_${propertyName}_${instanceIndex} (keep-initial)`);
        }
      });
    });
    
    console.log(`Created ${allVariables.length} total variables for all instances`);
    console.log('=== CREATE INDIVIDUAL INSTANCE VARIABLES END ===');
    return allVariables;
  }
  
  /**
   * Get property definition for a given property name
   */
  private static getPropertyDefinition(instance: any, propertyName: string): any {
    // Try to get property definition from the instance's main component
    if (instance.mainComponent && 'componentPropertyDefinitions' in instance.mainComponent) {
      const definitions = (instance.mainComponent as any).componentPropertyDefinitions;
      return definitions[propertyName];
    }
    
    // Try to get from parent component set if main component is a variant
    if (instance.mainComponent && instance.mainComponent.parent && 
        instance.mainComponent.parent.type === 'COMPONENT_SET' &&
        'componentPropertyDefinitions' in instance.mainComponent.parent) {
      const definitions = (instance.mainComponent.parent as any).componentPropertyDefinitions;
      return definitions[propertyName];
    }
    
    return null;
  }
  
  /**
   * Determine the correct variable type based on property definition and value
   */
  private static determineVariableType(propertyDefinition: any, value: string): 'STRING' | 'BOOLEAN' {
    if (propertyDefinition) {
      // Check the property definition type
      if (propertyDefinition.type === 'BOOLEAN') {
        return 'BOOLEAN';
      }
    }
    
    // Fallback: check the value itself
    if (value === 'true' || value === 'false') {
      return 'BOOLEAN';
    }
    
    // Default to string (Figma doesn't support NUMBER type for variables)
    return 'STRING';
  }
  
  /**
   * Find or create a variable with the given name, value, and type
   */
  private static findOrCreateVariable(variableCollection: any, variableName: string, value: string, variableType: 'STRING' | 'BOOLEAN'): any {
    // Check if variable already exists
    const existingVariable = variableCollection.variableIds
      .map((id: string) => figma.variables.getVariableById(id))
      .find((variable: any) => variable && variable.name === variableName);
    
    if (existingVariable) {
      console.log(`Using existing variable: ${variableName}`);
      return existingVariable;
    }
    
    // Create new variable with the correct type
    const newVariable = figma.variables.createVariable(
      variableName,
      variableCollection,
      variableType
    );
    
    // Set the initial value with proper type conversion
    let convertedValue: any = value;
    if (variableType === 'BOOLEAN') {
      convertedValue = value === 'true';
    }
    
    newVariable.setValueForMode(variableCollection.defaultModeId, convertedValue);
    
    console.log(`Created new variable: ${variableName} with value: ${convertedValue} (type: ${variableType})`);
    return newVariable;
  }
  
  /**
   * Create state variables for each property (kept for reference)
   */
  static createStateVariables(
    variableCollection: any,
    instanceName: string,
    propertyGroups: any[]
  ): any[] {
    console.log('=== CREATE STATE VARIABLES ===');
    console.log('Variable collection:', variableCollection.name);
    console.log('Instance name:', instanceName);
    console.log('Property groups:', propertyGroups);
    
    const variables: any[] = [];
    
    propertyGroups.forEach((propertyGroup) => {
      const { propertyName, selectedVariant } = propertyGroup;
      console.log(`Processing property: ${propertyName} = ${selectedVariant}`);
      
      // Create variable name that includes instance and property
      const variableName = `${instanceName}_${propertyName}`;
      console.log(`Variable name: ${variableName}`);
      
      // Check if variable already exists
      const existingVariable = variableCollection.variableIds
        .map((id: string) => figma.variables.getVariableById(id))
        .find((variable: any) => variable && variable.name === variableName);
      
      if (existingVariable) {
        variables.push(existingVariable);
        console.log(`Using existing variable: ${variableName}`);
      } else {
        // Create new variable
        const newVariable = figma.variables.createVariable(
          variableName,
          variableCollection,
          'STRING'
        );
        
        // Set the initial value to the selected variant
        newVariable.setValueForMode(variableCollection.defaultModeId, selectedVariant);
        
        variables.push(newVariable);
        console.log(`Created new variable: ${variableName} with value: ${selectedVariant}`);
      }
    });
    
    console.log(`Created ${variables.length} variables:`, variables.map(v => v.name));
    console.log('=== CREATE STATE VARIABLES END ===');
    return variables;
  }
  
  /**
   * Set up click reactions on instances of the first instance type
   * Creates real prototype interactions that set variables when instances are clicked
   */
  static async setupClickReactions(
    firstInstanceName: string, 
    secondInstanceName: string,
    firstPropertyGroups: any[], 
    otherPropertyGroups: any[]
  ): Promise<void> {
    console.log('=== SETUP CLICK REACTIONS START ===');
    console.log('First instance name:', firstInstanceName);
    console.log('Second instance name:', secondInstanceName);
    console.log('First property groups:', firstPropertyGroups);
    console.log('Other property groups:', otherPropertyGroups);
    
    // Find instances of the second type within the current selection context
    const instances = this.findInstancesInSelectionContext(secondInstanceName);
    console.log('Found instances in selection context:', instances.length, instances.map(i => i.name));
    
    if (instances.length === 0) {
      throw new Error(`No instances found with name: ${secondInstanceName} in the current selection context`);
    }
    
    // Create a variable collection for all state variables
    const variableCollection = this.findOrCreateVariableCollection('State Machine Variables');
    console.log('Variable collection:', variableCollection.name, variableCollection.id);
    
    // Create individual variables for each instance
    const allInstanceVariables = this.createIndividualInstanceVariables(
      variableCollection, 
      instances, 
      firstPropertyGroups, 
      otherPropertyGroups
    );
    console.log('Created variables for all instances:', allInstanceVariables);
    
    // Create a destination frame for navigation
    const destinationFrame = this.createDestinationFrame(secondInstanceName);
    console.log('Destination frame:', destinationFrame.name, destinationFrame.id);
    
    // Set up prototype interactions for each instance
    for (const instance of instances) {
      console.log(`Setting up interaction for instance: ${instance.name}`);
      await this.createPrototypeInteraction(
        instance, 
        destinationFrame, 
        allInstanceVariables,
        firstPropertyGroups,
        otherPropertyGroups,
        instances
      );
    }
    
    // Set up variable bindings for all instances
    for (const instance of instances) {
      console.log(`Setting up variable bindings for instance: ${instance.name}`);
      this.setupVariableBinding(instance, allInstanceVariables);
    }
    
    console.log(`Set up prototype interactions for ${instances.length} instances of type: ${secondInstanceName}`);
    console.log(`Set up variable bindings for all instances`);
    console.log('=== SETUP CLICK REACTIONS END ===');
  }
  
  /**
   * Create a destination frame for the prototype interaction
   */
  private static createDestinationFrame(instanceName: string): any {
    const frameName = `${instanceName} State Machine`;
    
    // Check if frame already exists in the current page
    const currentPage = figma.currentPage;
    const existingFrame = currentPage.children.find((child: any) => child.name === frameName);
    if (existingFrame) {
      return existingFrame;
    }
    
    // Create new frame
    const frame = figma.createFrame();
    frame.name = frameName;
    frame.resize(400, 300);
    frame.x = 0;
    frame.y = 0;
    
    // Add to current page
    currentPage.appendChild(frame);
    
    return frame;
  }
  
  /**
   * Create a real prototype interaction for an instance using Figma's reactions API
   */
  private static async createPrototypeInteraction(
    instance: any, 
    destinationFrame: any, 
    allInstanceVariables: any[],
    firstPropertyGroups: any[],
    otherPropertyGroups: any[],
    allInstances: any[]
  ): Promise<void> {
    try {
      console.log(`=== CREATE PROTOTYPE INTERACTION DEBUG ===`);
      console.log(`Instance: ${instance.name}`);
      console.log(`First property groups:`, firstPropertyGroups);
      console.log(`Other property groups:`, otherPropertyGroups);
      console.log(`All instance variables:`, allInstanceVariables.map((v: any) => v.name));
      console.log(`=== END DEBUG ===`);
      
      // Create actions array
      const actions: any[] = [];
      
      // Get the current instance index to identify which instance is being clicked
      const currentInstanceIndex = allInstances.findIndex((inst: any) => inst.id === instance.id);
      console.log(`Current instance index: ${currentInstanceIndex}`);
      
      // Create SET_VARIABLE actions for all instances and their properties
      allInstanceVariables.forEach((variable: any) => {
        // Extract instance name, property, and instance index from variable name
        const variableNameParts = variable.name.split('_');
        const instanceName = variableNameParts[0];
        const propertyName = variableNameParts[1];
        const variableInstanceIndex = parseInt(variableNameParts[2]);
        
        console.log(`Processing variable: ${variable.name} (instance ${variableInstanceIndex})`);
        
        let targetValue = null;
        let shouldSetVariable = false;
        
        // "Set" section: Only set variables for the clicked instance
        const firstPropertyGroup = firstPropertyGroups.find((pg: any) => pg.propertyName === propertyName);
        if (firstPropertyGroup && variableInstanceIndex === currentInstanceIndex) {
          targetValue = firstPropertyGroup.selectedVariant;
          shouldSetVariable = true;
          console.log(`Setting clicked instance variable: ${variable.name} = ${targetValue}`);
        }
        
        // "And set other" section: Set variables for all OTHER instances (not the clicked one)
        const otherPropertyGroup = otherPropertyGroups.find((pg: any) => pg.propertyName === propertyName);
        if (otherPropertyGroup && otherPropertyGroup.selectedVariant !== 'keep-initial' && variableInstanceIndex !== currentInstanceIndex) {
          targetValue = otherPropertyGroup.selectedVariant;
          shouldSetVariable = true;
          console.log(`Setting other instance variable: ${variable.name} = ${targetValue}`);
        }
        
        if (shouldSetVariable && targetValue) {
          actions.push({
            type: 'SET_VARIABLE',
            variableId: variable.id,
            variableValue: {
              resolvedType: 'STRING',
              type: 'STRING',
              value: targetValue
            }
          });
          console.log(`Added SET_VARIABLE action for ${variable.name} = ${targetValue}`);
        }
      });
      
      // 3. Navigate to the destination frame (commented out for now - focus on variable setting)
      // actions.push({
      //   type: 'NODE',
      //   navigation: 'NAVIGATE',
      //   destinationId: destinationFrame.id,
      //   transition: null
      // });
      
      // Create the reaction object
      const reaction = {
        trigger: { type: 'ON_CLICK' },
        actions: actions
      };
      
      // Log the reaction object only for the first instance to avoid log spam
      if (instance && instance.parent && instance.parent.children && instance.parent.children[0] === instance) {
        // Shallow copy for concise log
        const shallowReaction = {
          ...reaction,
          actions: reaction.actions.map(a => ({ ...a }))
        };
        console.log('Sample reaction object for first instance:', JSON.stringify(shallowReaction, null, 2));
      }
      
      // Try to set the reaction and log any errors
      try {
        // First try with just variable setting to test basic structure
        const testReaction = {
          trigger: { type: 'ON_CLICK' },
          actions: [{
            type: 'SET_VARIABLE',
            variableId: allInstanceVariables[0].id,
            variableValue: {
              resolvedType: 'STRING',
              type: 'STRING',
              value: 'Test Value'
            }
          }]
        };
        
        console.log(`Testing with minimal reaction:`, JSON.stringify(testReaction, null, 2));
        await instance.setReactionsAsync([testReaction]);
        console.log(`Successfully set minimal reaction for instance: ${instance.name}`);
        
        // If minimal reaction works, try the full reaction
        console.log(`Now trying full reaction with variables...`);
        await instance.setReactionsAsync([reaction]);
        console.log(`Successfully set full reaction for instance: ${instance.name}`);
      } catch (setError) {
        console.error(`Error in setReactionsAsync for ${instance.name}:`, setError);
        console.error(`Full error details:`, JSON.stringify(setError, null, 2));
        throw setError;
      }
      
      console.log(`Created real prototype interaction for instance: ${instance.name}`);
      console.log(`Actions:`, actions);
      console.log(`Destination frame: ${destinationFrame.name}`);
      
    } catch (error) {
      console.error(`Error creating prototype interaction for ${instance.name}:`, error);
      
      // Fallback: create a simple reaction with just variable setting
      try {
        const fallbackReaction = {
          trigger: { type: 'ON_CLICK' },
          actions: [{
            type: 'SET_VARIABLE',
            variableId: allInstanceVariables[0].id,
            variableValue: {
              resolvedType: 'STRING',
              type: 'STRING',
              value: 'Fallback Value'
            }
          }]
        };
        
        await instance.setReactionsAsync([fallbackReaction]);
        console.log(`Created fallback prototype interaction for instance: ${instance.name}`);
      } catch (fallbackError) {
        console.error(`Failed to create even fallback interaction:`, fallbackError);
      }
    }
  }
  
  /**
   * Set up variable binding for an instance
   * This binds instance properties to variables so they update when variables change
   */
  private static setupVariableBinding(instance: any, variables: any[]): void {
    try {
      console.log(`Setting up variable binding for instance: ${instance.name}`);
      console.log(`Instance component properties:`, instance.componentProperties);
      console.log(`Variables to bind:`, variables.map(v => ({ name: v.name, id: v.id })));
      
      // For each variable, try to bind it to the corresponding instance property
      variables.forEach((variable) => {
        const propertyName = variable.name.split('_').pop(); // Get property name from variable name
        console.log(`Looking for property: ${propertyName} in instance ${instance.name}`);
        
        if (propertyName && instance.componentProperties) {
          const property = instance.componentProperties[propertyName];
          console.log(`Found property:`, property);
          
          if (property) {
            // Bind the variable to the property
            property.binding = {
              type: 'VARIABLE',
              variableId: variable.id
            };
            
            console.log(`Successfully bound variable ${variable.name} to property ${propertyName} on instance ${instance.name}`);
          } else {
            console.log(`Property ${propertyName} not found in instance ${instance.name}`);
          }
        } else {
          console.log(`No component properties found for instance ${instance.name} or property name is empty`);
        }
      });
    } catch (error) {
      console.error(`Error setting up variable binding for ${instance.name}:`, error);
    }
  }
  
  /**
   * Find instances with a specific name within the current selection context
   */
  private static findInstancesInSelectionContext(instanceName: string): any[] {
    const instances: any[] = [];
    const currentSelection = figma.currentPage.selection;
    
    // If nothing is selected, return empty array
    if (currentSelection.length === 0) {
      console.log('No current selection, cannot find instances in context');
      return instances;
    }
    
    // Function to traverse a node and find instances
    function traverseNode(node: any) {
      if (node.type === 'INSTANCE' && node.name === instanceName) {
        instances.push(node);
      }
      
      if ('children' in node) {
        node.children.forEach(traverseNode);
      }
    }
    
    // Traverse each selected node and its children
    currentSelection.forEach(selectedNode => {
      traverseNode(selectedNode);
    });
    
    console.log(`Found ${instances.length} instances of "${instanceName}" in current selection context`);
    return instances;
  }
  
  /**
   * Find all instances with a specific name across the document (kept for reference)
   */
  private static findAllInstancesByName(instanceName: string): any[] {
    const instances: any[] = [];
    
    function traverseNode(node: any) {
      if (node.type === 'INSTANCE' && node.name === instanceName) {
        instances.push(node);
      }
      
      if ('children' in node) {
        node.children.forEach(traverseNode);
      }
    }
    
    // Traverse all pages
    figma.root.children.forEach(page => {
      page.children.forEach(traverseNode);
    });
    
    return instances;
  }
  
  /**
   * Handle interaction setup messages from the UI
   */
  static async handleInteractionMessage(message: any): Promise<any> {
    switch (message.type) {
      case 'find-or-create-variable-collection':
        try {
          const collection = this.findOrCreateVariableCollection(message.collectionName);
          return {
            success: true,
            data: collection,
            messageId: message.messageId
          };
        } catch (error) {
          return {
            success: false,
            error: (error as Error).message,
            messageId: message.messageId
          };
        }
        
      case 'create-state-variables':
        try {
          const variables = this.createStateVariables(
            message.variableCollection,
            message.instanceName,
            message.propertyGroups
          );
          return {
            success: true,
            data: variables,
            messageId: message.messageId
          };
        } catch (error) {
          return {
            success: false,
            error: (error as Error).message,
            messageId: message.messageId
          };
        }
        
      case 'setup-click-reactions':
        try {
          await this.setupClickReactions(
            message.firstInstanceName,
            message.secondInstanceName,
            message.firstPropertyGroups || [],
            message.otherPropertyGroups || []
          );
          return {
            success: true,
            messageId: message.messageId
          };
        } catch (error) {
          return {
            success: false,
            error: (error as Error).message,
            messageId: message.messageId
          };
        }
        
      default:
        return {
          success: false,
          error: 'Unknown message type',
          messageId: message.messageId
        };
    }
  }
} 