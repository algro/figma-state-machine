// Interaction Manager - Handles variable collection and click reactions setup

export class InteractionManager {
  
  /**
   * Set up click interactions between two instance selections
   */
  static async setupClickInteractions(
    firstInstanceName: string,
    secondInstanceName: string,
    firstPropertyGroups: any[],
    otherPropertyGroups: any[],
    exclusiveMode: boolean = false
  ): Promise<void> {
    try {
      // Set up click reactions using the new unified API
      // exclusiveMode = true means only one instance per state (toggle behavior)
      // exclusiveMode = false means multiple instances allowed
      await this.setupClickReactions(firstInstanceName, secondInstanceName, firstPropertyGroups, otherPropertyGroups, exclusiveMode);
      
      
      
    } catch (error) {
      console.error('Error setting up click interactions:', error);
      throw error;
    }
  }
  
  /**
   * Set up click reactions on first instance instances
   */
  private static async setupClickReactions(
    firstInstanceName: string, 
    secondInstanceName: string,
    firstPropertyGroups: any[], 
    otherPropertyGroups: any[],
    exclusiveMode: boolean = false
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const messageId = Date.now().toString();
      
      const handleResponse = (event: MessageEvent) => {
        const message = event.data.pluginMessage;
        if (message && message.type === 'click-reactions-response' && message.messageId === messageId) {
          window.removeEventListener('message', handleResponse);
          if (message.success) {
            resolve();
          } else {
            reject(new Error(message.error));
          }
        }
      };
      
      window.addEventListener('message', handleResponse);
      
      parent.postMessage({
        pluginMessage: {
          type: 'setup-click-reactions',
          messageId: messageId,
          firstInstanceName: firstInstanceName,
          secondInstanceName: secondInstanceName,
          firstPropertyGroups: firstPropertyGroups,
          otherPropertyGroups: otherPropertyGroups,
          exclusiveMode: exclusiveMode
        }
      }, '*');
    });
  }
  
  /**
   * Get current property group values from the UI
   */
  static getPropertyGroupValues(containerId: string): any[] {
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    const propertyGroups: any[] = [];
    const propertyGroupElements = container.querySelectorAll('.property-group');
    
    propertyGroupElements.forEach((groupElement) => {
      const propertyNameElement = groupElement.querySelector('.property-name');
      const variantsSelect = groupElement.querySelector('select') as HTMLSelectElement;
      
      if (propertyNameElement && variantsSelect) {
        propertyGroups.push({
          propertyName: propertyNameElement.textContent,
          selectedVariant: variantsSelect.value
        });
      }
    });
    
    return propertyGroups;
  }
  
  /**
   * Get selected instance name from the click target dropdown
   */
  static getSelectedInstances(): { firstInstance: string, secondInstance: string } {
    const clickTargetSelect = document.getElementById('click-target') as HTMLSelectElement;
    
    if (clickTargetSelect) {
      const selectedInstance = clickTargetSelect.value;
      return {
        firstInstance: selectedInstance,
        secondInstance: selectedInstance // Use the same instance for both
      };
    }
    
    return { firstInstance: '', secondInstance: '' };
  }
} 