import { formatCurrency } from '@automattic/number-formatters';
import { useTranslate } from 'i18n-calypso';
import QuerySitePlans from 'calypso/components/data/query-site-plans';
import InlineSupportLink from 'calypso/components/inline-support-link';
import Notice from 'calypso/components/notice';
import { usePlanUpgradeCreditsApplicable } from 'calypso/my-sites/plans-features-main/hooks/use-plan-upgrade-credits-applicable';
import { useSelector } from 'calypso/state';
import { getCurrentUserCurrencyCode } from 'calypso/state/currency-code/selectors';
import type { PlanSlug } from '@automattic/calypso-products';

type Props = {
	className?: string;
	onDismissClick?: () => void;
	siteId: number;
	visiblePlans?: PlanSlug[];
};

const PlanNoticePlanToHigherPlanCredit = ( {
	className,
	onDismissClick,
	siteId,
	visiblePlans,
}: Props ) => {
	const translate = useTranslate();
	const currencyCode = useSelector( getCurrentUserCurrencyCode );

	const planUpgradeCreditsApplicable = usePlanUpgradeCreditsApplicable( siteId, visiblePlans );

	const showNotice =
		visiblePlans &&
		visiblePlans.length > 0 &&
		planUpgradeCreditsApplicable !== null &&
		planUpgradeCreditsApplicable > 0;

	return (
		<>
			<QuerySitePlans siteId={ siteId } />
			{ showNotice && (
				<Notice
					className={ className }
					showDismiss={ !! onDismissClick }
					onDismissClick={ onDismissClick }
					icon="info-outline"
					status="is-success"
					theme="light"
				>
					{ translate(
						'You have {{b}}%(amountInCurrency)s{{/b}} in {{a}}upgrade credits{{/a}} available from your current plan. This credit will be applied to the pricing below at checkout if you upgrade today!',
						{
							args: {
								amountInCurrency: formatCurrency(
									planUpgradeCreditsApplicable,
									currencyCode ?? '',
									{
										isSmallestUnit: true,
									}
								),
							},
							components: {
								b: <strong />,
								a: <InlineSupportLink supportContext="plans-upgrade-credit" showIcon={ false } />,
							},
						}
					) }
				</Notice>
			) }
		</>
	);
};

export default PlanNoticePlanToHigherPlanCredit;
