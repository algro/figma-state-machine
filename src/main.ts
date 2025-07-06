
import { PropertiesUtil } from './utils/properties-util';

export default function () {
	figma.showUI(__html__, { width: 400, height: 600, themeColors: true })
	
	// Function to process and send instance properties
	function processAndSendProperties() {
		let selection = figma.currentPage.selection;
		let instanceProperties = PropertiesUtil.processCurrentSelection();
		
		console.log('Processed instance properties:', instanceProperties);
		
		// Send data to UI
		figma.ui.postMessage({
			type: 'instance-properties',
			data: instanceProperties
		});
	}
	
	// Process initial selection
	processAndSendProperties();
	
	// Listen for selection changes
	figma.on('selectionchange', () => {
		console.log('Selection changed, updating properties...');
		processAndSendProperties();
	});
}
