import { FormLabel } from '@automattic/components';
import { PureComponent } from 'react';
import FormSelect from 'calypso/components/forms/form-select';
import InfoPopover from 'calypso/components/info-popover';

class InfoPopoverExample extends PureComponent {
	static displayName = 'InfoPopover';

	state = {
		popoverPosition: 'bottom left',
	};

	render() {
		return (
			<div>
				<FormLabel>
					Position
					<FormSelect value={ this.state.popoverPosition } onChange={ this._changePopoverPosition }>
						<option value="top">top</option>
						<option value="top left">top left</option>
						<option value="top right">top right</option>
						<option value="left">left</option>
						<option value="right">right</option>
						<option value="bottom">bottom</option>
						<option value="bottom left">bottom left</option>
						<option value="bottom right">bottom right</option>
					</FormSelect>
				</FormLabel>

				<br />

				<InfoPopover id="popover__info-popover-example" position={ this.state.popoverPosition }>
					Some informational text.
				</InfoPopover>

				<InfoPopover
					id="popover__info-popover-example"
					position={ this.state.popoverPosition }
					showOnHover
				>
					Shows on hover.
				</InfoPopover>
			</div>
		);
	}

	_changePopoverPosition = ( event ) => {
		this.setState( { popoverPosition: event.target.value } );
	};
}

export default InfoPopoverExample;
