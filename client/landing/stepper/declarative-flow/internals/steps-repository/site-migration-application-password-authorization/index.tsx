import { Step } from '@automattic/onboarding';
import { useTranslate } from 'i18n-calypso';
import { useEffect } from 'react';
import DocumentHead from 'calypso/components/data/document-head';
import Notice from 'calypso/components/notice';
import NoticeAction from 'calypso/components/notice/notice-action';
import { useQuery } from 'calypso/landing/stepper/hooks/use-query';
import { useSiteIdParam } from 'calypso/landing/stepper/hooks/use-site-id-param';
import { useSiteSlugParam } from 'calypso/landing/stepper/hooks/use-site-slug-param';
import { useDispatch } from 'calypso/state';
import { resetSite } from 'calypso/state/sites/actions';
import Authorization from './components/authorization';
import useStoreApplicationPassword from './hooks/use-store-application-password';
import type { Step as StepType } from '../../types';
import './style.scss';

const SiteMigrationApplicationPasswordsAuthorization: StepType< {
	submits: {
		action: 'migration-started' | 'fallback-credentials' | 'authorization' | 'contact-me';
		authorizationUrl?: string;
	};
} > = function ( { navigation } ) {
	const translate = useTranslate();
	const siteSlug = useSiteSlugParam();
	const siteId = parseInt( useSiteIdParam() ?? '' );
	const dispatch = useDispatch();

	const source = useQuery().get( 'from' ) ?? '';
	const authorizationUrl = useQuery().get( 'authorizationUrl' ) ?? undefined;
	const isAuthorizationRejected = useQuery().get( 'success' ) === 'false';
	const applicationPassword = useQuery().get( 'password' );
	const username = useQuery().get( 'user_login' );
	const isAuthorizationSuccessful = !! ( applicationPassword && username );
	const {
		mutate: storeApplicationPasswordMutation,
		isSuccess: isStoreApplicationPasswordSuccess,
		isError: isStoreApplicationPasswordError,
		isPending: isStoreApplicationPasswordPending,
	} = useStoreApplicationPassword( siteSlug as string );
	const isLoading =
		isAuthorizationSuccessful &&
		( isStoreApplicationPasswordSuccess || isStoreApplicationPasswordPending );

	useEffect( () => {
		if ( ! isAuthorizationSuccessful || ! siteSlug ) {
			return;
		}

		storeApplicationPasswordMutation( {
			password: applicationPassword,
			username,
			source,
		} );
	}, [ isAuthorizationSuccessful, siteSlug, useStoreApplicationPassword ] );

	useEffect( () => {
		if ( isStoreApplicationPasswordSuccess ) {
			siteId && dispatch( resetSite( siteId ) );
			navigation?.submit?.( { action: 'migration-started' } );
		}
	}, [ isStoreApplicationPasswordSuccess, navigation, dispatch, siteId ] );

	const navigateToFallbackCredentials = () => {
		navigation?.submit?.( { action: 'fallback-credentials', authorizationUrl } );
	};

	const startAuthorization = () => {
		navigation?.submit?.( { action: 'authorization', authorizationUrl } );
	};

	const contactMe = () => {
		navigation?.submit?.( { action: 'contact-me' } );
	};

	let notice = undefined;
	if ( isStoreApplicationPasswordError ) {
		notice = (
			<Notice
				status="is-warning"
				showDismiss={ false }
				text={ translate(
					'We ran into a problem connecting to your site. Please try again or let us know so we can help you out.'
				) }
			>
				<NoticeAction onClick={ contactMe }>{ translate( 'Get help' ) }</NoticeAction>
			</Notice>
		);
	} else if ( isAuthorizationRejected ) {
		notice = (
			<Notice status="is-warning" showDismiss={ false }>
				{ translate(
					"We can't start your migration without your authorization. Please authorize WordPress.com in your WP Admin or share your credentials."
				) }
			</Notice>
		);
	}

	const sourceDomain = new URL( source || '' ).host;

	const title = translate( 'Get ready for blazing fast speeds' );
	// translators: %(sourceDomain)s is the source domain that is being migrated.
	const subHeaderText = translate(
		"We're ready to migrate {{strong}}%(sourceDomain)s{{/strong}} to WordPress.com. To ensure a smooth process, we need you to authorize us in your WordPress.com admin.",
		{
			args: {
				sourceDomain,
			},
			components: {
				strong: <strong />,
			},
		}
	);

	const stepContent = (
		<Authorization
			onAuthorizationClick={ startAuthorization }
			onShareCredentialsClick={ navigateToFallbackCredentials }
		/>
	);

	if ( isLoading ) {
		return <Step.Loading title={ title } delay={ 500 } />;
	}

	return (
		<>
			<DocumentHead title={ title } />
			<Step.CenteredColumnLayout
				columnWidth={ 5 }
				topBar={ <Step.TopBar leftElement={ <Step.BackButton onClick={ navigation.goBack } /> } /> }
				heading={ <Step.Heading text={ title } subText={ subHeaderText } /> }
				className="site-migration-application-password-authorization-v2"
			>
				{ notice }
				{ stepContent }
			</Step.CenteredColumnLayout>
		</>
	);
};

export default SiteMigrationApplicationPasswordsAuthorization;
