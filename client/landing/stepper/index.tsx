import '@automattic/calypso-polyfills';
import accessibleFocus from '@automattic/accessible-focus';
import { initializeAnalytics } from '@automattic/calypso-analytics';
import { CurrentUser } from '@automattic/calypso-analytics/dist/types/utils/current-user';
import config from '@automattic/calypso-config';
import { UserActions, User as UserStore } from '@automattic/data-stores';
import { QueryClientProvider } from '@tanstack/react-query';
import { dispatch } from '@wordpress/data';
import defaultCalypsoI18n from 'i18n-calypso';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { requestAllBlogsAccess } from 'wpcom-proxy-request';
import { setupCountryCode } from 'calypso/boot/geolocation';
import { setupLocale } from 'calypso/boot/locale';
import AsyncLoad from 'calypso/components/async-load';
import CalypsoI18nProvider from 'calypso/components/calypso-i18n-provider';
import { AsyncHelpCenterApp } from 'calypso/components/help-center';
import getSuperProps from 'calypso/lib/analytics/super-props';
import { setupErrorLogger } from 'calypso/lib/error-logger/setup-error-logger';
import loadDevHelpers from 'calypso/lib/load-dev-helpers';
import { addQueryArgs } from 'calypso/lib/url';
import { initializeCurrentUser } from 'calypso/lib/user/shared-utils';
import { onDisablePersistence } from 'calypso/lib/user/store';
import { createReduxStore } from 'calypso/state';
import { setCurrentUser } from 'calypso/state/current-user/actions';
import { getInitialState, getStateFromCache, persistOnChange } from 'calypso/state/initial-state';
import { createQueryClient } from 'calypso/state/query-client';
import initialReducer from 'calypso/state/reducer';
import { setStore } from 'calypso/state/redux-store';
import { setCurrentFlowName } from 'calypso/state/signup/flow/actions';
import { setSelectedSiteId } from 'calypso/state/ui/actions';
import { FlowRenderer } from './declarative-flow/internals';
import 'calypso/assets/stylesheets/style.scss';
import { createSessionId } from './declarative-flow/internals/state-manager/create-session-id';
import availableFlows from './declarative-flow/registered-flows';
import { USER_STORE } from './stores';
import { setupWpDataDebug } from './utils/devtools';
import { enhanceFlowWithUtilityFunctions } from './utils/enhance-flow-with-utils';
import { enhanceFlowWithAuth, injectUserStepInSteps } from './utils/enhanceFlowWithAuth';
import redirectPathIfNecessary from './utils/flow-redirect-handler';
import { DEFAULT_FLOW, getFlowFromURL } from './utils/get-flow-from-url';
import { startStepperPerformanceTracking } from './utils/performance-tracking';
import { getSessionId } from './utils/use-session-id';
import { WindowLocaleEffectManager } from './utils/window-locale-effect-manager';
import type { AnyAction } from 'redux';

declare const window: AppWindow;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function initializeCalypsoUserStore( reduxStore: any, user: CurrentUser ) {
	reduxStore.dispatch( setCurrentUser( user ) );
}

interface AppWindow extends Window {
	BUILD_TARGET: string;
}

const getSiteIdFromURL = () => {
	const siteId = new URLSearchParams( window.location.search ).get( 'siteId' );
	return siteId ? Number( siteId ) : null;
};

async function main() {
	const { pathname, search } = window.location;

	// Before proceeding we redirect the user if necessary.
	if ( redirectPathIfNecessary( pathname, search ) ) {
		return null;
	}
	// Sympathy mode clears cache randomly, Stepper uses the cache to persist state (not really a cache).
	config.enable( 'no-force-sympathy' );

	const flowName = getFlowFromURL();
	const flowLoader = availableFlows[ flowName ];

	if ( typeof flowLoader !== 'function' ) {
		// If the URL can't be traced back to an existing flow, stop the boot
		// process and redirect to the default flow.
		window.location.href = `/setup/${ DEFAULT_FLOW }${ window.location.search }`;

		return;
	}

	const siteId = getSiteIdFromURL();
	// Load the flow asynchronously while things happen in parallel.
	const flowPromise = flowLoader();

	// Start tracking performance, bearing in mind this is a full page load.
	startStepperPerformanceTracking( { fullPageLoad: true } );

	// put the proxy iframe in "all blog access" mode
	// see https://github.com/Automattic/wp-calypso/pull/60773#discussion_r799208216
	requestAllBlogsAccess();

	setupWpDataDebug();

	// Add accessible-focus listener.
	accessibleFocus();

	const user = await initializeCurrentUser();
	const userId = ( user as CurrentUser ).ID;
	let queryClient;

	let { default: flow } = await flowPromise;

	const initialState = getInitialState( initialReducer, userId );
	const reduxStore = createReduxStore( initialState, initialReducer );
	setStore( reduxStore, getStateFromCache( userId ) );
	onDisablePersistence( persistOnChange( reduxStore, userId ) );
	setupLocale( user, reduxStore );
	setupCountryCode();
	const { receiveCurrentUser } = dispatch( USER_STORE ) as UserActions;

	if ( user ) {
		initializeCalypsoUserStore( reduxStore, user as CurrentUser );
		receiveCurrentUser( user as UserStore.CurrentUser );
	}

	initializeAnalytics( user, getSuperProps( reduxStore ) );

	setupErrorLogger( reduxStore );

	loadDevHelpers( reduxStore );

	// When re-using steps from /start, we need to set the current flow name in the redux store, since some depend on it.
	reduxStore.dispatch( setCurrentFlowName( flow.name ) );
	reduxStore.dispatch( setSelectedSiteId( siteId ) as unknown as AnyAction );

	let flowSteps = 'initialize' in flow ? await flow.initialize( reduxStore ) : null;

	if ( '__experimentalUseSessions' in flow ) {
		const sessionId = getSessionId() || createSessionId();
		history.replaceState( null, '', addQueryArgs( { sessionId }, window.location.href ) );
		queryClient = ( await createQueryClient( 'stepper-persistence-session-' + sessionId ) )
			.queryClient;
	} else {
		queryClient = ( await createQueryClient( userId ) ).queryClient;
	}

	/**
	 * When `initialize` returns false, it means the app should be killed (the user probably issued a redirect).
	 */
	if ( flowSteps === false ) {
		return;
	}

	// Checking for initialize implies this is a V2 flow.
	// CLEAN UP: once the `onboarding` flow is migrated to V2, this can be cleaned up to only support V2
	// The `onboarding` flow is the only flow that uses in-stepper auth so far, so all the auth logic catering V1 can be deleted.
	if ( 'initialize' in flow && flowSteps ) {
		// Cache the flow steps for later internal usage. We need to cache them because we promise to call `initialize` only once.
		flowSteps = injectUserStepInSteps( flowSteps ) as typeof flowSteps;
		flow.__flowSteps = flowSteps;
		enhanceFlowWithUtilityFunctions( flow );
	} else if ( 'useSteps' in flow ) {
		// V1 flows have to be enhanced by changing their `useSteps` hook.
		flow = enhanceFlowWithAuth( flow );
	}

	const root = createRoot( document.getElementById( 'wpcom' ) as HTMLElement );

	root.render(
		<CalypsoI18nProvider i18n={ defaultCalypsoI18n }>
			<Provider store={ reduxStore }>
				<QueryClientProvider client={ queryClient }>
					<WindowLocaleEffectManager />
					<BrowserRouter basename="setup">
						<FlowRenderer flow={ flow } steps={ flowSteps } />
						{ config.isEnabled( 'cookie-banner' ) && (
							<AsyncLoad require="calypso/blocks/cookie-banner" placeholder={ null } />
						) }
						<AsyncLoad
							require="calypso/components/global-notices"
							placeholder={ null }
							id="notices"
						/>
					</BrowserRouter>
					<AsyncHelpCenterApp currentUser={ user as UserStore.CurrentUser } sectionName="stepper" />
					{ 'development' === process.env.NODE_ENV && (
						<AsyncLoad require="calypso/components/webpack-build-monitor" placeholder={ null } />
					) }
				</QueryClientProvider>
			</Provider>
		</CalypsoI18nProvider>
	);
}

main();
