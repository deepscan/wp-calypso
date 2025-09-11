import { TranslateResult, fixMe } from 'i18n-calypso';
import { capitalize } from 'lodash';
import {
	isJetpackCloudOAuth2Client,
	isA4AOAuth2Client,
	isBlazeProOAuth2Client,
	isPartnerPortalOAuth2Client,
	isVIPOAuth2Client,
} from 'calypso/lib/oauth2-clients';
import { getOAuth2Client } from 'calypso/state/oauth2-clients/selectors';
import getCurrentQueryArguments from 'calypso/state/selectors/get-current-query-arguments';

interface Props {
	twoFactorAuthType: string | null;
	isManualRenewalImmediateLoginAttempt: boolean;
	socialConnect: boolean;
	linkingSocialService: string;
	action: string;
	oauth2Client: ReturnType< typeof getOAuth2Client >;
	currentQuery: ReturnType< typeof getCurrentQueryArguments >;
	translate: ( arg0: string, arg1?: object ) => TranslateResult;
	isJetpack?: boolean;
	twoStepNonce?: string | null;
	isSocialFirst?: boolean;
	isWooJPC?: boolean;
	isWCCOM?: boolean;
	isBlazePro?: boolean;
	isFromAkismet?: boolean;
	isFromAutomatticForAgenciesPlugin?: boolean;
	isGravPoweredClient?: boolean;
	isUserLoggedIn?: boolean;
}

const getLoggedInUserHeaderText = ( {
	isSocialFirst,
	isWooJPC,
	isWCCOM,
	isBlazePro,
	translate,
}: {
	isSocialFirst?: boolean;
	isWooJPC?: boolean;
	isWCCOM?: boolean;
	isBlazePro?: boolean;
	translate: ( arg0: string, arg1?: object ) => TranslateResult;
} ): TranslateResult | null => {
	if ( isSocialFirst && ( isWooJPC || isWCCOM || isBlazePro ) ) {
		return translate( 'Connect your account' );
	}
	return null;
};

/**
 * This function is used to get the header text for the login page.
 * TODO: We'll convert this to hook form in the future.
 */
export function getHeaderText( {
	isSocialFirst,
	twoFactorAuthType,
	isManualRenewalImmediateLoginAttempt,
	socialConnect,
	linkingSocialService,
	action,
	oauth2Client,
	isWooJPC,
	isJetpack,
	isWCCOM,
	isBlazePro,
	isFromAkismet,
	isFromAutomatticForAgenciesPlugin,
	isGravPoweredClient,
	currentQuery,
	translate,
	twoStepNonce,
	isUserLoggedIn,
}: Props ): TranslateResult {
	if ( isUserLoggedIn ) {
		const loggedInText = getLoggedInUserHeaderText( {
			isSocialFirst,
			isWooJPC,
			isWCCOM,
			isBlazePro,
			translate,
		} );
		if ( loggedInText ) {
			return loggedInText;
		}
	}

	let headerText = translate( 'Log in to your account' );

	if ( isSocialFirst ) {
		let clientName = oauth2Client?.name;
		if ( isFromAkismet ) {
			clientName = 'Akismet';
		} else if ( isBlazeProOAuth2Client( oauth2Client ) ) {
			clientName = 'Blaze Pro';
		} else if ( isA4AOAuth2Client( oauth2Client ) ) {
			clientName = 'Automattic for Agencies';
		} else if ( isJetpackCloudOAuth2Client( oauth2Client ) ) {
			clientName = 'Jetpack Cloud';
		} else if ( isJetpack ) {
			clientName = 'Jetpack';
		} else if ( isWCCOM ) {
			clientName = 'Woo';
		} else if ( isVIPOAuth2Client( oauth2Client ) ) {
			clientName = 'VIP';
		}

		/**
		 * Override WooJPC. It's technically a Jetpack client, but we want to show "Woo" instead of "Jetpack".
		 * This condition overrides the clientName set in the above if/elseif statement.
		 */
		if ( isWooJPC ) {
			clientName = 'Woo';
		}

		headerText = clientName
			? ( fixMe( {
					text: 'Log in to {{span}}%(client)s{{/span}} with WordPress.com',
					newCopy: translate( 'Log in to {{span}}%(client)s{{/span}} with WordPress.com', {
						args: { client: clientName },
						components: { span: <span className="wp-login__one-login-header-client-name" /> },
					} ),
					oldCopy: translate( 'Log in to WordPress.com' ),
			  } ) as TranslateResult )
			: translate( 'Log in to WordPress.com' );
	}

	if ( twoFactorAuthType === 'authenticator' || twoFactorAuthType === 'email' ) {
		headerText = translate( 'Continue with an authentication code' );
	}

	if ( twoFactorAuthType === 'push' ) {
		headerText = translate( 'Continue with the Jetpack app' );
	} else if ( twoFactorAuthType === 'backup' ) {
		headerText = translate( 'Continue with a backup code' );
	}

	if ( isManualRenewalImmediateLoginAttempt ) {
		headerText = translate( 'Log in to update your payment details and renew your subscription' );
	}

	if ( twoStepNonce ) {
		headerText = translate( 'Two-Step Authentication' );
	}

	if ( socialConnect ) {
		headerText = translate( 'Connect your %(service)s account', {
			args: {
				service: capitalize( linkingSocialService ),
			},
		} );
	}

	if ( action === 'lostpassword' ) {
		headerText = translate( 'Lost your password?' );
	} else if ( currentQuery?.lostpassword_flow === 'true' ) {
		headerText = translate( "You've got mail" );
	} else if ( oauth2Client ) {
		if ( isPartnerPortalOAuth2Client( oauth2Client ) ) {
			if ( document.location.search?.includes( 'wpcloud' ) ) {
				headerText = translate( 'Log in to WP Cloud with WordPress.com' );
			} else {
				headerText = translate(
					'Howdy! Log into the Automattic Partner Portal with your WordPress.com account.'
				);
			}
		}

		if ( isGravPoweredClient ) {
			headerText = translate( 'Login to %(clientTitle)s', {
				args: { clientTitle: oauth2Client.title },
			} );
		}
	}

	if ( isFromAutomatticForAgenciesPlugin ) {
		headerText = translate( 'Log in to Automattic for Agencies' );
	}

	return headerText;
}
