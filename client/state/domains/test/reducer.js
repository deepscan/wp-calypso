import reducer from '../reducer';

describe( 'reducer', () => {
	test( 'should export expected reducer keys', () => {
		expect( Object.keys( reducer( undefined, {} ) ) ).toEqual( [
			'dns',
			'management',
			'siteRedirect',
			'transfer',
		] );
	} );
} );
