import { useTranslate } from 'i18n-calypso';
import { useMemo } from 'react';
import { BillingTransaction } from 'calypso/state/billing-transactions/types';
import { groupDomainProducts, formatDisplayDate, formatMonthYear } from '../utils';
import type { Filter } from '../data-views-types';
import type { View } from '@wordpress/dataviews';

function matchesSearch(
	transaction: BillingTransaction,
	searchTerm: string,
	translate: ReturnType< typeof useTranslate >
) {
	const [ transactionItem ] = groupDomainProducts( transaction.items, translate );
	const searchableFields = [
		transaction.service,
		transactionItem.product,
		transactionItem.variation,
		transactionItem.domain,
		formatDisplayDate( new Date( transaction.date ) ),
	];

	return searchableFields.some(
		( field ) => field && field.toString().toLowerCase().includes( searchTerm.toLowerCase() )
	);
}

function matchesFilter(
	transaction: BillingTransaction,
	filter: Filter,
	translate: ReturnType< typeof useTranslate >
) {
	if ( filter.field === 'service' && filter.value ) {
		return transaction.service === filter.value;
	}
	if ( filter.field === 'type' && filter.value ) {
		const [ firstItem ] = groupDomainProducts( transaction.items, translate );
		return firstItem.type === filter.value;
	}
	if ( filter.field === 'date' && filter.value && typeof filter.value === 'string' ) {
		const [ year, month ] = filter.value.split( '-' ).map( Number );
		const filterDate = new Date( year, month - 1 );
		const transactionDate = new Date( transaction.date );
		return formatMonthYear( transactionDate ) === formatMonthYear( filterDate );
	}
	return true;
}

function matchesSiteId( transaction: BillingTransaction, siteId: number | null | undefined ) {
	if ( ! siteId ) {
		return true;
	}
	return transaction.items.some( ( item ) => String( item.site_id ) === String( siteId ) );
}

export function useTransactionsFiltering(
	transactions: BillingTransaction[] | null,
	view: View,
	siteId: number | null
) {
	const translate = useTranslate();

	return useMemo( () => {
		return ( transactions ?? [] ).filter( ( transaction ) => {
			if ( ! matchesSiteId( transaction, siteId ) ) {
				return false;
			}

			if ( view.search && ! matchesSearch( transaction, view.search, translate ) ) {
				return false;
			}

			if ( view.filters?.length === 0 ) {
				return true;
			}

			return view.filters?.every( ( filter ) => matchesFilter( transaction, filter, translate ) );
		} );
	}, [ transactions, view.search, view.filters, translate, siteId ] );
}
