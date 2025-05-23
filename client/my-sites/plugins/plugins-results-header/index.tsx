import { useI18n } from '@wordpress/react-i18n';
import clsx from 'clsx';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import { useSelector } from 'calypso/state';
import { getSelectedSite } from 'calypso/state/ui/selectors';
import type { TranslateResult } from 'i18n-calypso';

import './style.scss';

export default function PluginsResultsHeader( {
	className = '',
	title,
	subtitle,
	browseAllLink,
	resultCount,
	listName,
	isRootPage = true,
}: {
	title: TranslateResult;
	subtitle: TranslateResult;
	browseAllLink?: string;
	resultCount?: string;
	className?: string;
	listName?: string;
	isRootPage?: boolean;
} ) {
	const { __ } = useI18n();
	const selectedSite = useSelector( getSelectedSite );
	const TitleTag = isRootPage ? 'h2' : 'h1';

	return (
		<div className={ clsx( 'plugins-results-header', className ) }>
			{ ( title || subtitle ) && (
				<div className="plugins-results-header__titles">
					{ title && <TitleTag className="plugins-results-header__title">{ title }</TitleTag> }
					{ subtitle && <p className="plugins-results-header__subtitle">{ subtitle }</p> }
				</div>
			) }
			{ ( browseAllLink || resultCount ) && (
				<div className="plugins-results-header__actions">
					{ browseAllLink && (
						<a
							className="plugins-results-header__action"
							href={ browseAllLink }
							onClick={ () => {
								recordTracksEvent( 'calypso_plugin_browser_all_click', {
									site: selectedSite?.domain,
									list_name: listName,
									blog_id: selectedSite?.ID,
								} );
							} }
						>
							{ __( 'Browse all' ) }
						</a>
					) }
					{ resultCount && <span className="plugins-results-header__action">{ resultCount }</span> }
				</div>
			) }
		</div>
	);
}
