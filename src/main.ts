
import { PropertiesUtil } from './utils/properties-util';
import { PluginInteractionHandler } from './utils/plugin-interaction-handler';

export default function () {
	figma.showUI(__html__, { width: 400, height: 500, themeColors: true })
	
	// Function to process and send instance properties
	async function processAndSendProperties() {
		let selection = figma.currentPage.selection;
		let instanceProperties = await PropertiesUtil.processCurrentSelection();
		

		
		// Send data to UI
		figma.ui.postMessage({
			type: 'instance-properties',
			data: instanceProperties
		});
	}
	
	// Handle messages from the UI
	figma.ui.onmessage = async (message) => {

		
		// Handle interaction setup messages
		if (message.type) {
			try {
				const response = await PluginInteractionHandler.handleInteractionMessage(message);
				
				// Send response back to UI
				figma.ui.postMessage({
					type: response.messageId ? `${response.messageId.split('-')[0]}-response` : 'interaction-response',
					...response
				});
			} catch (error) {
				console.error('Error handling interaction message:', error);
				figma.ui.postMessage({
					type: 'interaction-response',
					success: false,
					error: (error as Error).message,
					messageId: message?.messageId
				});
			}
		}
	};
	
	// Process initial selection
	processAndSendProperties().catch(error => {
		console.error('Error processing initial selection:', error);
	});
	
	// Listen for selection changes
	figma.on('selectionchange', () => {
		processAndSendProperties().catch(error => {
			console.error('Error processing selection change:', error);
		});
	});
}
