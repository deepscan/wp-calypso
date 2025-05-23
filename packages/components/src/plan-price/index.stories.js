import PlanPrice from './';

export const Default = () => {
	return (
		<div>
			<h3>Plan with standard price</h3>
			<PlanPrice rawPrice={ 99.8 } />
			<br />
			<h3>Plan with a price range</h3>
			<PlanPrice rawPrice={ [ 99.99, 139.99 ] } />
			<br />
			<h3>Plan with a price of '0'</h3>
			<PlanPrice rawPrice={ 0 } />
			<br />
			<h3>Plan with discounted price</h3>
			<div style={ { display: 'flex' } }>
				<PlanPrice rawPrice={ 8.25 } original />
				<PlanPrice rawPrice={ 2 } discounted />
			</div>
			<br />
			<h3>Plan with discounted price range</h3>
			<div style={ { display: 'flex' } }>
				<PlanPrice rawPrice={ [ 8.25, 20.23 ] } original />
				<PlanPrice rawPrice={ [ 2.25, 3 ] } discounted />
			</div>
			<br />
			<h3>Plan with discounted price and tax</h3>
			<div style={ { display: 'flex' } }>
				<PlanPrice rawPrice={ 8.25 } original taxText="10%" />
				<PlanPrice rawPrice={ 2 } discounted taxText="10%" />
			</div>
			<br />
			<h3>Plan with discounted price range and tax</h3>
			<div style={ { display: 'flex' } }>
				<PlanPrice rawPrice={ [ 8.25, 20.23 ] } original taxText="10%" />
				<PlanPrice rawPrice={ [ 2.25, 3 ] } discounted taxText="10%" />
			</div>
			<br />
			<h3>Simple View (isInSignup) - Plan with discounted price and tax </h3>
			<div style={ { display: 'flex' } }>
				<PlanPrice rawPrice={ 8.25 } original taxText="10%" isInSignup />
				<PlanPrice rawPrice={ 2 } discounted taxText="10%" isInSignup />
			</div>
			<br />
			<h3>Simple View (isInSignup) - Plan with discounted price range and tax </h3>
			<div style={ { display: 'flex' } }>
				<PlanPrice rawPrice={ [ 8.25, 20.23 ] } original taxText="10%" isInSignup />
				<PlanPrice rawPrice={ [ 2.25, 3 ] } discounted taxText="10%" isInSignup />
			</div>
		</div>
	);
};

export default {
	title: 'Unaudited/PlanPrice',
	component: PlanPrice,
};
