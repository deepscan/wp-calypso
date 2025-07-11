import { useMemo } from 'react';
import { defaultSortField } from 'calypso/me/purchases/billing-history/constants';
import { BillingTransaction } from 'calypso/state/billing-transactions/types';
import type { SortableField } from '../data-views-types';
import type { View } from '@wordpress/dataviews';

function compareTransactions(
	a: BillingTransaction,
	b: BillingTransaction,
	sortField: SortableField
): number {
	switch ( sortField ) {
		case 'date':
			return new Date( a.date ).getTime() - new Date( b.date ).getTime();
		case 'service': {
			const aService = a.items.length > 0 ? a.items[ 0 ].variation : a.service;
			const bService = b.items.length > 0 ? b.items[ 0 ].variation : b.service;
			return ( aService || '' ).localeCompare( bService || '' );
		}
		case 'type': {
			const aType = a.items.length > 0 ? a.items[ 0 ].type : '';
			const bType = b.items.length > 0 ? b.items[ 0 ].type : '';
			return ( aType || '' ).localeCompare( bType || '' );
		}
		case 'amount':
			return a.amount_integer - b.amount_integer;
		default:
			return 0;
	}
}

export function useTransactionsSorting( transactions: BillingTransaction[], view: View ) {
	return useMemo( () => {
		return [ ...transactions ].sort( ( a, b ) => {
			const comparison = compareTransactions( a, b, view.sort?.field ?? defaultSortField );
			return view.sort?.direction === 'desc' ? -comparison : comparison;
		} );
	}, [ transactions, view.sort ] );
}
