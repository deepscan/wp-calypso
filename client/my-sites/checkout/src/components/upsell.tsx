export function UpSellCoupon( { onClick }: { onClick: () => void } ) {
	return (
		<div>
			<h4>Exclusive offer</h4>
			<p>Buy a quick start session and get 50% off.</p>
			<button onClick={ onClick }>Add to cart</button>
		</div>
	);
}
