import { Card } from '@automattic/components';
import clsx from 'clsx';
import { translate } from 'i18n-calypso';
import { forwardRef, useMemo } from 'react';
import type { Ref } from 'react';
import './style.scss';

interface ThemeCardProps {
	className?: string;
	name: string;
	image: React.ReactNode;
	imageClickUrl?: string;
	imageActionLabel?: string;
	banner?: React.ReactNode;
	badge?: React.ReactNode;
	optionsMenu?: React.ReactNode;
	isActive?: boolean;
	isLoading?: boolean;
	isSoftLaunched?: boolean;
	onClick?: () => void;
	onImageClick?: () => void;
}

const ActiveBadge = () => {
	return (
		<div className="theme-card__info-badge-container">
			<div className="theme-card__info-badge theme-card__info-badge-active">
				<svg fill="none" height="14" width="14" viewBox="0 0 14 14">
					<clipPath id="a">
						<path d="m0 .5h14v14h-14z" />
					</clipPath>
					<g>
						<path d="m11.6992 3.1001-6.29998 8.5-3.3-2.5-.9 1.2 4.5 3.4 7.19998-9.7z" fill="#fff" />
					</g>
				</svg>
				<span>
					{ translate( 'Active', {
						context: 'singular noun, the currently active theme',
					} ) }
				</span>
			</div>
		</div>
	);
};

const ThemeCard = forwardRef(
	(
		{
			className,
			name,
			image,
			imageClickUrl,
			imageActionLabel,
			banner,
			badge,
			optionsMenu,
			isActive,
			isLoading,
			isSoftLaunched,
			onClick,
			onImageClick,
		}: ThemeCardProps,
		forwardedRef: Ref< any > // eslint-disable-line @typescript-eslint/no-explicit-any
	) => {
		const e2eName = useMemo( () => name?.toLowerCase?.().replace( /\s+/g, '-' ), [ name ] );

		const isActionable = imageClickUrl || onImageClick;
		const themeClasses = clsx( 'theme-card', {
			'theme-card--is-active': isActive,
			'theme-card--is-actionable': isActionable,
		} );

		return (
			<Card
				className={ clsx( themeClasses, className ) }
				onClick={ onClick }
				data-e2e-theme={ e2eName }
			>
				<div ref={ forwardedRef } className="theme-card__content">
					{ banner && <div className="theme-card__banner">{ banner }</div> }
					<div className="theme-card__image-container">
						<a
							className="theme-card__image"
							href={ imageClickUrl || '#' }
							aria-label={ name }
							onClick={ ( e ) => {
								if ( ! imageClickUrl ) {
									e.preventDefault();
								}

								onImageClick?.();
							} }
						>
							{ isActionable && imageActionLabel && (
								<div className="theme-card__image-label">{ imageActionLabel }</div>
							) }
							{ image }
						</a>
					</div>
					{ isLoading && (
						<div className="theme-card__loading">
							<div className="theme-card__loading-dot" />
						</div>
					) }
					{ isSoftLaunched && (
						<div className="theme-card__info-soft-launched">
							<div className="theme-card__info-soft-launched-banner">
								{ translate( 'A8C Only' ) }
							</div>
						</div>
					) }
					<div className="theme-card__info">
						<h2 className="theme-card__info-title">
							<span>{ name }</span>
						</h2>
						{ ! isActive && badge && (
							<div className="theme-card__info-badge-container">{ badge }</div>
						) }
						{ isActive && <ActiveBadge /> }
						{ optionsMenu && <div className="theme-card__info-options">{ optionsMenu }</div> }
					</div>
				</div>
			</Card>
		);
	}
);

export default ThemeCard;
