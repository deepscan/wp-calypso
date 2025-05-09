export const getSubscriptionStatus = (
	status: string,
	translate: ( key: string ) => string
): {
	children: string | undefined;
	type: 'success' | 'warning' | 'info' | 'error' | undefined;
} => {
	switch ( status ) {
		case 'pending':
			return {
				children: translate( 'Pending' ),
				type: 'warning',
			};
		case 'active':
			return {
				children: translate( 'Active' ),
				type: 'success',
			};
		case 'error':
			return {
				children: translate( 'Error' ),
				type: 'error',
			};
		case 'canceled':
			return {
				children: translate( 'Canceled' ),
				type: 'info',
			};
		default:
			return {
				children: undefined,
				type: undefined,
			};
	}
};
