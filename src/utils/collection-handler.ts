export function getVariableByName(name: string): Variable | undefined {
    return figma.variables.getLocalVariables().find(v => v.name === name)
  }
  
  export function getCollectionByName(name: string): VariableCollection | undefined {
    return figma.variables.getLocalVariableCollections().find(c => c.name === name)
  }
  
  export function getVariablesForCollection(collectionId: string): Variable[] {
    return figma.variables.getLocalVariables().filter(v => v.variableCollectionId === collectionId)
  }
  
  export function getVariableValue(variable: Variable, modeId: string) {
    return variable.valuesByMode[modeId]
  }
  
  export function setVariableValue(variable: Variable, modeId: string, value: VariableValue) {
    variable.setValueForMode(modeId, value)
  }
  