import { recordTracksEvent } from '@automattic/calypso-analytics';
import { Button } from '@wordpress/components';
import { useTranslate } from 'i18n-calypso';
import JetpackLogo from 'calypso/components/jetpack-logo';
import { useSelector, useDispatch } from 'calypso/state';
import { resetMagicLoginRequestForm } from 'calypso/state/login/magic-login/actions';
import { isFormDisabled } from 'calypso/state/login/selectors';
import { getCurrentOAuth2Client } from 'calypso/state/oauth2-clients/ui/selectors';
import getIsWoo from 'calypso/state/selectors/get-is-woo';

import '@automattic/components/styles/wp-button-override.scss';
import './style.scss';

type QrCodeLoginButtonProps = {
	loginUrl: string;
};

export default function QrCodeLoginButton( { loginUrl }: QrCodeLoginButtonProps ) {
	const dispatch = useDispatch();
	const translate = useTranslate();
	const isDisabled = useSelector( isFormDisabled );
	const oauth2Client = useSelector( getCurrentOAuth2Client );
	const isWoo = useSelector( getIsWoo );

	// Is not supported for any oauth 2 client.
	// n.b this seems to work for woo.com so it's not clear why the above comment is here
	if ( oauth2Client && ! isWoo ) {
		return null;
	}

	const handleClick = () => {
		recordTracksEvent( 'calypso_login_magic_login_request_click', {
			origin: 'login-links',
		} );

		dispatch( resetMagicLoginRequestForm() );
	};

	return (
		<Button
			className="a8c-components-wp-button social-buttons__button"
			disabled={ isDisabled }
			href={ loginUrl }
			onClick={ handleClick }
			data-e2e-link="magic-login-link"
			key="lost-password-link"
			variant="secondary"
			__next40pxDefaultSize
		>
			<JetpackLogo monochrome={ isDisabled } size={ 20 } className="social-icons" />
			<span className="social-buttons__service-name">
				{ translate( 'Log in via Jetpack app' ) }
			</span>
		</Button>
	);
}
