// Notification handler for Figma plugin UI
export type NotificationType = 'error' | 'success' | 'info';

export class NotificationHandler {
  /**
   * Show notification in the UI
   */
  static show(message: string, type: NotificationType = 'info'): void {
    const notificationArea = document.getElementById('notification-area');
    if (!notificationArea) {
      console.warn('Notification area not found');
      return;
    }
    
    // Clear existing notifications first
    this.clear();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notificationArea.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
  
  /**
   * Show error notification
   */
  static error(message: string): void {
    this.show(message, 'error');
  }
  
  /**
   * Show success notification
   */
  static success(message: string): void {
    this.show(message, 'success');
  }
  
  /**
   * Show info notification
   */
  static info(message: string): void {
    this.show(message, 'info');
  }
  
  /**
   * Clear all notifications
   */
  static clear(): void {
    const notificationArea = document.getElementById('notification-area');
    if (notificationArea) {
      notificationArea.innerHTML = '';
    }
  }
}
