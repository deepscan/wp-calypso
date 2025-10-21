import page from '@automattic/calypso-router';
import { Button, FoldableCard, Gridicon } from '@automattic/components';
import { formatNumber } from '@automattic/number-formatters';
import { Badge } from '@automattic/ui';
import { __experimentalHStack as HStack } from '@wordpress/components';
import { useTranslate } from 'i18n-calypso';
import { useDispatch, useSelector } from 'react-redux';
import { A4A_MARKETPLACE_HOSTING_PRESSABLE_LINK } from 'calypso/a8c-for-agencies/components/sidebar-menu/lib/constants';
import pressableIcon from 'calypso/assets/images/pressable/pressable-icon.svg';
import { getActiveAgency, isAgencyOwner } from 'calypso/state/a8c-for-agencies/agency/selectors';
import { recordTracksEvent } from 'calypso/state/analytics/actions/record';

const pressableUrl = 'https://my.pressable.com/agency/auth';

const PressableOffering = () => {
	const translate = useTranslate();
	const agency = useSelector( getActiveAgency );
	const dispatch = useDispatch();
	const isPressableRegular =
		null === agency?.third_party?.pressable?.a4a_id && agency?.third_party.pressable.pressable_id;

	const highlights = [
		translate( 'Git integration, WP-CLI, SSH, and staging.' ),
		translate( 'Lightning-fast performance.' ),
		translate( '%(uptimePercent)s uptime SLA.', {
			args: {
				uptimePercent: formatNumber( 1, {
					numberFormatOptions: { style: 'percent' },
				} ),
			},
			comment: '100% uptime SLA',
		} ),
		translate( 'Smart, managed plugin updates.' ),
		translate( 'Comprehensive WP security & performance with Jetpack Complete included.' ),
		translate( '24/7 support from WordPress experts.' ),
	];

	const handleActionButtonClick = () => {
		page( A4A_MARKETPLACE_HOSTING_PRESSABLE_LINK );
		dispatch(
			recordTracksEvent( 'calypso_a4a_overview_click_open_marketplace', {
				section: 'hosting',
				product: 'pressable',
			} )
		);
	};

	const header = (
		<div className="a4a-offering-item__title-container">
			<img className="pressable-icon" src={ pressableIcon } alt="Pressable" />
			<h3 className="a4a-offering-item__title">
				<HStack spacing={ 3 }>
					<span>{ translate( 'Pressable' ) }</span>
					{ isPressableRegular && (
						<Badge intent="success">{ translate( "You're signed up!" ) }</Badge>
					) }
				</HStack>
			</h3>
		</div>
	);

	const isOwner = useSelector( isAgencyOwner );

	return (
		<FoldableCard
			className="a4a-oferring-item-pressable a4a-offering-item__card"
			header={ header }
			expanded
		>
			<p className="a4a-offering-item__description">
				{ translate(
					'Pressable offers world-class managed WordPress hosting for agencies with award-winning support, powerful site management, and flexible plans that scale with your business.'
				) }
			</p>
			<ul className="a4a-offering-item__card-list">
				{ highlights.map( ( highlightItemText, index ) => (
					<li className="a4a-offering-item__card-list-item" key={ index }>
						<div className="a4a-offering-item__icon-container">
							<Gridicon className="a4a-offering-item__gridicon" icon="checkmark" size={ 18 } />
						</div>
						<span className="a4a-offering-item__text">{ highlightItemText }</span>
					</li>
				) ) }
			</ul>
			{ ! isPressableRegular ? (
				<Button className="a4a-offering-item__button" onClick={ handleActionButtonClick } primary>
					{ translate( 'Explore Pressable' ) }
				</Button>
			) : (
				isOwner && (
					<Button
						className="a4a-offering-item__button"
						primary
						target="_blank"
						rel="norefferer nooppener"
						href={ pressableUrl }
					>
						{ translate( 'View your dashboard ↗' ) }
					</Button>
				)
			) }
		</FoldableCard>
	);
};

export default PressableOffering;
