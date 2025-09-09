import { Button } from '@wordpress/components';
import { useTranslate } from 'i18n-calypso';
import { useEffect, useState } from 'react';
import Gravatar from 'calypso/components/gravatar';
import wpcom from 'calypso/lib/wp';

import './continue-as-user.scss';

// Validate redirect URL using the REST endpoint.
// Return validated URL in case of success, `null` in case of failure.
function useValidatedURL( redirectUrl ) {
	const [ url, setURL ] = useState( '' );
	const [ isLoading, setIsLoading ] = useState( false );

	useEffect( () => {
		if ( redirectUrl ) {
			setIsLoading( true );
			wpcom.req
				.get( '/me/validate-redirect', { redirect_url: redirectUrl } )
				.then( ( res ) => {
					setURL( res?.redirect_to );
					setIsLoading( false );
				} )
				.catch( () => {
					setURL( null );
					setIsLoading( false );
				} );
		}
	}, [ redirectUrl ] );

	return { url, loading: isLoading && !! redirectUrl };
}

export default function ContinueAsUser( {
	currentUser,
	onChangeAccount,
	redirectPath,
	isWoo,
	isBlazePro,
} ) {
	const translate = useTranslate();

	const { url: validatedPath, loading: validatingPath } = useValidatedURL( redirectPath );

	const userName = currentUser.display_name || currentUser.username;

	// Render ContinueAsUser straight away, even before validation.
	// This helps avoid jarring layout shifts. It's not ideal that the link URL changes transparently
	// like that, but it is better than the alternative, and in practice it should happen quicker than
	// the user can notice.

	const notYouText = translate( 'Not you?{{br/}}Log in with {{link}}another account{{/link}}', {
		components: {
			br: <br />,
			link: (
				<Button
					variant="link"
					id="loginAsAnotherUser"
					className="continue-as-user__change-user-link"
					onClick={ onChangeAccount }
				/>
			),
		},
		args: { userName },
		comment: 'Link to continue login as different user',
	} );

	const gravatarLink = (
		<div className="continue-as-user__gravatar-content">
			<Gravatar
				user={ currentUser }
				className="continue-as-user__gravatar"
				imgSize={ 400 }
				size={ 110 }
			/>
			<div className="continue-as-user__username">{ userName }</div>
			<div className="continue-as-user__email">{ currentUser.email }</div>
		</div>
	);

	if ( isWoo || isBlazePro ) {
		return (
			<div className="continue-as-user">
				<div className="continue-as-user__user-info">{ gravatarLink }</div>
				<Button
					variant="primary"
					className="continue-as-user__continue-button"
					isBusy={ validatingPath }
					href={ validatedPath || '/' }
					__next40pxDefaultSize
				>
					{ translate( 'Continue' ) }
				</Button>
				<Button
					variant="link"
					id="loginAsAnotherUser"
					className="continue-as-user__change-user-link"
					onClick={ onChangeAccount }
				>
					{ translate( 'Log in with a different account' ) }
				</Button>
			</div>
		);
	}

	return (
		<div className="continue-as-user">
			<div className="continue-as-user__user-info">
				{ gravatarLink }
				<Button
					variant="primary"
					isBusy={ validatingPath }
					href={ validatedPath || '/' }
					__next40pxDefaultSize
					className="continue-as-user__continue-button"
				>
					{ translate( 'Continue' ) }
				</Button>
			</div>
			<div className="continue-as-user__not-you">{ notYouText }</div>
		</div>
	);
}
