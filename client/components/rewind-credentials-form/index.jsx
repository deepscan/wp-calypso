/**
 * External dependendies
 */
import { Button, FormInputValidation, FormLabel, Gridicon } from '@automattic/components';
import clsx from 'clsx';
import { localize } from 'i18n-calypso';
import { get, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import QuerySiteCredentials from 'calypso/components/data/query-site-credentials';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import FormPasswordInput from 'calypso/components/forms/form-password-input';
import FormSelect from 'calypso/components/forms/form-select';
import FormSettingExplanation from 'calypso/components/forms/form-setting-explanation';
import FormTextInput from 'calypso/components/forms/form-text-input';
import FormTextArea from 'calypso/components/forms/form-textarea';
import { deleteCredentials, updateCredentials } from 'calypso/state/jetpack/credentials/actions';
import getJetpackCredentials from 'calypso/state/selectors/get-jetpack-credentials';
import getJetpackCredentialsUpdateStatus from 'calypso/state/selectors/get-jetpack-credentials-update-status';
import { getSiteSlug } from 'calypso/state/sites/selectors';

import './style.scss';

export class RewindCredentialsForm extends Component {
	static propTypes = {
		role: PropTypes.string.isRequired,
		siteId: PropTypes.number,
		allowCancel: PropTypes.bool,
		allowDelete: PropTypes.bool,
		onCancel: PropTypes.func,
		onComplete: PropTypes.func,
		siteUrl: PropTypes.string,
		labels: PropTypes.object,
		requirePath: PropTypes.bool,
		showNotices: PropTypes.bool,
	};

	static defaultProps = {
		labels: {},
		requirePath: false,
		showNotices: true,
	};

	state = {
		form: {
			protocol: 'ssh',
			host: '',
			port: 22,
			user: '',
			pass: '',
			path: '',
			kpri: '',
		},
		formErrors: {
			host: false,
			port: false,
			user: false,
			pass: false,
			path: false,
		},
	};

	handleFieldChange = ( { target: { name, value } } ) => {
		const changedProtocol = 'protocol' === name;
		const defaultPort = 'ftp' === value ? 21 : 22;

		const form = Object.assign(
			this.state.form,
			{ [ name ]: value },
			changedProtocol && { port: defaultPort }
		);

		this.setState( {
			form,
			formErrors: { ...this.state.formErrors, [ name ]: false },
		} );
	};

	handleSubmit = () => {
		const { requirePath, role, siteId, siteUrl, translate } = this.props;

		const payload = {
			role,
			site_url: siteUrl,
			...this.state.form,
		};

		let userError = '';

		if ( ! payload.user ) {
			userError = translate( 'Please enter your server username.' );
		} else if ( 'root' === payload.user ) {
			userError = translate(
				"We can't accept credentials for the root user. " +
					'Please provide or create credentials for another user with access to your server.'
			);
		}

		const errors = Object.assign(
			! payload.host && { host: translate( 'Please enter a valid server address.' ) },
			! payload.port && { port: translate( 'Please enter a valid server port.' ) },
			isNaN( payload.port ) && { port: translate( 'Port number must be numeric.' ) },
			userError && { user: userError },
			! payload.pass &&
				! payload.kpri && { pass: translate( 'Please enter your server password.' ) },
			! payload.path && requirePath && { path: translate( 'Please enter a server path.' ) }
		);

		return isEmpty( errors )
			? this.props.updateCredentials( siteId, payload )
			: this.setState( { formErrors: errors } );
	};

	handleDelete = () => this.props.deleteCredentials( this.props.siteId, this.props.role );

	toggleAdvancedSettings = () =>
		this.setState( { showAdvancedSettings: ! this.state.showAdvancedSettings } );

	// @TODO: Please update https://github.com/Automattic/wp-calypso/issues/58453 if you are refactoring away from UNSAFE_* lifecycle methods!
	UNSAFE_componentWillReceiveProps( nextProps ) {
		const { credentials, siteSlug } = nextProps;

		const nextForm = Object.assign( {}, this.state.form );
		const hasCredentials = isEmpty( nextForm.host ) && ! isEmpty( credentials );

		// Populate the fields with data from state if credentials are already saved
		nextForm.protocol = ! isEmpty( credentials ) ? credentials.protocol : nextForm.protocol;
		nextForm.host = hasCredentials ? credentials.host : nextForm.host;
		nextForm.port = hasCredentials ? credentials.port : nextForm.port;
		nextForm.user = hasCredentials ? credentials.user : nextForm.user;
		nextForm.path = hasCredentials ? credentials.abspath : nextForm.path;

		// Populate the host field with the site slug if needed
		nextForm.host =
			isEmpty( nextForm.host ) && siteSlug ? siteSlug.split( '::' )[ 0 ] : nextForm.host;

		this.setState( { form: nextForm } );
	}

	render() {
		const { formIsSubmitting, labels, showNotices, onCancel, requirePath, siteId, translate } =
			this.props;
		const { showAdvancedSettings, formErrors } = this.state;

		return (
			<div className="rewind-credentials-form">
				<QuerySiteCredentials siteId={ siteId } />
				{ showNotices && (
					<div className="rewind-credentials-form__instructions">
						{ translate(
							'Your server credentials can be found with your hosting provider. Their website should explain how to get the credentials you need. {{link}}Learn how to find and enter your credentials{{/link}}.',
							{
								components: {
									link: <a href="https://jetpack.com/support/activating-jetpack-backups/" />,
								},
							}
						) }
					</div>
				) }
				<FormFieldset>
					<FormLabel htmlFor="protocol-type">{ translate( 'Credential type' ) }</FormLabel>
					<FormSelect
						name="protocol"
						id="protocol-type"
						value={ get( this.state.form, 'protocol', 'ssh' ) }
						onChange={ this.handleFieldChange }
						disabled={ formIsSubmitting }
					>
						<option value="ssh">{ translate( 'SSH/SFTP' ) }</option>
						<option value="ftp">{ translate( 'FTP' ) }</option>
					</FormSelect>
				</FormFieldset>

				<div className="rewind-credentials-form__row">
					<FormFieldset className="rewind-credentials-form__server-address">
						<FormLabel htmlFor="host-address">
							{ labels.host || translate( 'Server address' ) }
						</FormLabel>
						<FormTextInput
							name="host"
							id="host-address"
							placeholder={ translate( 'YourGroovyDomain.com' ) }
							value={ get( this.state.form, 'host', '' ) }
							onChange={ this.handleFieldChange }
							disabled={ formIsSubmitting }
							isError={ !! formErrors.host }
						/>
						{ formErrors.host && <FormInputValidation isError text={ formErrors.host } /> }
					</FormFieldset>

					<FormFieldset className="rewind-credentials-form__port-number">
						<FormLabel htmlFor="server-port">
							{ labels.port || translate( 'Port number' ) }
						</FormLabel>
						<FormTextInput
							name="port"
							id="server-port"
							placeholder="22"
							value={ get( this.state.form, 'port', '' ) }
							onChange={ this.handleFieldChange }
							disabled={ formIsSubmitting }
							isError={ !! formErrors.port }
						/>
						{ formErrors.port && <FormInputValidation isError text={ formErrors.port } /> }
					</FormFieldset>
				</div>

				<div className="rewind-credentials-form__row rewind-credentials-form__user-pass">
					<FormFieldset className="rewind-credentials-form__username">
						<FormLabel htmlFor="server-username">
							{ labels.user || translate( 'Server username' ) }
						</FormLabel>
						<FormTextInput
							name="user"
							id="server-username"
							placeholder={ translate( 'username' ) }
							value={ get( this.state.form, 'user', '' ) }
							onChange={ this.handleFieldChange }
							disabled={ formIsSubmitting }
							isError={ !! formErrors.user }
							// Hint to LastPass not to attempt autofill
							data-lpignore="true"
						/>
						{ formErrors.user && <FormInputValidation isError text={ formErrors.user } /> }
					</FormFieldset>

					<FormFieldset className="rewind-credentials-form__password">
						<FormLabel htmlFor="server-password">
							{ labels.pass || translate( 'Server password' ) }
						</FormLabel>
						<FormPasswordInput
							name="pass"
							id="server-password"
							placeholder={ translate( 'password' ) }
							value={ get( this.state.form, 'pass', '' ) }
							onChange={ this.handleFieldChange }
							disabled={ formIsSubmitting }
							isError={ !! formErrors.pass }
							// Hint to LastPass not to attempt autofill
							data-lpignore="true"
						/>
						{ formErrors.pass && <FormInputValidation isError text={ formErrors.pass } /> }
					</FormFieldset>
				</div>

				<FormFieldset>
					{ ! requirePath && (
						<Button
							borderless
							disabled={ formIsSubmitting }
							onClick={ this.toggleAdvancedSettings }
							className={ clsx( 'rewind-credentials-form__advanced-button', {
								'is-expanded': showAdvancedSettings,
							} ) }
						>
							<Gridicon icon="chevron-down" />
							{ translate( 'Advanced settings' ) }
						</Button>
					) }
					{ ( showAdvancedSettings || requirePath ) && (
						<div
							className={ clsx( {
								'rewind-credentials-form__advanced-settings': ! requirePath,
							} ) }
						>
							<FormFieldset className="rewind-credentials-form__path">
								<FormLabel htmlFor="wordpress-path">
									{ labels.path || translate( 'WordPress installation path' ) }
								</FormLabel>
								<FormTextInput
									name="path"
									id="wordpress-path"
									placeholder="/public_html/wordpress-site/"
									value={ get( this.state.form, 'path', '' ) }
									onChange={ this.handleFieldChange }
									disabled={ formIsSubmitting }
									isError={ !! formErrors.path }
								/>
								{ formErrors.path && <FormInputValidation isError text={ formErrors.path } /> }
							</FormFieldset>

							<FormFieldset className="rewind-credentials-form__kpri">
								<FormLabel htmlFor="private-key">
									{ labels.kpri || translate( 'Private Key' ) }
								</FormLabel>
								<FormTextArea
									name="kpri"
									id="private-key"
									value={ get( this.state.form, 'kpri', '' ) }
									onChange={ this.handleFieldChange }
									disabled={ formIsSubmitting }
									className="rewind-credentials-form__private-key"
								/>
								<FormSettingExplanation>
									{ translate( 'Only non-encrypted private keys are supported.' ) }
								</FormSettingExplanation>
							</FormFieldset>
						</div>
					) }
				</FormFieldset>

				{ showNotices && (
					<div className="rewind-credentials-form__tos">
						{ translate(
							'By adding credentials, you are providing us with access to your server to perform automatic actions (such as backing up or restoring your site), manually access your site in case of an emergency, and troubleshoot your support requests.'
						) }
					</div>
				) }

				<FormFieldset>
					<Button primary disabled={ formIsSubmitting } onClick={ this.handleSubmit }>
						{ labels.save || translate( 'Save' ) }
					</Button>
					{ this.props.allowCancel && (
						<Button
							disabled={ formIsSubmitting }
							onClick={ onCancel }
							className="rewind-credentials-form__cancel-button"
						>
							{ labels.cancel || translate( 'Cancel' ) }
						</Button>
					) }
					{ this.props.allowDelete && (
						<Button
							borderless
							scary
							disabled={ formIsSubmitting }
							onClick={ this.handleDelete }
							className="rewind-credentials-form__delete-button"
						>
							<Gridicon icon="trash" size={ 18 } />
							{ labels.delete || translate( 'Delete' ) }
						</Button>
					) }
				</FormFieldset>
			</div>
		);
	}
}

const mapStateToProps = ( state, { siteId, role } ) => ( {
	formIsSubmitting: 'pending' === getJetpackCredentialsUpdateStatus( state, siteId ),
	siteSlug: getSiteSlug( state, siteId ),
	credentials: getJetpackCredentials( state, siteId, role ),
} );

export default connect( mapStateToProps, { deleteCredentials, updateCredentials } )(
	localize( RewindCredentialsForm )
);
