/**
 * External dependencies
 */
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Field, formValueSelector, reduxForm } from 'redux-form';
import { localize } from 'i18n-calypso';
import { flowRight } from 'lodash';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Card from 'components/card';
import ExternalLink from 'components/external-link';
import FormFieldset from 'components/forms/form-fieldset';
import FormLabel from 'components/forms/form-label';
import FormSettingExplanation from 'components/forms/form-setting-explanation';
import SectionHeader from 'components/section-header';

const JobListings = ( {
	perPage,
	renderNumberInput,
	renderRadio,
	renderTextInput,
	renderToggle,
	translate,
} ) => {
	return (
		<div>
			<SectionHeader label={ translate( 'Listings' ) }>
				<Button compact primary>
					{ translate( 'Save Settings' ) }
				</Button>
			</SectionHeader>
			<Card>
				<form>
					<p>
						{ translate(
							'Display {{listings /}} job listing per page',
							'Display {{listings /}} job listings per page',
							{
								count: perPage,
								components: {
									listings:
										<Field
											component={ renderNumberInput }
											name="job_manager_per_page" />
								}
							}
						) }
					</p>

					<FormFieldset>
						<Field
							component={ renderToggle( translate( 'Hide filled positions' ) ) }
							name="job_manager_hide_filled_positions" />
						<FormSettingExplanation isIndented>
							{ translate( 'Filled positions will not display in your archives.' ) }
						</FormSettingExplanation>

						<Field
							component={ renderToggle( translate( 'Hide expired listings in job archives/search' ) ) }
							name="job_manager_hide_expired" />
						<FormSettingExplanation isIndented>
							{ translate( 'Expired job listings will not be searchable.' ) }
						</FormSettingExplanation>

						<Field
							component={ renderToggle( translate( 'Hide content in expired single job listings' ) ) }
							name="job_manager_hide_expired_content" />
						<FormSettingExplanation isIndented>
							{ translate( 'Your site will display the titles of expired listings, but not the ' +
								'content of the listings. Otherwise, expired listings display their full content ' +
								'minus the application area.' ) }
						</FormSettingExplanation>
					</FormFieldset>
				</form>
			</Card>

			<SectionHeader label={ translate( 'Categories' ) }>
				<Button compact primary>
					{ translate( 'Save Settings' ) }
				</Button>
			</SectionHeader>
			<Card>
				<form>
					<FormFieldset>
						<Field
							component={ renderToggle( translate( 'Enable listing categories' ) ) }
							name="job_manager_enable_categories" />
						<FormSettingExplanation isIndented>
							{ translate( 'This lets users select from a list of categories when submitting a ' +
								'job. Note!: an admin has to create categories before site users can select them.' ) }
						</FormSettingExplanation>

						<Field
							component={ renderToggle( translate( 'Default to category multiselect' ) ) }
							name="job_manager_enable_default_category_multiselect" />
						<FormSettingExplanation isIndented>
							{ translate( 'The category selection box will default to allowing multiple ' +
								'selections on the [jobs] shortcode. Without this, users will only be able to ' +
								'select a single category when submitting jobs.' ) }
						</FormSettingExplanation>
					</FormFieldset>

					<FormFieldset>
						<FormLabel>
							{ translate( 'Category Filter Type' ) }
						</FormLabel>
						<FormSettingExplanation>
							{ translate( 'Determines the logic used to display jobs when selecting multiple categories.' ) }
						</FormSettingExplanation>
						<FormLabel>
							<Field
								component={ renderRadio( 'any' ) }
								name="job_manager_category_filter_type" />
							<span>
								{ translate( 'Jobs will be shown if within ANY selected category' ) }
							</span>
						</FormLabel>

						<FormLabel>
							<Field
								component={ renderRadio( 'all' ) }
								name="job_manager_category_filter_type" />
							<span>
								{ translate( 'Jobs will be shown if within ALL selected categories' ) }
							</span>
						</FormLabel>
					</FormFieldset>
				</form>
			</Card>

			<SectionHeader label={ translate( 'Types' ) }></SectionHeader>
			<Card>
				<form>
					<FormFieldset>
						<Field
							component={ renderToggle( translate( 'Enable listing types' ) ) }
							name="job_manager_enable_types" />
						<FormSettingExplanation isIndented>
							{ translate( 'This lets users select from a list of types when submitting a job. ' +
								'Note!: an admin has to create types before site users can select them.' ) }
						</FormSettingExplanation>

						<Field
							component={ renderToggle( translate( 'Allow multiple types for listings' ) ) }
							name="job_manager_multi_job_type" />
						<FormSettingExplanation isIndented>
							{ translate( 'This allows users to select more than one type when submitting a job. ' +
								'The metabox on the post editor and the selection box on the front-end job ' +
								'submission form will both reflect this.' ) }
						</FormSettingExplanation>
					</FormFieldset>
				</form>
			</Card>

			<SectionHeader label={ translate( 'Date Format' ) }>
				<Button compact primary>
					{ translate( 'Save Settings' ) }
				</Button>
			</SectionHeader>
			<Card>
				<form>
					<FormFieldset>
						<FormSettingExplanation>
							{ translate( 'Choose how you want the published date for jobs to be displayed on the front-end.' ) }
						</FormSettingExplanation>
						<FormLabel>
							<Field
								component={ renderRadio( 'relative' ) }
								name="job_manager_date_format" />
							<span>
								{ translate( 'Relative to the current date (e.g., 1 day, 1 week, 1 month ago)' ) }
							</span>
						</FormLabel>

						<FormLabel>
							<Field
								component={ renderRadio( 'default' ) }
								name="job_manager_date_format" />
							<span>
								{ translate( 'Default date format as defined in Settings' ) }
							</span>
						</FormLabel>
					</FormFieldset>
				</form>
			</Card>

			<SectionHeader label={ translate( 'Google Maps API Key' ) }>
				<Button compact primary>
					{ translate( 'Save Settings' ) }
				</Button>
			</SectionHeader>
			<Card>
				<form>
					<FormFieldset>
						<Field
							component={ renderTextInput }
							name="job_manager_google_maps_api_key" />
						<FormSettingExplanation>
							{ translate(
								'Google requires an API key to retrieve location information for job listings. ' +
								'Acquire an API key from the {{a}}Google Maps API developer site{{/a}}.',
								{
									components: {
										a: (
											<ExternalLink
												icon={ true }
												target="_blank"
												href="https://developers.google.com/maps/documentation/geocoding/get-api-key"
											/>
										),
									}
								}
							) }
						</FormSettingExplanation>
					</FormFieldset>
				</form>
			</Card>
		</div>
	);
};

JobListings.propTypes = {
	renderNumberInput: PropTypes.func,
	renderRadio: PropTypes.func,
	renderTextInput: PropTypes.func,
	renderToggle: PropTypes.func,
	translate: PropTypes.func,
};

const connectComponent = connect(
	( state ) => {
		const selector = formValueSelector( 'listings', () => state.extensions.wpJobManager.form );

		return {
			perPage: selector( state, 'job_manager_per_page' ),
		};
	}
);

const createReduxForm = reduxForm( {
	enableReinitialize: true,
	form: 'listings',
	getFormState: state => state.extensions.wpJobManager.form,
} );

export default flowRight(
	connectComponent,
	localize,
	createReduxForm,
)( JobListings );
