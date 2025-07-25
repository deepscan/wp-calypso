/**
 * Object contains countries for which alternate processors may require additional fields
 * PAYMENT_PROCESSOR_COUNTRIES_FIELDS[ {countryCode} ].fields - defines form field names we MUST display for extra payment information
 */
export const PAYMENT_PROCESSOR_COUNTRIES_FIELDS: Record<
	string,
	undefined | { fields: string[] }
> = {
	BR: {
		fields: [
			'document',
			'street-number',
			'address-1',
			'address-2',
			'state',
			'city',
			'phone-number',
			'postal-code',
		],
	},
	MX: {
		fields: [ 'phone-number', 'postal-code' ],
	},
	IN: {
		fields: [
			'name',
			'pan',
			'gstin',
			'street-number',
			'address-1',
			'address-2',
			'state',
			'city',
			'postal-code',
		],
	},
	ID: {
		fields: [ 'name', 'nik', 'phone-number' ],
	},
};
