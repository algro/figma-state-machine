import html from 'html-template-tag'
import typescriptLogo from './assets/typescript.svg'
import { Icon } from './components/Icon'

export default (function App() {
	return html`
		<div class="container">
			<div class="form-group">
				<label for="node-type-select">Select Node Type:</label>
				<select id="node-type-select" class="select-input">
					<option value="">Choose a node type...</option>
					<option value="INSTANCE">Instance</option>
					<option value="TEXT">Text</option>
					<option value="RECTANGLE">Rectangle</option>
					<option value="FRAME">Frame</option>
					<option value="COMPONENT">Component</option>
					<option value="GROUP">Group</option>
				</select>
			</div>
			<div id="notification-area" class="notification-area"></div>
		</div>
	`
})()
