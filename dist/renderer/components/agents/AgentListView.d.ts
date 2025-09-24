/**
 * Enhanced Agent List View Component
 * Displays all agents with status, type, performance metrics, and control actions
 */
import React from 'react';
interface AgentListViewProps {
    onCreateAgent: () => void;
    onViewDetails: (agentId: string) => void;
}
export declare const AgentListView: React.FC<AgentListViewProps>;
export {};
