/**
 * Conflict Resolution Wizard
 * Step-by-step guide for resolving complex conflicts
 */

import React from 'react';
import { Modal, Steps, Button, Space, Typography, Alert, Progress } from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  ArrowLeftOutlined, 
  ArrowRightOutlined,
  BulbOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { 
  hideResolutionWizard, 
  setWizardStep, 
  completeWizardStep 
} from '../../store/slices/conflictSlice';
import { ConflictResolutionWizardStep } from '../../types/conflict';
import './ConflictResolutionWizard.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

// Wizard step components
const ConflictAnalysisStep: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => (
  <div className="wizard-step-content">
    <Title level={4}>Conflict Analysis</Title>
    <Paragraph>
      Let's analyze the conflict to understand what happened and determine the best resolution strategy.
    </Paragraph>
    
    <Alert
      message="Conflict Details"
      description="This conflict involves multiple agents modifying the same file simultaneously. Review the changes carefully before proceeding."
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
    />
    
    <div className="analysis-checklist">
      <h5>Analysis Checklist:</h5>
      <ul>
        <li>‚ú?Identified conflicting changes</li>
        <li>‚ú?Determined involved agents</li>
        <li>‚ú?Assessed impact scope</li>
        <li>‚è?Reviewing resolution options</li>
      </ul>
    </div>
    
    <Button type="primary" onClick={() => onComplete({ analysisComplete: true })}>
      Continue Analysis
    </Button>
  </div>
);

const ResolutionStrategyStep: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const [selectedStrategy, setSelectedStrategy] = React.useState<string>('');
  
  const strategies = [
    {
      id: 'auto_merge',
      title: 'Automatic Merge',
      description: 'Let the system automatically merge non-conflicting changes',
      confidence: 85,
      pros: ['Fast resolution', 'Preserves most changes'],
      cons: ['May miss subtle conflicts']
    },
    {
      id: 'manual_review',
      title: 'Manual Review',
      description: 'Manually review and merge each conflicting section',
      confidence: 95,
      pros: ['Full control', 'Highest accuracy'],
      cons: ['Time consuming', 'Requires expertise']
    },
    {
      id: 'accept_latest',
      title: 'Accept Latest Changes',
      description: 'Accept the most recent changes and discard others',
      confidence: 70,
      pros: ['Simple', 'Quick resolution'],
      cons: ['May lose important changes']
    }
  ];
  
  return (
    <div className="wizard-step-content">
      <Title level={4}>Choose Resolution Strategy</Title>
      <Paragraph>
        Select the best strategy for resolving this conflict based on your project needs.
      </Paragraph>
      
      <div className="strategy-options">
        {strategies.map(strategy => (
          <div 
            key={strategy.id}
            className={`strategy-option ${selectedStrategy === strategy.id ? 'selected' : ''}`}
            onClick={() => setSelectedStrategy(strategy.id)}
          >
            <div className="strategy-header">
              <Title level={5}>{strategy.title}</Title>
              <div className="confidence-badge">
                <Progress 
                  type="circle" 
                  size={40} 
                  percent={strategy.confidence}
                  format={percent => `${percent}%`}
                />
              </div>
            </div>
            
            <Paragraph>{strategy.description}</Paragraph>
            
            <div className="strategy-pros-cons">
              <div className="pros">
                <Text strong style={{ color: '#52c41a' }}>Pros:</Text>
                <ul>
                  {strategy.pros.map((pro, index) => (
                    <li key={index}>{pro}</li>
                  ))}
                </ul>
              </div>
              <div className="cons">
                <Text strong style={{ color: '#ff4d4f' }}>Cons:</Text>
                <ul>
                  {strategy.cons.map((con, index) => (
                    <li key={index}>{con}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <Button 
        type="primary" 
        disabled={!selectedStrategy}
        onClick={() => onComplete({ selectedStrategy })}
      >
        Apply Strategy
      </Button>
    </div>
  );
};

const ValidationStep: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => (
  <div className="wizard-step-content">
    <Title level={4}>Validate Resolution</Title>
    <Paragraph>
      Review the merged result and ensure it meets your requirements.
    </Paragraph>
    
    <Alert
      message="Validation Checklist"
      description={
        <div className="validation-checklist">
          <p>Please verify the following:</p>
          <ul>
            <li>‚ú?All important changes are preserved</li>
            <li>‚ú?No syntax errors introduced</li>
            <li>‚ú?Code style is consistent</li>
            <li>‚ú?Functionality is not broken</li>
          </ul>
        </div>
      }
      type="success"
      showIcon
    />
    
    <Space style={{ marginTop: 16 }}>
      <Button type="primary" onClick={() => onComplete({ validated: true })}>
        Validation Complete
      </Button>
      <Button onClick={() => onComplete({ needsRevision: true })}>
        Needs Revision
      </Button>
    </Space>
  </div>
);

const CompletionStep: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => (
  <div className="wizard-step-content">
    <Title level={4}>Resolution Complete</Title>
    <Paragraph>
      Congratulations! The conflict has been successfully resolved.
    </Paragraph>
    
    <Alert
      message="Success"
      description="The conflict resolution has been completed and the changes have been applied."
      type="success"
      showIcon
      style={{ marginBottom: 16 }}
    />
    
    <div className="completion-summary">
      <h5>Summary:</h5>
      <ul>
        <li>Conflict type: Concurrent modification</li>
        <li>Resolution strategy: Manual review</li>
        <li>Time taken: 5 minutes 23 seconds</li>
        <li>Changes preserved: All important changes</li>
      </ul>
    </div>
    
    <Button type="primary" onClick={() => onComplete({ completed: true })}>
      Finish
    </Button>
  </div>
);

export const ConflictResolutionWizard: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    wizardVisible, 
    wizardCurrentStep, 
    wizardSteps, 
    currentConflictId 
  } = useSelector((state: RootState) => state.conflict);

  const defaultSteps: ConflictResolutionWizardStep[] = [
    {
      id: 'analysis',
      title: 'Analyze Conflict',
      description: 'Understand the nature and scope of the conflict',
      component: ConflictAnalysisStep,
      isCompleted: false,
      isOptional: false
    },
    {
      id: 'strategy',
      title: 'Choose Strategy',
      description: 'Select the best resolution approach',
      component: ResolutionStrategyStep,
      isCompleted: false,
      isOptional: false
    },
    {
      id: 'validation',
      title: 'Validate Result',
      description: 'Review and validate the merged result',
      component: ValidationStep,
      isCompleted: false,
      isOptional: false
    },
    {
      id: 'completion',
      title: 'Complete',
      description: 'Finalize the resolution',
      component: CompletionStep,
      isCompleted: false,
      isOptional: false
    }
  ];

  const steps = wizardSteps.length > 0 ? wizardSteps : defaultSteps;
  const currentStep = steps[wizardCurrentStep];

  const handleNext = () => {
    if (wizardCurrentStep < steps.length - 1) {
      dispatch(setWizardStep(wizardCurrentStep + 1));
    }
  };

  const handlePrevious = () => {
    if (wizardCurrentStep > 0) {
      dispatch(setWizardStep(wizardCurrentStep - 1));
    }
  };

  const handleStepComplete = (data: any) => {
    dispatch(completeWizardStep({ stepIndex: wizardCurrentStep, data }));
    
    if (wizardCurrentStep === steps.length - 1) {
      // Last step completed, close wizard
      dispatch(hideResolutionWizard());
    } else {
      handleNext();
    }
  };

  const handleClose = () => {
    Modal.confirm({
      title: 'Close Wizard',
      content: 'Are you sure you want to close the resolution wizard? Your progress will be lost.',
      onOk: () => {
        dispatch(hideResolutionWizard());
      }
    });
  };

  const StepComponent = currentStep?.component || (() => <div>Step not found</div>);

  return (
    <Modal
      title="Conflict Resolution Wizard"
      open={wizardVisible}
      onCancel={handleClose}
      width={800}
      className="conflict-resolution-wizard"
      footer={
        <div className="wizard-footer">
          <div className="footer-left">
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={handlePrevious}
              disabled={wizardCurrentStep === 0}
            >
              Previous
            </Button>
          </div>
          
          <div className="footer-center">
            <Text type="secondary">
              Step {wizardCurrentStep + 1} of {steps.length}
            </Text>
          </div>
          
          <div className="footer-right">
            <Space>
              <Button onClick={handleClose}>
                Cancel
              </Button>
              {wizardCurrentStep < steps.length - 1 && (
                <Button 
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={handleNext}
                  disabled={!currentStep?.isCompleted}
                >
                  Next
                </Button>
              )}
            </Space>
          </div>
        </div>
      }
    >
      <div className="wizard-content">
        <div className="wizard-steps">
          <Steps current={wizardCurrentStep} >
            {steps.map((step: any, index: number) => (
              <Step
                key={step.id}
                title={step.title}
                description={step.description}
                status={
                  step.isCompleted ? 'finish' : 
                  index === wizardCurrentStep ? 'process' : 
                  'wait'
                }
                icon={step.isCompleted ? <CheckOutlined /> : undefined}
              />
            ))}
          </Steps>
        </div>
        
        <div className="wizard-step-container">
          <StepComponent onComplete={handleStepComplete} />
        </div>
      </div>
    </Modal>
  );
};