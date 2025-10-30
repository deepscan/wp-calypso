import { DomainSubtype, EmailBox } from '@automattic/api-core';
import { domainsQuery } from '@automattic/api-queries';
import { useQuery } from '@tanstack/react-query';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { useMemo, useState } from 'react';
import { userMailboxesQuery } from '../../../packages/api-queries/src/me-mailboxes';
import { emailsRoute } from '../app/router/emails';
import { DataViewsCard } from '../components/dataviews-card';
import { persistViewToUrl, useSetInitialViewFromUrl } from '../utils/persist-view-to-url';
import NoDomainsAvailableEmptyState from './components/no-domains-available-empty-state';
import NoEmailsAvailableEmptyState from './components/no-emails-available-empty-state';
import UnusedMailboxNotice from './components/unused-mailbox-notice';
import { DEFAULT_EMAILS_VIEW, getEmailFields, useEmailActions } from './dataviews';
import { Layout } from './layout';
import { mapMailboxToEmail } from './mappers/mailbox-to-email-mapper';
import type { Email } from './types';
import type { View } from '@wordpress/dataviews';

import './style.scss';

function Emails() {
	const { domainName }: { domainName?: string } = emailsRoute.useSearch();
	const { data: allDomains, isLoading: isLoadingDomains } = useQuery( domainsQuery() );
	const domains = ( allDomains ?? [] ).filter(
		( d ) => d.current_user_is_owner && d.subtype.id !== DomainSubtype.DEFAULT_ADDRESS
	);

	const { data: allEmailAccounts, isLoading: isLoadingEmailAccounts } = useQuery(
		userMailboxesQuery()
	);

	// Aggregate all domains into a single array
	const { domainsWithEmails, domainsWithoutEmails } = useMemo( () => {
		if ( isLoadingDomains || isLoadingEmailAccounts ) {
			return { domainsWithEmails: [], domainsWithoutEmails: [] };
		}

		const domainsWithEmails =
			allEmailAccounts?.map( ( mailbox ) => mailbox.domains[ 0 ].domain ) ?? [];
		return {
			domainsWithEmails: domains.filter( ( d ) => domainsWithEmails.includes( d.domain ) ),
			domainsWithoutEmails: domains.filter( ( d ) => ! domainsWithEmails.includes( d.domain ) ),
		};
	}, [ allEmailAccounts, domains, isLoadingDomains, isLoadingEmailAccounts ] );

	const emails: Email[] = useMemo( () => {
		if ( ! allEmailAccounts?.length ) {
			return [];
		}
		return allEmailAccounts
			.flatMap( ( account ) =>
				account.emails.map( ( box: EmailBox ) => mapMailboxToEmail( box, account ) )
			)
			.filter( ( email ) => email.canUserManage ) as Email[];
	}, [ allEmailAccounts ] );

	// Gather domains with unused mailbox warnings
	const domainsWithUnusedMailbox: string[] = useMemo( () => {
		if ( ! allEmailAccounts?.length ) {
			return [];
		}
		const warnedDomains = new Set< string >();
		for ( const account of allEmailAccounts ) {
			const hasUnusedWarning = ( account.warnings ?? [] ).some(
				( w ) => w.warning_slug === 'unused_mailboxes'
			);
			if ( hasUnusedWarning ) {
				warnedDomains.add( account.domains[ 0 ].domain );
			}
		}

		// Return only domains we show in the table (i.e., that actually have emails)
		return domainsWithEmails
			.filter( ( d ) => warnedDomains.has( d.domain ) )
			.map( ( d ) => d.domain );
	}, [ domainsWithEmails, allEmailAccounts ] );

	const [ selection, setSelection ] = useState< Email[] >( [] );
	const [ view, setView ] = useState< View >( DEFAULT_EMAILS_VIEW );
	useSetInitialViewFromUrl( {
		fieldName: 'domainName',
		fieldValue: domainName,
		setView,
	} );

	const actions = useEmailActions();

	const emailFields = getEmailFields( domainsWithEmails );

	const onChangeView = ( newView: View ) => {
		persistViewToUrl( newView, 'domainName' );
		setView( newView );
	};

	const { data: filteredData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( emails, view, emailFields );
	}, [ emails, view, emailFields ] );

	let emptyState = null;
	if ( emails.length === 0 ) {
		emptyState = domainsWithoutEmails ? (
			<NoEmailsAvailableEmptyState />
		) : (
			<NoDomainsAvailableEmptyState />
		);
	}

	return (
		<Layout>
			{ ! isLoadingDomains && ! isLoadingEmailAccounts && (
				<UnusedMailboxNotice domains={ domainsWithUnusedMailbox } />
			) }
			<DataViewsCard>
				<DataViews
					data={ filteredData }
					isLoading={ isLoadingDomains || isLoadingEmailAccounts }
					fields={ emailFields }
					view={ view }
					onChangeView={ onChangeView }
					selection={ selection.map( ( item ) => item.id ) }
					onChangeSelection={ ( ids ) =>
						setSelection( emails.filter( ( email ) => ids.includes( email.id ) ) )
					}
					actions={ actions }
					defaultLayouts={ { table: {} } }
					paginationInfo={ paginationInfo }
					empty={ emptyState }
				/>
			</DataViewsCard>
		</Layout>
	);
}

export default Emails;
