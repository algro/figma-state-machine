// UI State Manager - Handles showing/hiding UI sections based on data

export class UIStateManager {
  
  /**
   * Update UI state based on instance data
   */
  static updateUIState(instances: any[]): void {
    const emptyState = document.getElementById('empty-state');
    const instanceSelection = document.getElementById('instance-selection');
    
    if (instances && instances.length > 0) {
      // Show instance selection, hide empty state
      if (emptyState) emptyState.style.display = 'none';
      if (instanceSelection) instanceSelection.style.display = 'block';
    } else {
      // Show empty state, hide instance selection
      if (emptyState) emptyState.style.display = 'block';
      if (instanceSelection) instanceSelection.style.display = 'none';
    }
  }
} 