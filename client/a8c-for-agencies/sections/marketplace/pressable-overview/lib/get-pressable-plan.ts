import {
	PLAN_CATEGORY_STANDARD,
	PLAN_CATEGORY_ENTERPRISE,
	PLAN_CATEGORY_SIGNATURE,
	PLAN_CATEGORY_SIGNATURE_HIGH,
} from '../constants';

export type PressablePlan = {
	slug: string;
	install: number;
	visits: number;
	storage: number;
	category: string;
};

const PLAN_DATA: Record< string, PressablePlan > = {
	// [Legacy] Old Pressable plans
	'pressable-wp-1': {
		slug: 'pressable-wp-1',
		install: 1,
		visits: 50000,
		storage: 20,
		category: PLAN_CATEGORY_STANDARD,
	},
	'pressable-wp-2': {
		slug: 'pressable-wp-2',
		install: 5,
		visits: 100000,
		storage: 50,
		category: PLAN_CATEGORY_STANDARD,
	},
	'pressable-wp-3': {
		slug: 'pressable-wp-3',
		install: 10,
		visits: 250000,
		storage: 80,
		category: PLAN_CATEGORY_STANDARD,
	},
	'pressable-wp-4': {
		slug: 'pressable-wp-4',
		install: 25,
		visits: 500000,
		storage: 175,
		category: PLAN_CATEGORY_STANDARD,
	},
	'pressable-wp-5': {
		slug: 'pressable-wp-5',
		install: 50,
		visits: 1000000,
		storage: 250,
		category: PLAN_CATEGORY_STANDARD,
	},
	'pressable-wp-6': {
		slug: 'pressable-wp-6',
		install: 75,
		visits: 1500000,
		storage: 350,
		category: PLAN_CATEGORY_STANDARD,
	},
	'pressable-wp-7': {
		slug: 'pressable-wp-7',
		install: 100,
		visits: 2000000,
		storage: 500,
		category: PLAN_CATEGORY_STANDARD,
	},

	// [Legacy] Pressable Plans 2024-08
	'pressable-build': {
		slug: 'pressable-build',
		install: 1,
		visits: 30000,
		storage: 20,
		category: PLAN_CATEGORY_STANDARD,
	},
	'pressable-growth': {
		slug: 'pressable-growth',
		install: 3,
		visits: 50000,
		storage: 30,
		category: PLAN_CATEGORY_STANDARD,
	},
	'pressable-advanced': {
		slug: 'pressable-advanced',
		install: 5,
		visits: 75000,
		storage: 35,
		category: PLAN_CATEGORY_STANDARD,
	},
	'pressable-pro': {
		slug: 'pressable-pro',
		install: 10,
		visits: 150000,
		storage: 50,
		category: PLAN_CATEGORY_STANDARD,
	},
	'pressable-premium': {
		slug: 'pressable-premium',
		install: 20,
		visits: 400000,
		storage: 80,
		category: PLAN_CATEGORY_STANDARD,
	},
	'pressable-business': {
		slug: 'pressable-business',
		install: 50,
		visits: 1000000,
		storage: 200,
		category: PLAN_CATEGORY_STANDARD,
	},
	'pressable-business-80': {
		slug: 'pressable-business-80',
		install: 80,
		visits: 1600000,
		storage: 275,
		category: PLAN_CATEGORY_STANDARD,
	},
	'pressable-business-100': {
		slug: 'pressable-business-100',
		install: 100,
		visits: 2000000,
		storage: 325,
		category: PLAN_CATEGORY_STANDARD,
	},
	'pressable-business-120': {
		slug: 'pressable-business-120',
		install: 120,
		visits: 2400000,
		storage: 375,
		category: PLAN_CATEGORY_STANDARD,
	},
	'pressable-business-150': {
		slug: 'pressable-business-150',
		install: 150,
		visits: 3000000,
		storage: 450,
		category: PLAN_CATEGORY_STANDARD,
	},

	// [Legacy] Pressable Enterprise plans 2024-08
	'pressable-enterprise-4': {
		slug: 'pressable-enterprise-4',
		install: 200,
		visits: 4000000,
		storage: 500,
		category: PLAN_CATEGORY_ENTERPRISE,
	},
	'pressable-enterprise-5': {
		slug: 'pressable-enterprise-5',
		install: 250,
		visits: 5000000,
		storage: 550,
		category: PLAN_CATEGORY_ENTERPRISE,
	},
	'pressable-enterprise-6': {
		slug: 'pressable-enterprise-6',
		install: 300,
		visits: 6000000,
		storage: 600,
		category: PLAN_CATEGORY_ENTERPRISE,
	},
	'pressable-enterprise-7': {
		slug: 'pressable-enterprise-7',
		install: 350,
		visits: 7000000,
		storage: 700,
		category: PLAN_CATEGORY_ENTERPRISE,
	},
	'pressable-enterprise-8': {
		slug: 'pressable-enterprise-8',
		install: 400,
		visits: 8000000,
		storage: 800,
		category: PLAN_CATEGORY_ENTERPRISE,
	},
	'pressable-enterprise-9': {
		slug: 'pressable-enterprise-9',
		install: 450,
		visits: 9000000,
		storage: 900,
		category: PLAN_CATEGORY_ENTERPRISE,
	},
	'pressable-enterprise-10': {
		slug: 'pressable-enterprise-10',
		install: 500,
		visits: 10000000,
		storage: 1000,
		category: PLAN_CATEGORY_ENTERPRISE,
	},
	// [New] Pressable Signature Plans 2025-06
	'pressable-signature-1': {
		slug: 'pressable-signature-1',
		install: 1,
		visits: 30000,
		storage: 20,
		category: PLAN_CATEGORY_SIGNATURE,
	},
	'pressable-signature-2': {
		slug: 'pressable-signature-2',
		install: 3,
		visits: 50000,
		storage: 30,
		category: PLAN_CATEGORY_SIGNATURE,
	},
	'pressable-signature-3': {
		slug: 'pressable-signature-3',
		install: 5,
		visits: 75000,
		storage: 35,
		category: PLAN_CATEGORY_SIGNATURE,
	},
	'pressable-signature-4': {
		slug: 'pressable-signature-4',
		install: 10,
		visits: 150000,
		storage: 50,
		category: PLAN_CATEGORY_SIGNATURE,
	},
	'pressable-signature-5': {
		slug: 'pressable-signature-5',
		install: 20,
		visits: 400000,
		storage: 80,
		category: PLAN_CATEGORY_SIGNATURE,
	},
	'pressable-signature-6': {
		slug: 'pressable-signature-6',
		install: 50,
		visits: 1000000,
		storage: 200,
		category: PLAN_CATEGORY_SIGNATURE,
	},
	'pressable-signature-7': {
		slug: 'pressable-signature-7',
		install: 80,
		visits: 1600000,
		storage: 275,
		category: PLAN_CATEGORY_SIGNATURE,
	},
	'pressable-signature-8': {
		slug: 'pressable-signature-8',
		install: 100,
		visits: 2000000,
		storage: 325,
		category: PLAN_CATEGORY_SIGNATURE,
	},
	'pressable-signature-9': {
		slug: 'pressable-signature-9',
		install: 120,
		visits: 2400000,
		storage: 375,
		category: PLAN_CATEGORY_SIGNATURE,
	},
	'pressable-signature-10': {
		slug: 'pressable-signature-10',
		install: 150,
		visits: 3000000,
		storage: 450,
		category: PLAN_CATEGORY_SIGNATURE,
	},
	'pressable-signature-11': {
		slug: 'pressable-signature-11',
		install: 200,
		visits: 4000000,
		storage: 500,
		category: PLAN_CATEGORY_SIGNATURE_HIGH,
	},
	'pressable-signature-12': {
		slug: 'pressable-signature-12',
		install: 250,
		visits: 5000000,
		storage: 550,
		category: PLAN_CATEGORY_SIGNATURE_HIGH,
	},
	'pressable-signature-13': {
		slug: 'pressable-signature-13',
		install: 300,
		visits: 6000000,
		storage: 600,
		category: PLAN_CATEGORY_SIGNATURE_HIGH,
	},
	'pressable-signature-14': {
		slug: 'pressable-signature-14',
		install: 350,
		visits: 7000000,
		storage: 700,
		category: PLAN_CATEGORY_SIGNATURE_HIGH,
	},
	'pressable-signature-15': {
		slug: 'pressable-signature-15',
		install: 400,
		visits: 8000000,
		storage: 800,
		category: PLAN_CATEGORY_SIGNATURE_HIGH,
	},
	'pressable-signature-16': {
		slug: 'pressable-signature-16',
		install: 450,
		visits: 9000000,
		storage: 900,
		category: PLAN_CATEGORY_SIGNATURE_HIGH,
	},
	'pressable-signature-17': {
		slug: 'pressable-signature-17',
		install: 500,
		visits: 10000000,
		storage: 1000,
		category: PLAN_CATEGORY_SIGNATURE_HIGH,
	},
};

export default function getPressablePlan( slug: string ) {
	return PLAN_DATA[ slug ];
}
