/**
 * External dependendies
 */

import { Button, FormInputValidation, FormLabel } from '@automattic/components';
import { localize } from 'i18n-calypso';
import PropTypes from 'prop-types';
import { useEffect } from 'react';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import FormPasswordInput from 'calypso/components/forms/form-password-input';
import FormSelect from 'calypso/components/forms/form-select';
import FormSettingExplanation from 'calypso/components/forms/form-setting-explanation';
import FormTextInput from 'calypso/components/forms/form-text-input';
import FormTextArea from 'calypso/components/forms/form-textarea';
import withServerCredentialsForm from '../with-server-credentials-form';

import './style.scss';

const ServerCredentialsForm = ( {
	formIsSubmitting,
	formSubmissionStatus,
	onCancel,
	onComplete,
	translate,
	handleFieldChange,
	handleSubmit,
	form,
	formErrors,
	labels = {},
	showCancelButton = true,
} ) => {
	useEffect( () => {
		if ( formSubmissionStatus === 'success' ) {
			onComplete && onComplete();
		}
	}, [ formSubmissionStatus, onComplete ] );

	return (
		<div className="server-credentials-form">
			<FormFieldset>
				<FormLabel htmlFor="protocol-type">{ translate( 'Credential type' ) }</FormLabel>
				<FormSelect
					name="protocol"
					id="protocol-type"
					value={ form?.protocol?.ssh }
					onChange={ handleFieldChange }
					disabled={ formIsSubmitting }
				>
					<option value="ssh">{ translate( 'SSH/SFTP' ) }</option>
					<option value="ftp">{ translate( 'FTP' ) }</option>
				</FormSelect>
			</FormFieldset>

			<div className="server-credentials-form__row">
				<FormFieldset className="server-credentials-form__server-address">
					<FormLabel htmlFor="host-address">
						{ labels.host || translate( 'Server address' ) }
					</FormLabel>
					<FormTextInput
						name="host"
						id="host-address"
						placeholder={ translate( 'YourGroovyDomain.com' ) }
						value={ form?.host ?? '' }
						onChange={ handleFieldChange }
						disabled={ formIsSubmitting }
						isError={ !! formErrors.host }
					/>
					{ formErrors.host && <FormInputValidation isError text={ formErrors.host } /> }
				</FormFieldset>

				<FormFieldset className="server-credentials-form__port-number">
					<FormLabel htmlFor="server-port">{ labels.port || translate( 'Port number' ) }</FormLabel>
					<FormTextInput
						name="port"
						id="server-port"
						placeholder="22"
						value={ form?.port ?? '' }
						onChange={ handleFieldChange }
						disabled={ formIsSubmitting }
						isError={ !! formErrors.port }
					/>
					{ formErrors.port && <FormInputValidation isError text={ formErrors.port } /> }
				</FormFieldset>
			</div>

			<div className="server-credentials-form__row server-credentials-form__user-pass">
				<FormFieldset className="server-credentials-form__username">
					<FormLabel htmlFor="server-username">
						{ labels.user || translate( 'Server username' ) }
					</FormLabel>
					<FormTextInput
						name="user"
						id="server-username"
						placeholder={ translate( 'username' ) }
						value={ form?.user ?? '' }
						onChange={ handleFieldChange }
						disabled={ formIsSubmitting }
						isError={ !! formErrors.user }
						// Hint to LastPass not to attempt autofill
						data-lpignore="true"
					/>
					{ formErrors.user && <FormInputValidation isError text={ formErrors.user } /> }
				</FormFieldset>

				<FormFieldset className="server-credentials-form__password">
					<FormLabel htmlFor="server-password">
						{ labels.pass || translate( 'Server password' ) }
					</FormLabel>
					<FormPasswordInput
						name="pass"
						id="server-password"
						placeholder={ translate( 'password' ) }
						value={ form?.pass ?? '' }
						onChange={ handleFieldChange }
						disabled={ formIsSubmitting }
						isError={ !! formErrors.pass }
						// Hint to LastPass not to attempt autofill
						data-lpignore="true"
					/>
					{ formErrors.pass && <FormInputValidation isError text={ formErrors.pass } /> }
				</FormFieldset>
			</div>

			<FormFieldset className="server-credentials-form__path">
				<FormLabel htmlFor="wordpress-path">
					{ labels.path || translate( 'WordPress installation path' ) }
				</FormLabel>
				<FormTextInput
					name="path"
					id="wordpress-path"
					placeholder="/public_html/wordpress-site/"
					value={ form?.path ?? '' }
					onChange={ handleFieldChange }
					disabled={ formIsSubmitting }
					isError={ !! formErrors.path }
				/>
				{ formErrors.path && <FormInputValidation isError text={ formErrors.path } /> }
			</FormFieldset>

			<FormFieldset className="server-credentials-form__kpri">
				<FormLabel htmlFor="private-key">{ labels.kpri || translate( 'Private key' ) }</FormLabel>
				<FormTextArea
					name="kpri"
					id="private-key"
					value={ form?.kpri ?? '' }
					onChange={ handleFieldChange }
					disabled={ formIsSubmitting }
					className="server-credentials-form__private-key"
				/>
				<FormSettingExplanation>
					{ translate( 'Encrypted private keys with a passphrase are not supported.' ) }
				</FormSettingExplanation>
			</FormFieldset>

			<FormFieldset className="dialog__action-buttons server-credentials-form__buttons">
				{ showCancelButton && (
					<Button
						disabled={ formIsSubmitting }
						onClick={ onCancel }
						className="server-credentials-form__btn server-credentials-form__btn--cancel"
					>
						{ labels.cancel || translate( 'Cancel' ) }
					</Button>
				) }
				<Button
					primary
					className="server-credentials-form__btn"
					disabled={ formIsSubmitting }
					onClick={ handleSubmit }
				>
					{ labels.save || translate( 'Save' ) }
				</Button>
			</FormFieldset>
		</div>
	);
};
ServerCredentialsForm.propTypes = {
	allowCancel: PropTypes.bool,
	allowDelete: PropTypes.bool,
	onCancel: PropTypes.func,
	onComplete: PropTypes.func,
	labels: PropTypes.object,
	showAdvancedSettings: PropTypes.bool,
	toggleAdvancedSettings: PropTypes.func,
	// The following props are provided by the withServerCredentials HOC
	requirePath: PropTypes.bool,
	form: PropTypes.object,
	formErrors: PropTypes.object,
	formIsSubmitting: PropTypes.bool,
	formSubmissionStatus: PropTypes.string,
	handleFieldChange: PropTypes.func,
	handleSubmit: PropTypes.func,
	handleDelete: PropTypes.func,
};

export default withServerCredentialsForm( localize( ServerCredentialsForm ) );
