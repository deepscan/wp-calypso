import page from '@automattic/calypso-router';
import { Spinner } from '@wordpress/components';
import { useTranslate } from 'i18n-calypso';
import { FC, useCallback, useEffect, useState } from 'react';
// import A4ALogo from 'calypso/a8c-for-agencies/components/a4a-logo';
import EmptyContent from 'calypso/components/empty-content';
import Main from 'calypso/components/main';
import { login } from 'calypso/lib/paths';
import { useDispatch, useSelector } from 'calypso/state';
import { recordTracksEventWithClientId as recordTracksEvent } from 'calypso/state/analytics/actions';
import { rebootAfterLogin } from 'calypso/state/login/actions';
import {
	fetchMagicLoginAuthenticate,
	showMagicLoginLinkExpiredPage,
} from 'calypso/state/login/magic-login/actions';
import { LINK_EXPIRED_PAGE } from 'calypso/state/login/magic-login/constants';
import {
	getRedirectToOriginal,
	getRedirectToSanitized,
	getTwoFactorNotificationSent,
	isTwoFactorEnabled,
} from 'calypso/state/login/selectors';
import getMagicLoginCurrentView from 'calypso/state/selectors/get-magic-login-current-view';
import getMagicLoginRequestAuthError from 'calypso/state/selectors/get-magic-login-request-auth-error';
import getMagicLoginRequestedAuthSuccessfully from 'calypso/state/selectors/get-magic-login-requested-auth-successfully';
import isFetchingMagicLoginAuth from 'calypso/state/selectors/is-fetching-magic-login-auth';
import isWooDnaFlow from 'calypso/state/selectors/is-woo-dna-flow';
import isWooJPCFlow from 'calypso/state/selectors/is-woo-jpc-flow';
import { useLoginContext } from '../login-context';
import EmailedLoginLinkExpired from './emailed-login-link-expired';

interface Props {
	emailAddress: string;
	token: string;
}

const HandleEmailedLinkFormJetpackConnect: FC< Props > = ( { emailAddress, token } ) => {
	const dispatch = useDispatch();
	const translate = useTranslate();
	const [ hasSubmitted, setHasSubmitted ] = useState( false );

	const redirectToOriginal = useSelector( ( state ) => getRedirectToOriginal( state ) || '' );
	const redirectToSanitized = useSelector( getRedirectToSanitized );
	const authError = useSelector( getMagicLoginRequestAuthError );
	const isAuthenticated = useSelector( getMagicLoginRequestedAuthSuccessfully );
	const isExpired = useSelector(
		( state ) => getMagicLoginCurrentView( state ) === LINK_EXPIRED_PAGE
	);
	const isWooCoreFlow = useSelector( isWooJPCFlow );
	const isWooDnaService = useSelector( isWooDnaFlow );
	const isWooFlow = isWooCoreFlow || isWooDnaService;
	const isFetching = useSelector( isFetchingMagicLoginAuth );
	const twoFactorEnabled = useSelector( isTwoFactorEnabled );
	const twoFactorNotificationSent = useSelector( getTwoFactorNotificationSent );
	const isFromAutomatticForAgenciesPlugin =
		new URLSearchParams( redirectToOriginal.split( '?' )[ 1 ] ).get( 'from' ) ===
		'automattic-for-agencies-client';

	const { setHeaders } = useLoginContext();

	useEffect( () => {
		if ( ! emailAddress || ! token ) {
			dispatch( showMagicLoginLinkExpiredPage() );
		} else {
			setHasSubmitted( true );
			dispatch( fetchMagicLoginAuthenticate( token, redirectToOriginal ) );
		}

		setHeaders( {
			heading: translate( 'Email confirmed!' ),
			subHeading: null,
		} );
	}, [] );

	// Lifted from `blocks/login`
	// @TODO move to `state/login/actions` & use both places
	const handleValidToken = useCallback( () => {
		if ( ! twoFactorEnabled ) {
			dispatch( rebootAfterLogin( { magic_login: 1 } ) );
		} else {
			page(
				login( {
					isJetpack: true,
					// If no notification is sent, the user is using the authenticator for 2FA by default
					twoFactorAuthType: twoFactorNotificationSent?.replace( 'none', 'authenticator' ),
					redirectTo: redirectToSanitized ?? undefined,
				} )
			);
		}
	}, [ dispatch, redirectToSanitized, twoFactorEnabled, twoFactorNotificationSent ] );

	useEffect( () => {
		if ( ! hasSubmitted || isFetching ) {
			// Don't do anything here unless the browser has received the `POST` response
			return;
		}

		if ( authError || ! isAuthenticated ) {
			// @TODO if this is a 5XX, or timeout, show an error...?
			dispatch( showMagicLoginLinkExpiredPage() );
			return;
		}

		handleValidToken();
	}, [ authError, dispatch, handleValidToken, hasSubmitted, isAuthenticated, isFetching ] );

	if ( isExpired ) {
		return <EmailedLoginLinkExpired emailAddress={ emailAddress } isJetpack />;
	}

	dispatch( recordTracksEvent( 'calypso_login_email_link_handle_click_view' ) );

	return isWooFlow || isFromAutomatticForAgenciesPlugin ? (
		<EmptyContent className="magic-login__handle-link jetpack" title={ null }>
			{ /* { isFromAutomatticForAgenciesPlugin && <A4ALogo fullA4A size={ 58 } /> } */ }

			<h3 className="magic-login__line empty-content__line">
				{ [
					translate( 'Logging in as %(emailAddress)s', {
						args: {
							emailAddress,
						},
					} ),
					'...',
				] }
			</h3>
		</EmptyContent>
	) : (
		<Main className="magic-login">
			<div className="magic-login__successfully-jetpack">
				<p>
					{ translate( 'Logging in as {{strong}}%(emailAddress)s{{/strong}}…', {
						args: {
							emailAddress,
						},
						components: {
							strong: <strong></strong>,
						},
					} ) }
				</p>
				<Spinner className="magic-login__loading-spinner--jetpack" />
			</div>
		</Main>
	);
};

export default HandleEmailedLinkFormJetpackConnect;
