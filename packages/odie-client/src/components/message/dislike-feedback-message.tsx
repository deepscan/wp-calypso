import { __ } from '@wordpress/i18n';
import Markdown from 'react-markdown';
import { WapuuAvatar } from '../../assets/wapuu-avatar';
import WapuuAvatarSquared from '../../assets/wapuu-squared-avatar.svg';
import { useOdieAssistantContext } from '../../context';
import { GetSupport } from './get-support';

export const DislikeFeedbackMessage = () => {
	const { shouldUseHelpCenterExperience, extraContactOptions, botName } = useOdieAssistantContext();

	const renderRedesignedComponent = () => {
		return (
			<>
				<div className="message-header bot">
					<WapuuAvatar />
					<strong className="message-header-name"></strong>
				</div>
				<div className="odie-chatbox-dislike-feedback-message">
					<Markdown>
						{ __(
							'Let’s get the information you need. Would you like to contact our support team?',
							__i18n_text_domain__
						) }
					</Markdown>
				</div>
				<GetSupport />
			</>
		);
	};

	// This can be removed after removing the feature flag
	const renderCurrentComponentDesign = () => {
		return (
			<>
				<div className="message-header bot">
					<img
						src={ WapuuAvatarSquared }
						alt={ __( 'AI profile picture', __i18n_text_domain__ ) }
						className="odie-chatbox-message-avatar"
					/>
					<strong className="message-header-name">{ botName }</strong>
				</div>
				<div className="odie-chatbox-dislike-feedback-message">
					<Markdown>
						{ __(
							'I’m sorry my last response didn’t meet your expectations! Here’s some other ways to get more in-depth help:',
							__i18n_text_domain__
						) }
					</Markdown>
					{ extraContactOptions }
				</div>
			</>
		);
	};

	return shouldUseHelpCenterExperience
		? renderRedesignedComponent()
		: renderCurrentComponentDesign();
};

export default DislikeFeedbackMessage;
