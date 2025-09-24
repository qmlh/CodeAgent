/**
 * Agent Creation Wizard Component
 * Multi-step wizard for creating new agents with type selection, configuration, and capability customization
 */
import React from 'react';
interface AgentCreationWizardProps {
    visible: boolean;
    onClose: () => void;
}
export declare const AgentCreationWizard: React.FC<AgentCreationWizardProps>;
export {};
