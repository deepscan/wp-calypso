export default function ReaderFollowingConversationIcon( { iconSize, className } ) {
	return (
		<svg
			key="following-conversation"
			fill="none"
			viewBox="0 0 24 24"
			width={ iconSize }
			height={ iconSize }
			className={ className }
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M12 18.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13ZM4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm11.53-1.47-1.06-1.06L11 12.94l-1.47-1.47-1.06 1.06L11 15.06l4.53-4.53Z"
			></path>
		</svg>
	);
}
