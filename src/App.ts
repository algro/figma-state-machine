import html from 'html-template-tag'
import typescriptLogo from './assets/typescript.svg'
import { Icon } from './components/Icon'

export default (function App() {
	return html`
		<div class="container">
			<div id="empty-state" class="empty-state">
				<p>Select an instance to view its properties</p>
			</div>
			<div id="instance-selection" class="instance-selection" style="display: none;">
				<div class="form-group">
					
					<select id="interaction-type" class="select-input">
						<option value="">Click on</option>
						<option value="">Hover on</option>
					</select>
					<select id="click-target" class="instance-select select-input">
						<option value="">Choose an instance...</option>
					</select>
					<p class="label">Set</p>
					<div id="property-groups" class="property-groups">
						<!-- Property groups will be dynamically generated here -->
					</div>
					<div class="toggle-container">
						<label class="toggle-label">
							<input type="checkbox" id="allow-multiple" class="toggle-input">
							<span class="toggle-text">Allow multiple instances with same state</span>
						</label>
					</div>
					<p class="label">And set other</p>
					<div id="property-groups-others" class="property-groups">
						<!-- Property groups will be dynamically generated here -->
					</div>
					<button class="add-interaction">Add Interaction</button>
				

				</div>
			</div>
			<div id="notification-area" class="notification-area"></div>
		</div>
	`
})()
