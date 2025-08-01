import { FormLabel } from '@automattic/components';
import { Spinner, Button } from '@wordpress/components';
import { localize } from 'i18n-calypso';
import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import FormTextInput from 'calypso/components/forms/form-text-input';
import LoggedOutForm from 'calypso/components/logged-out-form';
import Notice from 'calypso/components/notice';
import { sendEmailLogin } from 'calypso/state/auth/actions';
import { getCurrentUser } from 'calypso/state/current-user/selectors';
import { hideMagicLoginRequestNotice } from 'calypso/state/login/magic-login/actions';
import { getLastCheckedUsernameOrEmail } from 'calypso/state/login/selectors';
import getCurrentQueryArguments from 'calypso/state/selectors/get-current-query-arguments';
import getInitialQueryArguments from 'calypso/state/selectors/get-initial-query-arguments';
import getMagicLoginRequestEmailError from 'calypso/state/selectors/get-magic-login-request-email-error';
import isFetchingMagicLoginEmail from 'calypso/state/selectors/is-fetching-magic-login-email';
import { useLoginContext } from '../login-context';
import VerifyLoginCode from './verify-login-code';

const RequestLoginCode = ( {
	currentUser,
	emailRequested,
	isFetching,
	redirectTo,
	requestError,
	userEmail,
	flow,
	onReady,
	onPublicTokenReceived,
	createAccountForNewUser,
	sendEmailLogin: sendEmail,
	hideMagicLoginRequestNotice: hideRequestNotice,
	translate,
	shouldShowLoadingEllipsis,
	publicToken,
	tosComponent,
} ) => {
	const [ usernameOrEmail, setUsernameOrEmail ] = useState( userEmail || '' );
	const usernameOrEmailRef = useRef( null );
	const { setHeaders } = useLoginContext();

	useEffect( () => {
		if ( onReady ) {
			onReady();
		}
	}, [ onReady, setHeaders, translate ] );

	useEffect( () => {
		setHeaders( {
			heading: translate( 'Email me a login code' ),
			subHeading: translate(
				"We'll send you an email with a code that will log you in right away."
			),
		} );
	}, [] );

	const onUsernameOrEmailFieldChange = ( event ) => {
		setUsernameOrEmail( event.target.value );

		if ( requestError ) {
			hideRequestNotice();
		}
	};

	const onNoticeDismiss = () => {
		hideRequestNotice();
	};

	const handleSendEmail = ( email = usernameOrEmail ) => {
		if ( ! email.length ) {
			return;
		}

		sendEmail( email, {
			redirectTo,
			requestLoginEmailFormFlow: true,
			createAccount: createAccountForNewUser,
			tokenType: 'code', // Request code instead of link
			...( flow ? { flow } : {} ),
			onSuccess: ( response ) => {
				if ( response && response.public_token ) {
					if ( onPublicTokenReceived ) {
						onPublicTokenReceived( response.public_token );
					}
				}
			},
		} );
	};

	const onSubmit = ( event ) => {
		event.preventDefault();
		handleSendEmail();
	};

	if ( shouldShowLoadingEllipsis ) {
		return <Spinner className="magic-login__loading-spinner--jetpack" />;
	}

	// Show verification code form if email has been requested and we have a public token
	if ( emailRequested && publicToken ) {
		return (
			<VerifyLoginCode
				publicToken={ publicToken }
				usernameOrEmail={ usernameOrEmail }
				onResendEmail={ onSubmit }
			/>
		);
	}

	const submitEnabled =
		usernameOrEmail.length && ! isFetching && ! emailRequested && ! requestError;

	const errorText =
		typeof requestError?.message === 'string' && requestError?.message.length
			? requestError?.message
			: translate( 'Unable to complete request' );

	return (
		<div className="magic-login__form">
			<LoggedOutForm className="magic-login__form-form" onSubmit={ onSubmit }>
				{ currentUser && currentUser.username && (
					<Notice
						showDismiss={ false }
						className="magic-login__form-header-notice"
						status="is-info"
						theme="light"
						text={ translate( 'You are already logged in as user: %(user)s', {
							args: {
								user: currentUser.username,
							},
						} ) }
					></Notice>
				) }

				<FormLabel htmlFor="usernameOrEmail">
					{ translate( 'Email address or username' ) }
				</FormLabel>
				<FormFieldset className="magic-login__email-fields">
					<FormTextInput
						autoCapitalize="off"
						autoComplete="username"
						className="magic-login__request-login-email-form-fields"
						disabled={ isFetching || emailRequested }
						id="usernameOrEmail"
						name="usernameOrEmail"
						value={ usernameOrEmail }
						onChange={ onUsernameOrEmailFieldChange }
						placeholder={ translate( 'Email or Username' ) }
						ref={ usernameOrEmailRef }
					/>

					{ tosComponent }

					{ requestError && (
						<Notice
							onDismissClick={ onNoticeDismiss }
							className="magic-login__request-login-email-form-notice"
							status="is-error"
							text={ errorText }
						/>
					) }

					<div className="magic-login__form-action">
						<Button
							variant="primary"
							disabled={ ! submitEnabled && ! isFetching }
							isBusy={ isFetching }
							type="submit"
							__next40pxDefaultSize
						>
							{ isFetching ? translate( 'Sending code…' ) : translate( 'Send Code' ) }
						</Button>
					</div>
				</FormFieldset>
			</LoggedOutForm>
		</div>
	);
};

RequestLoginCode.propTypes = {
	// mapped to state
	currentUser: PropTypes.object,
	emailRequested: PropTypes.bool,
	isFetching: PropTypes.bool,
	redirectTo: PropTypes.string,
	requestError: PropTypes.object,
	userEmail: PropTypes.string,
	flow: PropTypes.string,

	// mapped to dispatch
	sendEmailLogin: PropTypes.func.isRequired,
	hideMagicLoginRequestNotice: PropTypes.func.isRequired,

	onReady: PropTypes.func,
	onPublicTokenReceived: PropTypes.func,
};

const mapState = ( state ) => ( {
	currentUser: getCurrentUser( state ),
	isFetching: isFetchingMagicLoginEmail( state ),
	requestError: getMagicLoginRequestEmailError( state ),
	userEmail:
		getLastCheckedUsernameOrEmail( state ) ||
		getCurrentQueryArguments( state ).email_address ||
		getInitialQueryArguments( state ).email_address,
} );

const mapDispatch = {
	sendEmailLogin,
	hideMagicLoginRequestNotice,
};

export default connect( mapState, mapDispatch )( localize( RequestLoginCode ) );
