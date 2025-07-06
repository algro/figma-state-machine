// Common Figma Node types that can be validated
export type FigmaNodeType = 
  | "DOCUMENT"
  | "PAGE" 
  | "FRAME"
  | "GROUP"
  | "COMPONENT"
  | "COMPONENT_SET"
  | "INSTANCE"
  | "RECTANGLE"
  | "ELLIPSE"
  | "POLYGON"
  | "STAR"
  | "VECTOR"
  | "TEXT"
  | "BOOLEAN_OPERATION"
  | "SLICE"
  | "LINE"
  | "ARC"
  | "STAMP"
  | "STICKY"
  | "CONNECTOR"
  | "SHAPE_WITH_TEXT"
  | "CODE_BLOCK"
  | "WIDGET"
  | "EMBED"
  | "LINK_UNFURL"
  | "MEDIA"
  | "HIGHLIGHT"
  | "WASHI_TAPE"
  | "TABLE"
  | "TABLE_CELL"
  | "REACTIONS"
  | "COMMENT"
  | "SECTION"
  | "HOTSPOT"
  | "VARIABLE";

// SelectionUtil class to handle selection validation
export class SelectionUtil {
    private static activeListeners = new Map<string, () => void>();
    private static currentValidationConfig: { nodeType: FigmaNodeType; allowMultiple: boolean } | null = null;
    
    // Start listening for selection changes
    static startChangeListener(nodeType: FigmaNodeType, allowMultiple: boolean = true): void {
        console.log(`Starting change listener for: ${nodeType}, multiple: ${allowMultiple}`);
        
        // Store current validation config
        this.currentValidationConfig = { nodeType, allowMultiple };
        
        // Remove any existing listeners
        this.stopChangeListener();
        
        // Create new listener
        const listener = () => {
            console.log(`Selection change detected! Revalidating for ${nodeType}`);
            const selection = figma.currentPage.selection;
            this.validateSelectionOnly(selection, nodeType, allowMultiple);
        };
        
        // Store the listener and set it up
        this.activeListeners.set('main', listener);
        figma.on('selectionchange', listener);
        
        console.log(`Change listener started successfully`);
    }
    
    // Stop listening for selection changes
    static stopChangeListener(): void {
        console.log('Stopping change listener');
        
        this.activeListeners.forEach((listener) => {
            figma.off('selectionchange', listener);
        });
        this.activeListeners.clear();
        this.currentValidationConfig = null;
        
        console.log('Change listener stopped');
    }
    
    // Validate a selection against a node type
    static validate(selection: readonly SceneNode[], nodeType: FigmaNodeType, allowMultiple: boolean): readonly SceneNode[] {
        // Debug logging
        console.log(`Validating selection: ${selection.length} nodes, type: ${nodeType}, multiple: ${allowMultiple}`);
        
        // Check if there are any selected nodes
        if (selection.length === 0) {
            const message = `Please select at least one ${nodeType}`;
            console.log('Sending notification:', message);
            figma.ui.postMessage({
                type: 'notification',
                message: message,
                notificationType: 'error'
            });
            return selection;
        }
        
        // Check if multiple selection is allowed
        if (!allowMultiple && selection.length > 1) {
            const message = `Please select only one ${nodeType}`;
            console.log('Sending notification:', message);
            figma.ui.postMessage({
                type: 'notification',
                message: message,
                notificationType: 'error'
            });
            return selection;
        }
        
        // Validate each selected node
        const validNodes = selection.filter(node => {
            if (node.type === nodeType) {
                return true;
            } else {
                const message = `Please select a ${nodeType}, not a ${node.type}`;
                console.log('Sending notification:', message);
                figma.ui.postMessage({
                    type: 'notification',
                    message: message,
                    notificationType: 'error'
                });
                return false;
            }
        });
        
        // If we have valid nodes, show success message
        if (validNodes.length > 0) {
            const nodeNames = validNodes.map(node => node.name).join(', ');
            const message = `${nodeType}(s) selected: ${nodeNames}`;
            console.log('Sending notification:', message);
            figma.ui.postMessage({
                type: 'notification',
                message: message,
                notificationType: 'success'
            });
        }
        
        return validNodes;
    }
    
    // Separate method for validation without revalidation setup
    private static validateSelectionOnly(selection: readonly SceneNode[], nodeType: FigmaNodeType, allowMultiple: boolean): readonly SceneNode[] {
        // Debug logging
        console.log(`Revalidating selection: ${selection.length} nodes, type: ${nodeType}, multiple: ${allowMultiple}`);
        
        // Check if there are any selected nodes
        if (selection.length === 0) {
            const message = `Please select at least one ${nodeType}`;
            console.log('Sending notification:', message);
            figma.ui.postMessage({
                type: 'notification',
                message: message,
                notificationType: 'error'
            });
            return selection;
        }
        
        // Check if multiple selection is allowed
        if (!allowMultiple && selection.length > 1) {
            const message = `Please select only one ${nodeType}`;
            console.log('Sending notification:', message);
            figma.ui.postMessage({
                type: 'notification',
                message: message,
                notificationType: 'error'
            });
            return selection;
        }
        
        // Validate each selected node
        const validNodes = selection.filter(node => {
            if (node.type === nodeType) {
                return true;
            } else {
                const message = `Please select a ${nodeType}, not a ${node.type}`;
                console.log('Sending notification:', message);
                figma.ui.postMessage({
                    type: 'notification',
                    message: message,
                    notificationType: 'error'
                });
                return false;
            }
        });
        
        // If we have valid nodes, show success message
        if (validNodes.length > 0) {
            const nodeNames = validNodes.map(node => node.name).join(', ');
            const message = `${nodeType}(s) selected: ${nodeNames}`;
            console.log('Sending notification:', message);
            figma.ui.postMessage({
                type: 'notification',
                message: message,
                notificationType: 'success'
            });
        }
        
        return validNodes;
    }
    
    // Helper method to get all available node types
    static getAvailableNodeTypes(): FigmaNodeType[] {
        return [
            "DOCUMENT", "PAGE", "FRAME", "GROUP", "COMPONENT", "COMPONENT_SET", 
            "INSTANCE", "RECTANGLE", "ELLIPSE", "POLYGON", "STAR", "VECTOR", 
            "TEXT", "BOOLEAN_OPERATION", "SLICE", "LINE", "ARC", "STAMP", 
            "STICKY", "CONNECTOR", "SHAPE_WITH_TEXT", "CODE_BLOCK", "WIDGET", 
            "EMBED", "LINK_UNFURL", "MEDIA", "HIGHLIGHT", "WASHI_TAPE", 
            "TABLE", "TABLE_CELL", "REACTIONS", "COMMENT", "SECTION", 
            "HOTSPOT", "VARIABLE"
        ];
    }
    
    // Helper method to validate if a string is a valid node type
    static isValidNodeType(nodeType: string): nodeType is FigmaNodeType {
        return this.getAvailableNodeTypes().includes(nodeType as FigmaNodeType);
    }
} 