// Plugin Interaction Handler - Handles variable collection and reactions on the plugin side

export class PluginInteractionHandler {
  
  /**
   * Find or create a variable collection by name
   */
  static async findOrCreateVariableCollection(collectionName: string): Promise<any> {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const existingCollection = collections.find((c: any) => c.name === collectionName);
    
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
  static async createIndividualInstanceVariables(
    variableCollection: any,
    instances: any[],
    firstPropertyGroups: any[],
    otherPropertyGroups: any[]
  ): Promise<any[]> {
    console.log('=== CREATE INDIVIDUAL INSTANCE VARIABLES ===');
    console.log('Variable collection:', variableCollection.name);
    console.log('Instances:', instances.length);
    console.log('First property groups:', firstPropertyGroups);
    console.log('Other property groups:', otherPropertyGroups);
    
    const allVariables: any[] = [];
    
    // Create variables for each instance
    for (let instanceIndex = 0; instanceIndex < instances.length; instanceIndex++) {
      const instance = instances[instanceIndex];
      console.log(`Creating variables for instance ${instanceIndex + 1}: ${instance.name}`);
      
      // Create variables for "Set" properties (first property groups)
      for (const propertyGroup of firstPropertyGroups) {
        const { propertyName } = propertyGroup;
        
        // Only create variable if the property exists on this instance
        if (instance.componentProperties && instance.componentProperties[propertyName]) {
          const variableName = `${instance.name}_${propertyName}_${instanceIndex}`;
          
          // Get the current value of this property on this instance
          const currentProperty = instance.componentProperties[propertyName];
          let currentValue = currentProperty && typeof currentProperty === 'object' && 'value' in currentProperty 
            ? currentProperty.value 
            : currentProperty;
          
          // Get property definition to determine variable type
          const propertyDefinition = await this.getPropertyDefinition(instance, propertyName);
          let variableType = this.determineVariableType(propertyDefinition, String(currentValue));
          // For VARIANT properties, always use STRING and ensure value is valid
          if (propertyDefinition && propertyDefinition.type === 'VARIANT') {
            variableType = 'STRING';
            if (
              propertyDefinition.variantOptions &&
              !propertyDefinition.variantOptions.includes(String(currentValue))
            ) {
              // Fallback to the first variant option if currentValue is not valid
              currentValue = propertyDefinition.variantOptions[0];
              console.warn(`Current value for ${propertyName} is not a valid variant. Falling back to:`, currentValue);
            }
          }
          
          console.log(`Creating variable for ${propertyName} with current value: ${currentValue} (type: ${variableType})`);
          const variable = await this.findOrCreateVariable(variableCollection, variableName, String(currentValue), variableType);
          allVariables.push(variable);
          console.log(`Created variable: ${variableName} = ${currentValue} (type: ${variableType})`);
        } else {
          console.log(`Skipping variable for ${propertyName} - property not found on instance ${instance.name}`);
        }
      }
      
      // Create variables for "And set other" properties (other property groups)
      for (const propertyGroup of otherPropertyGroups) {
        const { propertyName, selectedVariant } = propertyGroup;
        
        if (selectedVariant !== 'keep-initial') {
          // Only create variable if the property exists on this instance
          if (instance.componentProperties && instance.componentProperties[propertyName]) {
            const variableName = `${instance.name}_${propertyName}_${instanceIndex}`;
            
            // Get the current value of this property on this instance
            const currentProperty = instance.componentProperties[propertyName];
            let currentValue = currentProperty && typeof currentProperty === 'object' && 'value' in currentProperty 
              ? currentProperty.value 
              : currentProperty;
            
            // Get property definition to determine variable type
            const propertyDefinition = await this.getPropertyDefinition(instance, propertyName);
            let variableType = this.determineVariableType(propertyDefinition, String(currentValue));
            // For VARIANT properties, always use STRING and ensure value is valid
            if (propertyDefinition && propertyDefinition.type === 'VARIANT') {
              variableType = 'STRING';
              if (
                propertyDefinition.variantOptions &&
                !propertyDefinition.variantOptions.includes(String(currentValue))
              ) {
                // Fallback to the first variant option if currentValue is not valid
                currentValue = propertyDefinition.variantOptions[0];
                console.warn(`Current value for ${propertyName} is not a valid variant. Falling back to:`, currentValue);
              }
            }
            
            console.log(`Creating variable for ${propertyName} with current value: ${currentValue} (type: ${variableType})`);
            const variable = await this.findOrCreateVariable(variableCollection, variableName, String(currentValue), variableType);
            allVariables.push(variable);
            console.log(`Created variable: ${variableName} = ${currentValue} (type: ${variableType})`);
          } else {
            console.log(`Skipping variable for ${propertyName} - property not found on instance ${instance.name}`);
          }
        } else {
          console.log(`Skipping variable for ${instance.name}_${propertyName}_${instanceIndex} (keep-initial)`);
        }
      }
    }
    
    console.log(`Created ${allVariables.length} total variables for all instances`);
    console.log('=== CREATE INDIVIDUAL INSTANCE VARIABLES END ===');
    return allVariables;
  }
  
  /**
   * Get property definition for a given property name
   */
  private static async getPropertyDefinition(instance: any, propertyName: string): Promise<any> {
    console.log(`Getting property definition for ${propertyName} on instance: ${instance.name}`);
    const mainComponent = await instance.getMainComponentAsync();
    console.log(`Instance mainComponent:`, mainComponent);
    
    try {
      // First, try to get from parent component set if main component is a variant
      if (mainComponent && mainComponent.parent && 
          mainComponent.parent.type === 'COMPONENT_SET') {
        try {
          const definitions = (mainComponent.parent as any).componentPropertyDefinitions;
          console.log(`Found definitions in parent component set:`, definitions);
          const definition = definitions[propertyName];
          console.log(`Property definition for ${propertyName}:`, definition);
          return definition;
        } catch (error) {
          console.log(`Could not get definitions from parent component set:`, error);
        }
      }
      
      // Then try to get property definition from the instance's main component (only if it's not a variant)
      if (mainComponent && mainComponent.type !== 'COMPONENT') {
        try {
          const definitions = (mainComponent as any).componentPropertyDefinitions;
          console.log(`Found definitions in mainComponent:`, definitions);
          const definition = definitions[propertyName];
          console.log(`Property definition for ${propertyName}:`, definition);
          return definition;
        } catch (error) {
          console.log(`Could not get definitions from mainComponent:`, error);
        }
      }
      
      console.log(`No property definition found for ${propertyName}`);
      return null;
    } catch (error) {
      console.log(`Error getting property definition:`, error);
      return null;
    }
  }
  


  /**
   * Get the default (first) variant for a property
   */
  private static async getDefaultVariantForProperty(instance: any, propertyName: string): Promise<string | null> {
    console.log(`Getting default variant for property ${propertyName} on instance: ${instance.name}`);
    
    const propertyDefinition = await this.getPropertyDefinition(instance, propertyName);
    if (!propertyDefinition) {
      console.log(`No property definition found for ${propertyName}`);
      return null;
    }
    
    // Check if it has variant options (for VARIANT type properties)
    if (propertyDefinition.variantOptions && propertyDefinition.variantOptions.length > 0) {
      const defaultVariant = propertyDefinition.variantOptions[0];
      console.log(`Default variant for ${propertyName}: ${defaultVariant}`);
      return defaultVariant;
    }
    
    // Check if it has preferred values
    if (propertyDefinition.preferredValues && propertyDefinition.preferredValues.length > 0) {
      const defaultVariant = propertyDefinition.preferredValues[0].name || propertyDefinition.preferredValues[0];
      console.log(`Default variant from preferred values for ${propertyName}: ${defaultVariant}`);
      return defaultVariant;
    }
    
    // For boolean properties, default to false
    if (propertyDefinition.type === 'BOOLEAN') {
      console.log(`Default variant for boolean property ${propertyName}: false`);
      return 'false';
    }
    
    // Fallback: try to get the default value from the definition
    if (propertyDefinition.defaultValue !== undefined) {
      const defaultVariant = String(propertyDefinition.defaultValue);
      console.log(`Default variant from definition for ${propertyName}: ${defaultVariant}`);
      return defaultVariant;
    }
    
    console.log(`Could not determine default variant for ${propertyName}`);
    return null;
  }

  /**
   * Determine the correct variable type based on property definition and value
   */
  private static determineVariableType(propertyDefinition: any, value: string): 'STRING' | 'BOOLEAN' {
    console.log(`Determining variable type for value: "${value}"`);
    console.log(`Property definition:`, propertyDefinition);
    
    if (propertyDefinition) {
      // Check the property definition type
      if (propertyDefinition.type === 'BOOLEAN') {
        console.log(`Property is explicitly BOOLEAN type`);
        return 'BOOLEAN';
      }
      
      // Check if it's a variant property with boolean-like options
      if (propertyDefinition.type === 'VARIANT' && propertyDefinition.variantOptions) {
        const variantOptions = propertyDefinition.variantOptions;
        console.log(`Variant options:`, variantOptions);
        
        // Check if all variant options are boolean-like
        const booleanLikeOptions = ['Yes', 'No', 'True', 'False', 'true', 'false', 'yes', 'no'];
        const allBooleanLike = variantOptions.every((option: string) => 
          booleanLikeOptions.includes(option)
        );
        
        if (allBooleanLike) {
          console.log(`All variant options are boolean-like, treating as BOOLEAN`);
          return 'BOOLEAN';
        }
      }
    }
    
    // Fallback: check the value itself
    const booleanValues = ['true', 'false', 'yes', 'no', 'True', 'False', 'Yes', 'No'];
    if (booleanValues.includes(value)) {
      console.log(`Value "${value}" is boolean-like, treating as BOOLEAN`);
      return 'BOOLEAN';
    }
    
    console.log(`Defaulting to STRING type`);
    return 'STRING';
  }
  
  /**
   * Find or create a variable with the given name, value, and type
   */
  private static async findOrCreateVariable(variableCollection: any, variableName: string, value: string, variableType: 'STRING' | 'BOOLEAN'): Promise<any> {
    // Check if variable already exists
    const existingVariablePromises = variableCollection.variableIds
      .map(async (id: string) => await figma.variables.getVariableByIdAsync(id));
    const existingVariables = await Promise.all(existingVariablePromises);
    const existingVariable = existingVariables.find((variable: any) => variable && variable.name === variableName);
    
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
      // Convert various boolean-like values to actual boolean
      const trueValues = ['true', 'True', 'yes', 'Yes'];
      convertedValue = trueValues.includes(value);
      console.log(`Converted "${value}" to boolean: ${convertedValue}`);
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
      const existingVariablePromises = variableCollection.variableIds
        .map(async (id: string) => await figma.variables.getVariableByIdAsync(id));
      Promise.all(existingVariablePromises).then(existingVariables => {
        const existingVariable = existingVariables.find((variable: any) => variable && variable.name === variableName);
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
    });
    
    console.log(`Created ${variables.length} variables:`, variables.map(v => v.name));
    console.log('=== CREATE STATE VARIABLES END ===');
    return variables;
  }
  
  /**
   * Set up mouse down reactions on instances of the first instance type
   * Creates real prototype interactions that set variables when instances are pressed
   */
  static async setupClickReactions(
    firstInstanceName: string, 
    secondInstanceName: string,
    firstPropertyGroups: any[], 
    otherPropertyGroups: any[]
  ): Promise<void> {
    try {
      console.log('=== SETUP MOUSE DOWN REACTIONS START ===');
      console.log('First instance name:', firstInstanceName);
      console.log('Second instance name:', secondInstanceName);
      console.log('First property groups:', firstPropertyGroups);
      console.log('Other property groups:', otherPropertyGroups);
      console.log('Radio behavior mode enabled');
    
    // Find instances of the second type within the current selection context
    const instances = this.findInstancesInSelectionContext(secondInstanceName);
    console.log('Found instances in selection context:', instances.length, instances.map(i => i.name));
    
    // Filter out instances with broken component sets
    const validInstances = instances.filter(instance => {
      try {
        // Test if we can access component properties without error
        instance.componentProperties;
        return true;
      } catch (error) {
        console.warn(`Skipping instance "${instance.name}" due to broken component set:`, error);
        return false;
      }
    });
    
    console.log('Valid instances (without broken component sets):', validInstances.length, validInstances.map(i => i.name));
    
    if (validInstances.length === 0) {
      throw new Error(`No valid instances found with name: ${secondInstanceName} in the current selection context`);
    }
    
    // STEP 1: Create a variable collection for all state variables
    const variableCollection = await this.findOrCreateVariableCollection('State Machine Variables');
    console.log('Variable collection:', variableCollection.name, variableCollection.id);
    

    
    // STEP 3: Create individual variables for each instance
    const allInstanceVariables = await this.createIndividualInstanceVariables(
      variableCollection, 
      validInstances, 
      firstPropertyGroups, 
      otherPropertyGroups
    );
    console.log('Created variables for all instances:', allInstanceVariables);
    
    // STEP 3: Set up variable bindings FIRST (before creating interactions)
    console.log('=== SETTING UP VARIABLE BINDINGS ===');
    
    // Small delay to ensure variables are fully created
    await new Promise(resolve => setTimeout(resolve, 100));
    
    for (let i = 0; i < validInstances.length; i++) {
      const instance = validInstances[i];
      console.log(`Setting up variable bindings for instance: ${instance.name}`);
      await this.setupVariableBinding(instance, allInstanceVariables, i);
    }
    console.log('=== VARIABLE BINDINGS COMPLETE ===');
    
    // STEP 4: Create a destination frame for navigation
    const destinationFrame = this.createDestinationFrame(secondInstanceName);
    console.log('Destination frame:', destinationFrame.name, destinationFrame.id);
    
    // STEP 5: Set up prototype interactions for each instance (AFTER variable binding)
    console.log('=== SETTING UP PROTOTYPE INTERACTIONS ===');
    for (const instance of validInstances) {
      console.log(`Setting up interaction for instance: ${instance.name}`);
      await this.createPrototypeInteraction(
        instance, 
        destinationFrame, 
        allInstanceVariables,
        firstPropertyGroups,
        otherPropertyGroups,
        validInstances
      );
    }
    
    console.log(`Set up mouse down prototype interactions for ${validInstances.length} instances of type: ${secondInstanceName}`);
    console.log(`Set up variable bindings for all instances`);
    
    // Notify Figma UI to refresh and show the variable bindings
    console.log('Notifying UI to refresh variable bindings...');
    
    console.log('=== SETUP MOUSE DOWN REACTIONS END ===');
    } catch (error) {
      console.error('Error in setupClickReactions:', error);
      throw error;
    }
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
      
      // Get the current instance index to identify which instance is being pressed
      const currentInstanceIndex = allInstances.findIndex((inst: any) => inst.id === instance.id);
      console.log(`Current instance index: ${currentInstanceIndex}`);
      
      // Create SET_VARIABLE actions for all instances and their properties
      for (const variable of allInstanceVariables) {
        // Check if variable has a valid name
        if (!variable.name || typeof variable.name !== 'string') {
          console.error(`Variable has invalid name:`, variable);
          continue;
        }
        // Extract instance name, property, and instance index from variable name
        const variableNameParts = variable.name.split('_');
        const instanceName = variableNameParts[0];
        const propertyName = variableNameParts[1];
        const variableInstanceIndex = parseInt(variableNameParts[2]);
        
        console.log(`Processing variable: ${variable.name} (instance ${variableInstanceIndex})`);
        
        let targetValue = null;
        let shouldSetVariable = false;
        
        // Check if this is the pressed instance
        if (variableInstanceIndex === currentInstanceIndex) {
          // "Set pressed instance to" section: Set variables for the pressed instance
          const firstPropertyGroup = firstPropertyGroups.find((pg: any) => pg.propertyName === propertyName);
          if (firstPropertyGroup) {
            const pressedInstance = allInstances[currentInstanceIndex];
            const targetState = firstPropertyGroup.selectedVariant;
            
            // Radio behavior: Always set pressed instance to target state
            targetValue = targetState;
            console.log(`Setting pressed instance variable: ${variable.name} = ${targetValue}`);
            shouldSetVariable = true;
          }
        } else {
          // "And set all other instances to" section: Set variables for all OTHER instances (not the pressed one)
          const pressedInstancePropertyGroup = firstPropertyGroups.find((pg: any) => pg.propertyName === propertyName);
          
          // Only process this property if it's actually being set on the pressed instance
          if (pressedInstancePropertyGroup) {
            const targetInstance = allInstances[variableInstanceIndex];
            if (targetInstance && targetInstance.componentProperties && targetInstance.componentProperties[propertyName]) {
              const currentProperty = targetInstance.componentProperties[propertyName];
              const currentValue = currentProperty.value || currentProperty;
              const pressedInstanceTargetValue = pressedInstancePropertyGroup.selectedVariant;
              
              // Only reset THIS property if it currently has the same value that the pressed instance will be set to
              if (currentValue === pressedInstanceTargetValue) {
                // Use "And set all other instances to" configuration, but ignore "keep-initial" for resets
                const otherPropertyGroup = otherPropertyGroups.find((pg: any) => pg.propertyName === propertyName);
                if (otherPropertyGroup && otherPropertyGroup.selectedVariant !== 'keep-initial') {
                  targetValue = otherPropertyGroup.selectedVariant;
                  shouldSetVariable = true;
                  console.log(`Radio behavior: Resetting conflicting property ${propertyName} to "other instances" value: ${variable.name} = ${targetValue} (was ${currentValue})`);
                } else {
                  // Use default value when "keep-initial" is set or no config exists
                  const defaultValue = await this.getDefaultVariantForProperty(targetInstance, propertyName);
                  if (defaultValue) {
                    targetValue = defaultValue;
                    shouldSetVariable = true;
                    console.log(`Radio behavior: Resetting conflicting property ${propertyName} to default (ignoring "keep-initial"): ${variable.name} = ${targetValue} (was ${currentValue})`);
                  }
                }
              } else {
                // Keep the current value for this property - don't change it
                targetValue = currentValue;
                shouldSetVariable = true;
                console.log(`Radio behavior: Keeping property ${propertyName} unchanged: ${variable.name} = ${targetValue}`);
              }
            }
          } else {
            // This property is not being set on the pressed instance, so keep it unchanged
            const targetInstance = allInstances[variableInstanceIndex];
            if (targetInstance && targetInstance.componentProperties && targetInstance.componentProperties[propertyName]) {
              const currentProperty = targetInstance.componentProperties[propertyName];
              targetValue = currentProperty.value || currentProperty;
              shouldSetVariable = true;
              console.log(`Radio behavior: Property ${propertyName} not being set, keeping unchanged: ${variable.name} = ${targetValue}`);
            }
          }
        }
        
        if (shouldSetVariable && targetValue !== null) {
          // Get the variable type and convert the value accordingly
          const variableType = variable.resolvedType || 'STRING';
          let convertedValue = targetValue;
          
          if (variableType === 'BOOLEAN') {
            // Convert string values to boolean
            const trueValues = ['true', 'True', 'yes', 'Yes'];
            convertedValue = trueValues.includes(targetValue);
            console.log(`Converting "${targetValue}" to boolean: ${convertedValue}`);
          }
          
          actions.push({
            type: 'SET_VARIABLE',
            variableId: variable.id,
            variableValue: {
              resolvedType: variableType,
              type: variableType,
              value: convertedValue
            }
          });
          console.log(`Added SET_VARIABLE action for ${variable.name} = ${convertedValue} (type: ${variableType})`);
        }
      }
      
      console.log(`Created ${actions.length} SET_VARIABLE actions for instance ${currentInstanceIndex}`);
      
      // 3. Navigate to the destination frame (commented out for now - focus on variable setting)
      // actions.push({
      //   type: 'NODE',
      //   navigation: 'NAVIGATE',
      //   destinationId: destinationFrame.id,
      //   transition: null
      // });
      
      // Create the reaction object
      const reaction = {
        trigger: { type: 'MOUSE_DOWN', delay: 0 },
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
        const testVariable = allInstanceVariables[0];
        const testVariableType = testVariable.resolvedType || 'STRING';
        const testReaction = {
          trigger: { type: 'MOUSE_DOWN', delay: 0 },
          actions: [{
            type: 'SET_VARIABLE',
            variableId: testVariable.id,
            variableValue: {
              resolvedType: testVariableType,
              type: testVariableType,
              value: testVariableType === 'BOOLEAN' ? true : 'Test Value'
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
          trigger: { type: 'MOUSE_DOWN', delay: 0 },
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
  private static async setupVariableBinding(instance: any, allInstanceVariables: any[], instanceIndex: number): Promise<void> {
    try {
      console.log(`Setting up variable binding for instance: ${instance.name} (index: ${instanceIndex})`);
      console.log(`Instance component properties:`, Object.keys(instance.componentProperties || {}));
      
      // Get the variables that belong to this specific instance
      const instanceVariables = allInstanceVariables.filter(variable => {
        const variableNameParts = variable.name.split('_');
        if (variableNameParts.length >= 3) {
          const variableInstanceIndex = parseInt(variableNameParts[2]);
          return variableInstanceIndex === instanceIndex;
        }
        return false;
      });
      
      console.log(`Variables for this instance:`, instanceVariables.map(v => ({ name: v.name, id: v.id })));
      
      // Prepare properties object for setProperties
      const propertiesToSet: { [key: string]: any } = {};
      
      // For each property that exists on this instance, bind the corresponding variable
      if (instance.componentProperties) {
        for (const [propertyName, property] of Object.entries(instance.componentProperties)) {
          // Find the variable for this property and this instance
          const variable = instanceVariables.find(variable => {
            const variableNameParts = variable.name.split('_');
            return variableNameParts[1] === propertyName; // Property name is the second part
          });
          
          if (variable) {
            console.log(`Binding variable ${variable.name} to property ${propertyName}`);
            
            // Verify the variable exists and is accessible
            const verifiedVariable = await figma.variables.getVariableByIdAsync(variable.id);
            if (!verifiedVariable) {
              console.error(`Variable ${variable.name} (${variable.id}) not found in Figma variables, skipping binding for property ${propertyName}`);
              continue;
            }
            
            console.log(`Verified variable: ${verifiedVariable.name} (${verifiedVariable.id})`);
            
            // Check the current property value to ensure we're binding the right type
            const currentProperty = instance.componentProperties[propertyName];
            const currentValue = currentProperty && typeof currentProperty === 'object' && 'value' in currentProperty 
              ? currentProperty.value 
              : currentProperty;
            
            console.log(`Current property value for ${propertyName}:`, currentValue);
            
            // Verify the variable type matches the property type
            const variableType = verifiedVariable.resolvedType;
            console.log(`Variable type: ${variableType}, Current value type: ${typeof currentValue}`);
            
            // Only bind if the variable type is compatible with the property
            if (variableType === 'STRING' || variableType === 'BOOLEAN') {
              // Use the correct Figma API approach for component properties
              // Create a variable alias and set it as the property value
              const variableAlias = figma.variables.createVariableAlias(verifiedVariable);
              console.log(`Created variable alias for ${propertyName}:`, variableAlias);
              
              propertiesToSet[propertyName] = variableAlias;
            } else {
              console.error(`Variable type ${variableType} is not compatible with component property ${propertyName}`);
            }
          } else {
            console.log(`No variable found for property ${propertyName} on instance ${instance.name}`);
          }
        }
      }
      
      // Apply all property bindings at once using setProperties
      if (Object.keys(propertiesToSet).length > 0) {
        console.log(`Setting properties for instance ${instance.name}:`, propertiesToSet);
        
        try {
          // Set the properties using the correct API
          instance.setProperties(propertiesToSet);
          console.log(`Successfully bound variables to instance ${instance.name}`);
          
          // Verify the bindings were set correctly
          console.log(`Instance componentProperties after binding:`, instance.componentProperties);
          
          // Check if the properties were actually set
          for (const [propertyName, expectedAlias] of Object.entries(propertiesToSet)) {
            const actualProperty = instance.componentProperties[propertyName];
            console.log(`Property ${propertyName}:`, {
              expected: expectedAlias,
              actual: actualProperty,
              isAlias: actualProperty && typeof actualProperty === 'object' && 'type' in actualProperty && actualProperty.type === 'VARIABLE_ALIAS'
            });
          }
          
        } catch (setPropertiesError) {
          console.error(`Error setting properties for instance ${instance.name}:`, setPropertiesError);
          
          // Try alternative approach: set properties one by one
          console.log('Trying alternative approach: setting properties one by one');
          for (const [propertyName, variableAlias] of Object.entries(propertiesToSet)) {
            try {
              instance.setProperties({
                [propertyName]: variableAlias
              });
              console.log(`Successfully set property ${propertyName} for instance ${instance.name}`);
            } catch (singlePropertyError) {
              console.error(`Error setting property ${propertyName}:`, singlePropertyError);
            }
          }
        }
      } else {
        console.log(`No variables to bind for instance ${instance.name}`);
      }
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
    console.log('Handling interaction message:', message);
    
    try {
      switch (message.type) {
        case 'find-or-create-variable-collection':
          try {
            const collection = await this.findOrCreateVariableCollection(message.collectionName);
            return {
              success: true,
              data: collection,
              messageId: message.messageId
            };
          } catch (error) {
            console.error('Error in find-or-create-variable-collection:', error);
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
            console.error('Error in create-state-variables:', error);
            return {
              success: false,
              error: (error as Error).message,
              messageId: message.messageId
            };
          }
          
        case 'setup-mouse-down-reactions':
          try {
            console.log('Starting setup-mouse-down-reactions...');
            await this.setupClickReactions(
              message.firstInstanceName,
              message.secondInstanceName,
              message.firstPropertyGroups || [],
              message.otherPropertyGroups || []
            );
            console.log('setup-mouse-down-reactions completed successfully');
            return {
              success: true,
              messageId: message.messageId
            };
          } catch (error) {
            console.error('Error in setup-mouse-down-reactions:', error);
            return {
              success: false,
              error: (error as Error).message,
              messageId: message.messageId
            };
          }
          
        default:
          console.warn('Unknown message type:', message.type);
          return {
            success: false,
            error: 'Unknown message type',
            messageId: message.messageId
          };
      }
    } catch (error) {
      console.error('Unexpected error in handleInteractionMessage:', error);
      return {
        success: false,
        error: (error as Error).message,
        messageId: message.messageId
      };
    }
  }
} 