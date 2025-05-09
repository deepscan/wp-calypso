import { localizeUrl } from '@automattic/i18n-utils';
import { ToggleControl } from '@wordpress/components';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import FormSettingExplanation from 'calypso/components/forms/form-setting-explanation';
import FormTextInput from 'calypso/components/forms/form-text-input';
import InlineSupportLink from 'calypso/components/inline-support-link';
import SupportInfo from 'calypso/components/support-info';

function Portfolios( {
	translate,
	handleAutosavingToggle,
	fields,
	onChangeField,
	isDisabled,
	isAtomic,
	siteIsJetpack,
} ) {
	const name = 'jetpack_portfolio';
	const numberFieldIdentifier = name + '_posts_per_page';
	const portfolioDescription =
		! siteIsJetpack || isAtomic
			? translate(
					'Add, organize, and display {{link}}portfolio projects{{/link}}. If your theme doesn’t support portfolio projects yet, ' +
						'you can display them using the shortcode [portfolio]. If your theme does support portfolio projects, these will remain active regardless of toggle state.',
					{
						components: {
							link: <InlineSupportLink supportContext="portfolios" />,
						},
					}
			  )
			: translate(
					'Add, organize, and display {{link}}portfolio projects{{/link}}. If your theme doesn’t support portfolio projects yet, ' +
						'you can display them using the shortcode [portfolio].',
					{
						components: {
							link: <InlineSupportLink supportContext="portfolios" />,
						},
					}
			  );
	return (
		<FormFieldset>
			<SupportInfo
				text={ translate(
					'Adds the Portfolio custom post type, allowing you to ' +
						'manage and showcase projects on your site.'
				) }
				link={
					siteIsJetpack && ! isAtomic
						? 'https://jetpack.com/support/custom-content-types/'
						: localizeUrl( 'https://wordpress.com/support/portfolios/' )
				}
				privacyLink={ siteIsJetpack && ! isAtomic }
			/>
			<div className="custom-content-types__module-settings">
				<ToggleControl
					checked={ !! fields[ name ] }
					disabled={ isDisabled }
					onChange={ handleAutosavingToggle( name ) }
					label={ translate( '{{span}}Portfolio projects{{/span}}', {
						components: { span: <span className="custom-content-types__label" /> },
					} ) }
				/>

				<div className="custom-content-types__indented-form-field indented-form-field">
					{ translate( 'Display {{field /}} per page', {
						comment:
							'The field value is a number that refers to site content type, e.g., blog post, testimonial or portfolio project',
						components: {
							field: (
								<FormTextInput
									name={ numberFieldIdentifier }
									type="number"
									step="1"
									min="0"
									aria-labelledby={ numberFieldIdentifier }
									value={
										'undefined' === typeof fields[ numberFieldIdentifier ]
											? 10
											: fields[ numberFieldIdentifier ]
									}
									onChange={ onChangeField( numberFieldIdentifier ) }
									disabled={ isDisabled || ! fields[ name ] }
								/>
							),
						},
					} ) }
				</div>
				<FormSettingExplanation isIndented>{ portfolioDescription }</FormSettingExplanation>
			</div>
		</FormFieldset>
	);
}

export default Portfolios;
