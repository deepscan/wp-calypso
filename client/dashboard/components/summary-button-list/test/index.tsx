/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import SummaryButton from '@automattic/components/src/summary-button';
import { render, screen } from '@testing-library/react';
import { SummaryButtonList } from '../index';
import type { Density } from '@automattic/components/src/summary-button/types';

describe( 'SummaryButtonList', () => {
	it( 'renders a title and description', () => {
		render(
			<SummaryButtonList title="My Settings" description="Configure your settings">
				<SummaryButton title="Setting One" />
			</SummaryButtonList>
		);
		const heading = screen.getByRole( 'heading', { name: 'My Settings' } );
		expect( heading ).toBeVisible();
		expect( screen.getByText( 'Configure your settings' ) ).toBeVisible();
	} );
	it( 'passes the density prop to children', () => {
		interface TestChildProps {
			density?: Density;
		}
		const TestChild = ( props: TestChildProps ) => (
			<button aria-label="Test Child" data-density={ props.density }>
				Child
			</button>
		);
		render(
			<SummaryButtonList title="My Settings" density="low">
				<TestChild />
			</SummaryButtonList>
		);
		const testChild = screen.getByRole( 'button', { name: 'Test Child' } );
		expect( testChild ).toBeVisible();
		expect( testChild ).toHaveAttribute( 'data-density', 'low' );
	} );
} );
