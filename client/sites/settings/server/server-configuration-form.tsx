import { Button, FormLabel, LoadingPlaceholder } from '@automattic/components';
import styled from '@emotion/styled';
import { useTranslate } from 'i18n-calypso';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import QuerySiteGeoAffinity from 'calypso/components/data/query-site-geo-affinity';
import QuerySitePhpVersion from 'calypso/components/data/query-site-php-version';
import QuerySiteStaticFile404 from 'calypso/components/data/query-site-static-file-404';
import QuerySiteWpVersion from 'calypso/components/data/query-site-wp-version';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import FormSelect from 'calypso/components/forms/form-select';
import FormSettingExplanation from 'calypso/components/forms/form-setting-explanation';
import FormTextInput from 'calypso/components/forms/form-text-input';
import { PanelCard, PanelCardHeading } from 'calypso/components/panel';
import { getDataCenterOptions } from 'calypso/data/data-center';
import { getPHPVersions } from 'calypso/data/php-versions';
import { useSelector } from 'calypso/state';
import {
	updateAtomicPhpVersion,
	updateAtomicStaticFile404,
	updateAtomicWpVersion,
} from 'calypso/state/hosting/actions';
import { getAtomicHostingGeoAffinity } from 'calypso/state/selectors/get-atomic-hosting-geo-affinity';
import { getAtomicHostingPhpVersion } from 'calypso/state/selectors/get-atomic-hosting-php-version';
import { getAtomicHostingStaticFile404 } from 'calypso/state/selectors/get-atomic-hosting-static-file-404';
import { getAtomicHostingWpVersion } from 'calypso/state/selectors/get-atomic-hosting-wp-version';
import getRequest from 'calypso/state/selectors/get-request';
import { isFetchingAtomicHostingGeoAffinity } from 'calypso/state/selectors/is-fetching-atomic-hosting-geo-affinity';
import { isFetchingAtomicHostingWpVersion } from 'calypso/state/selectors/is-fetching-atomic-hosting-wp-version';
import isSiteWpcomStaging from 'calypso/state/selectors/is-site-wpcom-staging';
import { getSelectedSiteId, getSelectedSiteSlug } from 'calypso/state/ui/selectors';
import type { DataCenterOption } from '@automattic/api-core';

import './server-configuration-form.scss';

const ParagraphPlaceholder = styled( LoadingPlaceholder )( {
	height: 24,
	width: '85%',
	marginBottom: '1.25em',
} );

const LabelPlaceholder = styled( LoadingPlaceholder )( {
	height: 16,
	width: '80px',
	marginBottom: '.25em',
} );

const InputPlaceholder = styled( LoadingPlaceholder )( {
	height: 24,
	width: '220px',
	marginBottom: '1em',
} );

type ServerConfigurationFormProps = {
	disabled?: boolean;
};

export default function ServerConfigurationForm( { disabled }: ServerConfigurationFormProps ) {
	const dispatch = useDispatch();
	const translate = useTranslate();

	const siteId = useSelector( getSelectedSiteId );
	const selectedSiteSlug = useSelector( getSelectedSiteSlug );

	const isWpcomStagingSite = useSelector( ( state ) => isSiteWpcomStaging( state, siteId ) );
	const geoAffinity = useSelector( ( state ) => getAtomicHostingGeoAffinity( state, siteId ) );
	const phpVersion = useSelector( ( state ) => getAtomicHostingPhpVersion( state, siteId ) );
	const wpVersion = useSelector( ( state ) => getAtomicHostingWpVersion( state, siteId ) );
	const staticFile404 = useSelector( ( state ) => getAtomicHostingStaticFile404( state, siteId ) );

	const isGettingGeoAffinity = useSelector( ( state ) =>
		isFetchingAtomicHostingGeoAffinity( state, siteId )
	);
	const isGettingWpVersion = useSelector( ( state ) =>
		isFetchingAtomicHostingWpVersion( state, siteId )
	);
	const isGettingStaticFile404 = ! disabled && ! staticFile404;
	const isUpdatingPhpVersion = useSelector(
		( state ) => getRequest( state, updateAtomicPhpVersion( siteId, null ) )?.isLoading ?? false
	);
	const isUpdatingStaticFile404 = useSelector(
		( state ) => getRequest( state, updateAtomicStaticFile404( siteId, null ) )?.isLoading ?? false
	);
	const isUpdatingWpVersion = useSelector(
		( state ) => getRequest( state, updateAtomicWpVersion( siteId, null ) )?.isLoading ?? false
	);
	const isGettingPhpVersion = ! disabled && ! phpVersion;

	const [ selectedPhpVersion, setSelectedPhpVersion ] = useState( '' );
	const [ selectedWpVersion, setSelectedWpVersion ] = useState( '' );
	const [ selectedStaticFile404, setSelectedStaticFile404 ] = useState( '' );

	const isWpVersionChanged = selectedWpVersion && selectedWpVersion !== wpVersion;
	const isPhpVersionChanged = selectedPhpVersion && selectedPhpVersion !== phpVersion;
	const isStaticFile404Changed = selectedStaticFile404 && selectedStaticFile404 !== staticFile404;

	const { recommendedValue, phpVersions } = getPHPVersions( siteId );
	const dataCenterOptions = getDataCenterOptions();

	const wpVersionRef = useRef< HTMLLabelElement >( null );
	const wpVersionDropdownRef = useRef< HTMLSelectElement >( null );
	const wpVersionExplainerRef = useRef< HTMLParagraphElement >( null );

	const phpVersionRef = useRef< HTMLLabelElement >( null );
	const phpVersionDropdownRef = useRef< HTMLSelectElement >( null );

	const isLoading =
		isGettingGeoAffinity || isGettingPhpVersion || isGettingStaticFile404 || isGettingWpVersion;
	const isDirty = isWpVersionChanged || isPhpVersionChanged || isStaticFile404Changed;
	const isUpdating = isUpdatingWpVersion || isUpdatingPhpVersion || isUpdatingStaticFile404;

	useEffect( () => {
		function scrollTo( hash: string ) {
			let targetLabel;
			let targetControl;

			if ( wpVersionRef.current && hash === '#wp' ) {
				targetLabel = wpVersionRef.current;
				targetControl = wpVersionDropdownRef.current || wpVersionExplainerRef.current;
			} else if ( phpVersionRef.current && hash === '#php' ) {
				targetLabel = phpVersionRef.current;
				targetControl = phpVersionDropdownRef.current;
			}

			if ( targetLabel ) {
				const animationKeyframes = [ { color: null }, { color: 'var(--theme-highlight-color)' } ];
				const animationOptions: KeyframeAnimationOptions = {
					duration: 500,
					direction: 'alternate',
					easing: 'ease',
					iterations: 6,
				};

				targetLabel.scrollIntoView( { behavior: 'smooth' } );
				targetLabel.animate( animationKeyframes, animationOptions );
				targetControl?.animate( animationKeyframes, animationOptions );
			}
		}

		function onClick( event: MouseEvent ) {
			const href = window.location.href.replace( window.location.hash, '' );

			if ( event.target instanceof HTMLAnchorElement && event.target.href.startsWith( href ) ) {
				event.preventDefault();
				scrollTo( event.target.hash );
			}
		}

		document.addEventListener( 'click', onClick );
		scrollTo( window.location.hash );

		return () => {
			document.removeEventListener( 'click', onClick );
		};
	}, [ isLoading ] );

	const getWpVersions = () => {
		return [
			{
				label: translate( 'Latest' ),
				value: 'latest',
			},
			{
				label: translate( 'Beta' ),
				value: 'beta',
			},
		];
	};

	const getWpVersionContent = () => {
		if ( isGettingWpVersion ) {
			return;
		}

		const selectedWpVersionValue = selectedWpVersion || wpVersion || ( disabled ? 'latest' : '' );

		return (
			<FormFieldset>
				<FormLabel ref={ wpVersionRef }>{ translate( 'WordPress version' ) }</FormLabel>
				{ isWpcomStagingSite && (
					<>
						<FormSelect
							disabled={ disabled || isUpdating }
							className="web-server-settings-card__wp-version-select"
							onChange={ ( event ) => setSelectedWpVersion( event.currentTarget.value ) }
							inputRef={ wpVersionDropdownRef }
							value={ selectedWpVersionValue }
						>
							{ getWpVersions().map( ( option ) => {
								return (
									<option
										disabled={ option.value === wpVersion }
										value={ option.value }
										key={ option.label }
									>
										{ option.label }
									</option>
								);
							} ) }
						</FormSelect>
					</>
				) }
				{ ! isWpcomStagingSite && (
					<FormSettingExplanation ref={ wpVersionExplainerRef }>
						{ translate(
							'Every WordPress.com site runs the latest WordPress version. ' +
								'For testing purposes, you can switch to the beta version of the next WordPress release on {{a}}your staging site{{/a}}.',
							{
								components: {
									a: <a href={ `/staging-site/${ selectedSiteSlug }` } />,
								},
							}
						) }
					</FormSettingExplanation>
				) }
			</FormFieldset>
		);
	};

	const getGeoAffinityContent = () => {
		if ( isGettingGeoAffinity || ! geoAffinity ) {
			return;
		}

		const displayValue = dataCenterOptions.hasOwnProperty( geoAffinity )
			? dataCenterOptions[ geoAffinity as DataCenterOption ]
			: geoAffinity;

		return (
			<FormFieldset>
				<FormLabel>{ translate( 'Primary data center' ) }</FormLabel>
				<FormTextInput
					className="web-server-settings-card__data-center-input"
					value={ displayValue }
					disabled
				/>
				<FormSettingExplanation>
					{ translate(
						'The primary data center is where your site is physically located. ' +
							'For redundancy, your site also replicates in real-time to a second data center in a different region.'
					) }
				</FormSettingExplanation>
			</FormFieldset>
		);
	};

	const getPhpVersionContent = () => {
		if ( isGettingPhpVersion ) {
			return;
		}

		const selectedPhpVersionValue =
			selectedPhpVersion || phpVersion || ( disabled ? recommendedValue : '' );
		return (
			<FormFieldset>
				<FormLabel ref={ phpVersionRef }>{ translate( 'PHP version' ) }</FormLabel>
				<FormSelect
					disabled={ disabled || isUpdating }
					className="web-server-settings-card__php-version-select"
					onChange={ ( event ) => {
						const newVersion = event.currentTarget.value;
						setSelectedPhpVersion( newVersion );
					} }
					inputRef={ phpVersionDropdownRef }
					value={ selectedPhpVersionValue }
				>
					{ phpVersions.map( ( option ) => {
						// Show disabled PHP version only if the site is still using it.
						if ( option.value !== phpVersion && option.disabled ) {
							return null;
						}

						return (
							<option
								disabled={ option.value === phpVersion }
								value={ option.value }
								key={ option.value }
							>
								{ option.label }
							</option>
						);
					} ) }
				</FormSelect>
			</FormFieldset>
		);
	};

	const getStaticFile404Settings = () => [
		{
			label: translate( 'Default', {
				comment: 'The default way to handle requests for nonexistent static files.',
			} ),
			value: 'default',
		},
		{
			label: translate( 'Send a lightweight File-Not-Found page', {
				comment: 'Respond to requests for nonexistent static files with a simple, fast 404 page',
			} ),
			value: 'lightweight',
		},
		{
			label: translate( 'Delegate request to WordPress', {
				comment: 'Let WordPress handle requests for nonexistent static files',
			} ),
			value: 'wordpress',
		},
	];

	const getStaticFile404Content = () => {
		if ( isGettingStaticFile404 ) {
			return;
		}

		const selectedStaticFile404Value =
			selectedStaticFile404 || staticFile404 || ( disabled ? recommendedValue : '' );

		return (
			<FormFieldset>
				<FormLabel htmlFor="staticFile404Select">
					{ translate( 'Handling requests for nonexistent assets', {
						comment:
							'How the web server handles requests for nonexistent asset files. ' +
							'For example, file types like JavaScript, CSS, and images are considered assets.',
					} ) }
				</FormLabel>
				<FormSelect
					id="staticFile404Select"
					disabled={ disabled || isUpdating }
					className="web-server-settings-card__static-file-404-select"
					onChange={ ( event ) => {
						const newSetting = event.currentTarget.value;
						setSelectedStaticFile404( newSetting );
					} }
					value={ selectedStaticFile404Value }
				>
					{ getStaticFile404Settings().map( ( option ) => {
						return (
							<option
								disabled={ option.value === staticFile404 }
								value={ option.value }
								key={ option.value }
							>
								{ option.label }
							</option>
						);
					} ) }
				</FormSelect>
				<FormSettingExplanation>
					{ translate(
						'Assets are images, fonts, JavaScript, and CSS files that web browsers request as part of ' +
							'loading a web page. This setting controls how the web server handles requests for ' +
							'missing asset files.'
					) }
				</FormSettingExplanation>
			</FormFieldset>
		);
	};

	const getPlaceholderContent = () => {
		return (
			<>
				<ParagraphPlaceholder />
				<LabelPlaceholder />
				<InputPlaceholder />
				<LabelPlaceholder />
				<InputPlaceholder />
			</>
		);
	};

	const handleSave = () => {
		if ( isWpVersionChanged ) {
			dispatch( updateAtomicWpVersion( siteId, selectedWpVersion ) );
		}
		if ( isPhpVersionChanged ) {
			dispatch( updateAtomicPhpVersion( siteId, selectedPhpVersion ) );
		}
		if ( isStaticFile404Changed ) {
			dispatch( updateAtomicStaticFile404( siteId, selectedStaticFile404 ) );
		}
	};

	const getSaveButton = () => {
		return (
			<Button
				onClick={ handleSave }
				busy={ isUpdating }
				disabled={ disabled || isUpdating || ! isDirty }
			>
				{ translate( 'Save' ) }
			</Button>
		);
	};

	return (
		<PanelCard>
			<QuerySiteGeoAffinity siteId={ siteId } />
			<QuerySitePhpVersion siteId={ siteId } />
			<QuerySiteWpVersion siteId={ siteId } />
			<QuerySiteStaticFile404 siteId={ siteId } />
			<PanelCardHeading id="web-server-settings">
				{ translate( 'Server configuration' ) }
			</PanelCardHeading>
			{ ! isLoading && getWpVersionContent() }
			{ ! isLoading && getPhpVersionContent() }
			{ ! isLoading && getGeoAffinityContent() }
			{ ! isLoading && getStaticFile404Content() }
			{ isLoading && getPlaceholderContent() }
			{ getSaveButton() }
		</PanelCard>
	);
}
