import { recordTracksEvent } from '@automattic/calypso-analytics';
import { Step } from '@automattic/onboarding';
import { useTranslate } from 'i18n-calypso';
import { useSelector } from 'react-redux';
import { getSignupUrl, pathWithLeadingSlash } from 'calypso/lib/login';
import { getCurrentUserLocale } from 'calypso/state/current-user/selectors';
import { getCurrentOAuth2Client } from 'calypso/state/oauth2-clients/ui/selectors';
import { getCurrentQueryArguments } from 'calypso/state/selectors/get-current-query-arguments';
import { getCurrentRoute } from 'calypso/state/selectors/get-current-route';
import HeadingLogo from './heading-logo';

interface OneLoginLayoutProps {
	isJetpack: boolean;
	isFromAkismet: boolean;
	headingText: string;
	headingSubText: React.ReactNode;
	children: React.ReactNode;
	signupUrl?: string;
	shouldUseWideHeading?: number;
}

const OneLoginLayout = ( {
	isJetpack,
	isFromAkismet,
	headingText,
	headingSubText,
	children,
	signupUrl: signupUrlProp,
	shouldUseWideHeading,
}: OneLoginLayoutProps ) => {
	const translate = useTranslate();
	const locale = useSelector( getCurrentUserLocale );
	const currentRoute = useSelector( getCurrentRoute );
	const currentQuery = useSelector( getCurrentQueryArguments );
	const oauth2Client = useSelector( getCurrentOAuth2Client );

	const SignUpLink = () => {
		// use '?signup_url' if explicitly passed as URL query param
		const signupUrl = signupUrlProp
			? window.location.origin + pathWithLeadingSlash( signupUrlProp )
			: getSignupUrl( currentQuery, currentRoute, oauth2Client, locale );

		return (
			<Step.LinkButton
				href={ signupUrl }
				key="sign-up-link"
				onClick={ () => {
					recordTracksEvent( 'calypso_login_sign_up_link_click', { origin: 'login-layout' } );
				} }
				rel="external"
			>
				{ translate( 'Create an account' ) }
			</Step.LinkButton>
		);
	};

	return (
		<Step.CenteredColumnLayout
			columnWidth={ 6 }
			{ ...( shouldUseWideHeading && { columnWidthHeading: 8 } ) }
			topBar={ <Step.TopBar rightElement={ <SignUpLink /> } compactLogo="always" /> }
			heading={
				<Step.Heading
					text={
						<>
							<HeadingLogo isFromAkismet={ isFromAkismet } isJetpack={ isJetpack } />
							<div className="wp-login__heading-text">{ headingText }</div>
						</>
					}
					subText={
						// <span> here because the Step.Heading renders subtext as a <p> tag.
						<span className="wp-login__heading-subtext">{ headingSubText }</span>
					}
				/>
			}
			verticalAlign="center"
		>
			{ children }
		</Step.CenteredColumnLayout>
	);
};

export default OneLoginLayout;
