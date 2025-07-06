
import { SelectionUtil } from './utils/selection-util';

export default function () {
	figma.showUI(__html__, { width: 300, height: 260, themeColors: true })
	
	let selection = figma.currentPage.selection;
	SelectionUtil.startChangeListener("INSTANCE", true);
	let validSelection = SelectionUtil.validate(selection, "INSTANCE", true);


	console.log(validSelection)
	
	// Later you can stop the listener
	// SelectionUtil.stopChangeListener();
}
