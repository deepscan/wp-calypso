import { WordPressLogo } from '@automattic/components';
import { useI18n } from '@wordpress/react-i18n';
import clsx from 'clsx';
import SiteIcon, { type SiteIconVariant } from 'calypso/blocks/site-icon';
import { getFirstGrapheme } from 'calypso/lib/string';
import { useSelector } from 'calypso/state';
import { getSite } from 'calypso/state/sites/selectors';
import MigrationFavicon from './migration-favicon';

import './style.scss';

export type SiteFaviconFallback = 'color' | 'wordpress-logo' | 'first-grapheme' | 'migration';

interface SiteFaviconProps {
	blogId?: number;
	color?: string;
	size?: number;
	className?: string;
	fallback?: SiteFaviconFallback;
	lazy?: boolean;
	variant?: SiteIconVariant;
}

const SiteFavicon = ( {
	blogId,
	color,
	size = 40,
	className = '',
	fallback = 'color',
	lazy = false,
	variant,
}: SiteFaviconProps ) => {
	const { __ } = useI18n();
	const siteColor = color ?? 'linear-gradient(45deg, #ff0056, #ff8a78, #57b7ff, #9c00d4)';
	const site = useSelector( ( state ) => getSite( state, blogId ) );

	let defaultFavicon;
	let defaultFaviconClass = '';
	switch ( fallback ) {
		case 'wordpress-logo':
			defaultFavicon = <WordPressLogo className="wpcom-favicon" size={ size * 0.8 } />;
			break;
		case 'first-grapheme':
			defaultFavicon = (
				<div
					role="img"
					aria-label={ __( 'Site Icon' ) }
					style={ size <= 36 ? { fontSize: size * 0.6 } : {} }
				>
					{ getFirstGrapheme( site?.title ?? '' ) }
				</div>
			);
			defaultFaviconClass = 'is-first-grapheme';
			break;
		case 'migration':
			defaultFavicon = <MigrationFavicon size={ size } />;
			break;
		case 'color':
		default:
			defaultFavicon = <div className="no-favicon" style={ { background: siteColor } } />;
			break;
	}

	return (
		<div className={ clsx( 'site-favicon', className, defaultFaviconClass ) }>
			<SiteIcon
				siteId={ blogId }
				size={ size }
				defaultIcon={ defaultFavicon }
				lazy={ lazy }
				variant={ variant }
			/>
		</div>
	);
};

export default SiteFavicon;
