import { Spinner, ExternalLink } from '@automattic/components';
import clsx from 'clsx';
import { localize } from 'i18n-calypso';
import PropTypes from 'prop-types';
import { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { loadmShotsPreview } from 'calypso/lib/mshots';
import ErrorPane from 'calypso/my-sites/importer/error-pane';
import ImporterActionButton from 'calypso/my-sites/importer/importer-action-buttons/action-button';
import ImporterActionButtonContainer from 'calypso/my-sites/importer/importer-action-buttons/container';
import ImportableContent from 'calypso/my-sites/importer/site-importer/site-importer-importable-content';
import { recordTracksEvent } from 'calypso/state/analytics/actions';

import './site-importer-site-preview.scss';

class SiteImporterSitePreview extends Component {
	static propTypes = {
		siteURL: PropTypes.string.isRequired,
		importData: PropTypes.object,
		isLoading: PropTypes.bool,
		startImport: PropTypes.func,
		resetImport: PropTypes.func,
		site: PropTypes.object,
	};

	state = {
		sitePreviewImage: '',
		sitePreviewFailed: false,
		loadingPreviewImage: true,
	};

	componentDidMount() {
		// TODO: We might want to move this state handling to redux.
		this.loadSitePreview();
	}

	loadSitePreview = () => {
		this.setState( { loadingPreviewImage: true, previewStartTime: Date.now() } );

		loadmShotsPreview( {
			url: this.props.siteURL,
			maxRetries: 30,
			retryTimeout: 1000,
		} )
			.then( ( imageBlob ) => {
				this.setState( {
					loadingPreviewImage: false,
					sitePreviewImage: imageBlob,
					sitePreviewFailed: false,
				} );

				this.props.recordTracksEvent( 'calypso_site_importer_site_preview_success', {
					blog_id: this.props.site.ID,
					site_url: this.props.siteURL,
					time_taken_ms: Date.now() - this.state.previewStartTime,
				} );
			} )
			.catch( () => {
				this.setState( {
					loadingPreviewImage: false,
					sitePreviewImage: '',
					sitePreviewFailed: true,
				} );

				this.props.recordTracksEvent( 'calypso_site_importer_site_preview_fail', {
					blog_id: this.props.site.ID,
					site_url: this.props.siteURL,
					time_taken_ms: Date.now() - this.state.previewStartTime,
				} );
			} );
	};

	render = () => {
		const { siteURL } = this.props;
		const isLoading = this.props.isLoading || this.state.loadingPreviewImage;
		const isError = this.state.sitePreviewFailed;

		const containerClass = clsx( 'site-importer__site-preview-overlay-container', {
			isLoading,
		} );

		return (
			<div>
				{ ! isError ? (
					<Fragment>
						{ ! isLoading && (
							<Fragment>
								<div className="site-importer__site-importer-confirm-site-pane-container">
									<div className="site-importer__site-importer-confirm-site-label">
										{ this.props.translate( 'Is this your site?' ) }
										<div className="site-importer__source-url">
											<ExternalLink href={ siteURL } target="_blank">
												{ siteURL }
											</ExternalLink>
										</div>
									</div>
								</div>
								<div className={ containerClass }>
									<div className="site-importer__site-preview-column-container">
										<img
											className="site-importer__site-preview"
											src={ this.state.sitePreviewImage }
											alt={ this.props.translate( 'Screenshot of your site.' ) }
										/>
										<ImportableContent importData={ this.props.importData } />
									</div>
								</div>
								<ImporterActionButtonContainer>
									<ImporterActionButton disabled={ isLoading } onClick={ this.props.resetImport }>
										{ this.props.translate( 'Cancel' ) }
									</ImporterActionButton>
									<ImporterActionButton
										disabled={ isLoading }
										className="site-importer__site-preview-confirm-button"
										primary
										onClick={ this.props.startImport }
									>
										{ this.props.translate( 'Yes! Start import' ) }
									</ImporterActionButton>
								</ImporterActionButtonContainer>
							</Fragment>
						) }
						{ isLoading && (
							<div className="site-importer__site-preview-loading-overlay">
								<Spinner />
							</div>
						) }
					</Fragment>
				) : (
					<Fragment>
						<div className="site-importer__site-preview-error">
							<ErrorPane
								type="importError"
								description={ this.props.translate(
									'Unable to load site preview. Please try again later.'
								) }
							/>
						</div>
						<ImporterActionButtonContainer>
							<ImporterActionButton disabled={ isLoading } onClick={ this.props.resetImport }>
								{ this.props.translate( 'Cancel' ) }
							</ImporterActionButton>
						</ImporterActionButtonContainer>
					</Fragment>
				) }
			</div>
		);
	};
}

export default connect( null, { recordTracksEvent } )( localize( SiteImporterSitePreview ) );
