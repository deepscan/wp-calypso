import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { AnalyticsProvider, type AnalyticsClient } from 'calypso/dashboard/app/analytics';
import { AuthProvider, useAuth } from 'calypso/dashboard/app/auth';
import { queryClient } from 'calypso/dashboard/app/query-client';
import router, {
	routerConfig,
	syncBrowserHistoryToRouter,
	syncMemoryRouterToBrowserHistory,
} from './router';
import type { Store } from 'redux';

function RouterProviderWithAuth( { siteSlug, feature }: { siteSlug?: string; feature?: string } ) {
	const auth = useAuth();

	useEffect( () => {
		syncBrowserHistoryToRouter( router );
	}, [ siteSlug, feature ] );

	useEffect( () => {
		const handlePopstate = () => {
			syncBrowserHistoryToRouter( router );
		};

		const unsubscribe = syncMemoryRouterToBrowserHistory( router );
		window.addEventListener( 'popstate', handlePopstate );

		return () => {
			unsubscribe();
			window.removeEventListener( 'popstate', handlePopstate );
		};
	}, [] );

	return <RouterProvider router={ router } context={ { auth, config: routerConfig } } />;
}

function Layout( {
	store,
	analyticsClient,
	siteSlug,
	feature,
}: {
	store: Store;
	analyticsClient: AnalyticsClient;
	siteSlug?: string;
	feature?: string;
} ) {
	return (
		<QueryClientProvider client={ queryClient }>
			<AuthProvider>
				<AnalyticsProvider client={ analyticsClient }>
					<ReduxProvider store={ store }>
						<RouterProviderWithAuth siteSlug={ siteSlug } feature={ feature } />
					</ReduxProvider>
				</AnalyticsProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default Layout;
