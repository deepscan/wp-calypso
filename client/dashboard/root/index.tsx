import { useIsFetching } from '@tanstack/react-query';
import { Outlet, useRouterState } from '@tanstack/react-router';
import WordPressLogo from 'calypso/components/wordpress-logo';
import { useAppContext } from '../app/context';
import CommandPalette from '../command-palette';
import Header from '../header';
import { LoadingLine } from '../loading-line';
import './style.scss';

function Root() {
	const { LoadingLogo = WordPressLogo } = useAppContext();
	const isFetching = useIsFetching();
	const router = useRouterState();
	const isNavigating = router.status === 'pending';
	// A little trick after investigation router state: it will initially be
	// empty, but remain set after subsequent navigations.
	// https://tanstack.com/router/latest/docs/framework/react/api/router/RouterStateType#resolvedlocation-property
	const isInitialLoad = ! router.resolvedLocation;

	return (
		<div className="dashboard-root__layout">
			{ ( isFetching > 0 || isNavigating ) && <LoadingLine /> }
			{ isInitialLoad && <LoadingLogo className="wpcom-site__logo" /> }
			<Header />
			<main>
				<Outlet />
			</main>
			<CommandPalette />
		</div>
	);
}

export default Root;
