/**
 * External dependencies
 */
import React, { cloneElement, Children, Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import { flowRight } from 'lodash';

/**
 * Internal dependencies
 */
import DocumentHead from 'components/data/document-head';
import FormRadio from 'components/forms/form-radio';
import FormTextInput from 'components/forms/form-text-input';
import FormToggle from 'components/forms/form-toggle/compact';
import Main from 'components/main';
import Navigation from '../navigation';
import QuerySettings from '../../data/query-settings';
import { getSelectedSite, getSelectedSiteId } from 'state/ui/selectors';
import { getSettings } from '../../state/settings/selectors';

class Settings extends Component {
	static propTypes = {
		children: PropTypes.element,
		initialValues: PropTypes.object,
		site: PropTypes.object,
		siteId: PropTypes.number,
		tab: PropTypes.string,
		translate: PropTypes.func,
	};

	renderNumberInput = ( { input: { onChange, value } } ) => (
		<FormTextInput
			min="0"
			onChange={ this.updateTextInput( onChange ) }
			step="1"
			type="number"
			value={ value } />
	)

	renderRadio = defaultValue => ( { input: { name, onChange, value } } ) => (
		<FormRadio
			checked={ value === defaultValue }
			name={ name }
			onChange={ this.updateRadio( onChange ) }
			value={ defaultValue } />
	)

	renderTextInput = ( { input: { onChange, value } } ) => (
		<FormTextInput
			onChange={ this.updateTextInput( onChange ) }
			value={ value } />
	)

	renderToggle = text => ( { input: { onChange, value } } ) => (
		<FormToggle
			checked={ value || false }
			onChange={ this.updateToggle( value, onChange ) }>
			{ text }
		</FormToggle>
	)

	updateRadio = onChange => event => onChange( event.target.value );

	updateTextInput = onChange => event => onChange( event.target.value );

	updateToggle = ( value, onChange ) => () => onChange( ! value );

	render() {
		const {
			children,
			initialValues,
			site,
			siteId,
			tab,
			translate,
		} = this.props;
		const mainClassName = 'wp-job-manager__main';

		return (
			<Main className={ mainClassName }>
				<QuerySettings siteId={ siteId } />
				<DocumentHead title={ translate( 'WP Job Manager' ) } />
				<Navigation activeTab={ tab } site={ site } />
				{
					Children.map( children, child => cloneElement( child, {
						initialValues,
						renderRadio: this.renderRadio,
						renderNumberInput: this.renderNumberInput,
						renderTextInput: this.renderTextInput,
						renderToggle: this.renderToggle,
					} ) )
				}
			</Main>
		);
	}
}

const connectComponent = connect(
	( state ) => {
		const siteId = getSelectedSiteId( state );

		return {
			initialValues: getSettings( state, siteId ),
			site: getSelectedSite( state ),
			siteId,
		};
	}
);

export default flowRight(
	connectComponent,
	localize,
)( Settings );
