
// Interaction Manager - Handles variable collection and mouse down reactions setup

export class InteractionManager {
  
  /**
   * Set up mouse down interactions between two instance selections
   */
  static async setupClickInteractions(
    firstInstanceName: string,
    secondInstanceName: string,
    firstPropertyGroups: any[],
    otherPropertyGroups: any[]
  ): Promise<void> {
    try {
      // Set up mouse down reactions using the new unified API
      // Radio behavior: only one instance per state
      await this.setupClickReactions(firstInstanceName, secondInstanceName, firstPropertyGroups, otherPropertyGroups);
      
      
      
    } catch (error) {
      console.error('Error setting up mouse down interactions:', error);
      throw error;
    }
  }
  
  /**
   * Set up mouse down reactions on first instance instances
   */
  private static async setupClickReactions(
    firstInstanceName: string, 
    secondInstanceName: string,
    firstPropertyGroups: any[], 
    otherPropertyGroups: any[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const messageId = Date.now().toString();
      
      const handleResponse = (event: MessageEvent) => {
        const message = event.data.pluginMessage;
        if (message && message.type === 'mouse-down-reactions-response' && message.messageId === messageId) {
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
          type: 'setup-mouse-down-reactions',
          messageId: messageId,
          firstInstanceName: firstInstanceName,
          secondInstanceName: secondInstanceName,
          firstPropertyGroups: firstPropertyGroups,
          otherPropertyGroups: otherPropertyGroups
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
   * Get selected instance name from the mouse down target dropdown
   */
  static getSelectedInstances(): { firstInstance: string, secondInstance: string } {
    const mouseDownTargetSelect = document.getElementById('click-target') as HTMLSelectElement;
    
    if (mouseDownTargetSelect) {
      const selectedInstance = mouseDownTargetSelect.value;
      return {
        firstInstance: selectedInstance,
        secondInstance: selectedInstance // Use the same instance for both
      };
    }
    
    return { firstInstance: '', secondInstance: '' };
  }
} 