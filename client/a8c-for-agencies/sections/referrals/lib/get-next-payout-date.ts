// We are using these dates on multiple places in the codebase, like Referrals and WooPayments.
// We also calculate the commissions in the backend for Referrals and WooPayments.
// TODO: We should probably move this to an API endpoint so that we have a single source of truth.
// Please ensure to update the dates in the backend as well if you change these dates.
const PAYOUT_DATES = [
	{ month: 3, day: 2, activityStart: { month: 10, day: 1 }, activityEnd: { month: 12, day: 31 } }, // March 2 (Q4 activity)
	{ month: 6, day: 1, activityStart: { month: 1, day: 1 }, activityEnd: { month: 3, day: 31 } }, // June 1 (Q1 activity)
	{ month: 9, day: 1, activityStart: { month: 4, day: 1 }, activityEnd: { month: 6, day: 30 } }, // September 1 (Q2 activity)
	{ month: 12, day: 1, activityStart: { month: 7, day: 1 }, activityEnd: { month: 9, day: 30 } }, // December 1 (Q3 activity)
];

export const getNextPayoutDate = ( currentDate: Date ): Date => {
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth() + 1; // Convert to 1-based month
	const currentDay = currentDate.getDate();

	// Find the next payout date that's closest to current date
	const nextPayout = PAYOUT_DATES.find( ( { month, day } ) => {
		return month > currentMonth || ( month === currentMonth && day > currentDay );
	} );

	if ( nextPayout ) {
		return new Date( currentYear, nextPayout.month - 1, nextPayout.day );
	}

	// If no payout dates left this year, return first payout of next year
	return new Date( currentYear + 1, PAYOUT_DATES[ 0 ].month - 1, PAYOUT_DATES[ 0 ].day );
};

export const getNextPayoutDateActivityWindow = ( currentDate: Date ) => {
	const nextPayoutDate = getNextPayoutDate( currentDate );
	const nextPayoutMonth = nextPayoutDate.getMonth() + 1; // Convert to 1-based month

	const payoutPeriod = PAYOUT_DATES.find( ( { month } ) => month === nextPayoutMonth );

	if ( ! payoutPeriod ) {
		throw new Error( 'Invalid payout date' );
	}

	const year = nextPayoutDate.getFullYear();
	const { activityStart, activityEnd } = payoutPeriod;

	// For Q4 activity (March payout), the activity was in previous year
	const startYear = payoutPeriod === PAYOUT_DATES[ 0 ] ? year - 1 : year;
	const endYear = payoutPeriod === PAYOUT_DATES[ 0 ] ? year - 1 : year;

	return {
		start: new Date( startYear, activityStart.month - 1, activityStart.day ),
		finish: new Date( endYear, activityEnd.month - 1, activityEnd.day ),
	};
};

const getCurrentCycle = ( currentDate: Date ) => {
	const currentMonth = currentDate.getMonth() + 1;

	// Find current cycle based on activity periods
	const currentCycle = PAYOUT_DATES.find(
		( { activityStart, activityEnd } ) =>
			currentMonth >= activityStart.month && currentMonth <= activityEnd.month
	);

	if ( ! currentCycle ) {
		throw new Error( 'Invalid current date' );
	}

	return currentCycle;
};

export const getCurrentCyclePayoutDate = ( currentDate: Date ): Date => {
	const currentCycle = getCurrentCycle( currentDate );
	const currentYear = currentDate.getFullYear();

	// For Q4 activity (March payout), the payout is in the next year
	const payoutYear = currentCycle === PAYOUT_DATES[ 0 ] ? currentYear + 1 : currentYear;

	return new Date( payoutYear, currentCycle.month - 1, currentCycle.day );
};

export const getCurrentCycleActivityWindow = ( currentDate: Date ) => {
	const currentCycle = getCurrentCycle( currentDate );
	const currentYear = currentDate.getFullYear();

	const { activityStart, activityEnd } = currentCycle;

	// Activity window is always in the current year
	return {
		start: new Date( currentYear, activityStart.month - 1, activityStart.day ),
		finish: new Date( currentYear, activityEnd.month - 1, activityEnd.day ),
	};
};
