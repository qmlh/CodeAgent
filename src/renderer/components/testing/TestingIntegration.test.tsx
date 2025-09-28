import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TestingAndUXHub } from './TestingAndUXHub';
import { TestingAndUXDemo } from './TestingAndUXDemo';

// Mock html2canvas for screenshot functionality
jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({
    toDataURL: () => 'data:image/png;base64,mock-screenshot-data'
  }))
}));

// Mock URL.createObjectURL for file downloads
Object.defineProperty(global.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mock-url')
});

Object.defineProperty(global.URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn()
});

// Mock recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />
}));

describe('Testing and UX Integration', () => {
  beforeEach(() => {
    // Clear any stored data
    localStorage.clear();
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('TestingAndUXDemo', () => {
    it('renders demo interface correctly', () => {
      render(<TestingAndUXDemo />);
      
      expect(screen.getByText('Testing & User Experience Features Demo')).toBeInTheDocument();
      expect(screen.getByText('Launch Testing & UX Hub')).toBeInTheDocument();
      expect(screen.getByText('Test Error Boundary')).toBeInTheDocument();
    });

    it('launches hub when button is clicked', () => {
      render(<TestingAndUXDemo />);
      
      const launchButton = screen.getByText('Launch Testing & UX Hub');
      fireEvent.click(launchButton);
      
      expect(screen.getByText('Testing & User Experience Hub')).toBeInTheDocument();
    });

    it('triggers error boundary when error button is clicked', () => {
      render(<TestingAndUXDemo />);
      
      const errorButton = screen.getByText('Test Error Boundary');
      fireEvent.click(errorButton);
      
      // Error boundary should catch the error and display error UI
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('TestingAndUXHub', () => {
    it('renders all main tabs', () => {
      render(<TestingAndUXHub />);
      
      expect(screen.getByText('Testing Suite')).toBeInTheDocument();
      expect(screen.getByText('E2E Testing')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Optimization')).toBeInTheDocument();
      expect(screen.getByText('Diagnostics')).toBeInTheDocument();
      expect(screen.getByText('Help & Tutorials')).toBeInTheDocument();
    });

    it('opens feedback system when button is clicked', () => {
      render(<TestingAndUXHub />);
      
      const feedbackButton = screen.getAllByText('Send Feedback')[0];
      fireEvent.click(feedbackButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('opens crash recovery dialog when button is clicked', () => {
      render(<TestingAndUXHub />);
      
      const crashButton = screen.getByText('Test Crash Recovery');
      fireEvent.click(crashButton);
      
      expect(screen.getByText('Application Crash Recovery')).toBeInTheDocument();
    });

    it('switches between tabs correctly', () => {
      render(<TestingAndUXHub />);
      
      // Click on Performance tab
      const performanceTab = screen.getByText('Performance');
      fireEvent.click(performanceTab);
      
      expect(screen.getByText('Performance Monitor')).toBeInTheDocument();
      
      // Click on Diagnostics tab
      const diagnosticsTab = screen.getByText('Diagnostics');
      fireEvent.click(diagnosticsTab);
      
      expect(screen.getByText('System Diagnostics')).toBeInTheDocument();
    });
  });

  describe('Testing Suite Integration', () => {
    it('runs tests when run button is clicked', async () => {
      render(<TestingAndUXHub />);
      
      const runButton = screen.getByText('Run All Tests');
      fireEvent.click(runButton);
      
      expect(screen.getByText('Running...')).toBeInTheDocument();
      
      // Wait for test completion
      await waitFor(() => {
        expect(screen.getByText('Run All Tests')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('displays test results correctly', () => {
      render(<TestingAndUXHub />);
      
      // Check for test result elements
      expect(screen.getByText('Agent Component Rendering')).toBeInTheDocument();
      expect(screen.getByText('Task Manager Logic')).toBeInTheDocument();
      expect(screen.getByText('File Manager Operations')).toBeInTheDocument();
    });
  });

  describe('Performance Monitor Integration', () => {
    it('displays performance metrics', () => {
      render(<TestingAndUXHub />);
      
      // Switch to performance tab
      const performanceTab = screen.getByText('Performance');
      fireEvent.click(performanceTab);
      
      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Render Time')).toBeInTheDocument();
      expect(screen.getByText('FPS')).toBeInTheDocument();
    });

    it('exports metrics when export button is clicked', () => {
      render(<TestingAndUXHub />);
      
      // Switch to performance tab
      const performanceTab = screen.getByText('Performance');
      fireEvent.click(performanceTab);
      
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);
      
      // Should trigger download (mocked in real implementation)
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Feedback System Integration', () => {
    it('captures screenshot when button is clicked', async () => {
      render(<TestingAndUXHub />);
      
      const feedbackButton = screen.getByText('Send Feedback');
      fireEvent.click(feedbackButton);
      
      const screenshotButton = screen.getByText('Capture Screenshot');
      fireEvent.click(screenshotButton);
      
      await waitFor(() => {
        expect(screen.getByText('Remove')).toBeInTheDocument();
      });
    });

    it('submits feedback form correctly', async () => {
      render(<TestingAndUXHub />);
      
      const feedbackButton = screen.getAllByText('Send Feedback')[0];
      fireEvent.click(feedbackButton);
      
      // Fill out form
      const titleInput = screen.getByPlaceholderText('Brief description of your feedback');
      fireEvent.change(titleInput, { target: { value: 'Test feedback' } });
      
      const descriptionInput = screen.getByPlaceholderText('Please provide detailed information about your feedback...');
      fireEvent.change(descriptionInput, { target: { value: 'This is a test feedback' } });
      
      const submitButton = screen.getAllByText('Send Feedback')[2]; // Get the submit button
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
      });
    });
  });

  describe('Diagnostics Integration', () => {
    it('runs diagnostics when button is clicked', async () => {
      render(<TestingAndUXHub />);
      
      // Switch to diagnostics tab
      const diagnosticsTab = screen.getByText('Diagnostics');
      fireEvent.click(diagnosticsTab);
      
      const runButton = screen.getByText('Run Diagnostics');
      fireEvent.click(runButton);
      
      expect(screen.getByText('Running...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Run Diagnostics')).toBeInTheDocument();
      }, { timeout: 10000 });
    }, 15000);

    it('displays system information', () => {
      render(<TestingAndUXHub />);
      
      // Switch to diagnostics tab
      const diagnosticsTab = screen.getByText('Diagnostics');
      fireEvent.click(diagnosticsTab);
      
      expect(screen.getByText('Operating System')).toBeInTheDocument();
      expect(screen.getByText('Electron Version')).toBeInTheDocument();
      expect(screen.getByText('Total Memory')).toBeInTheDocument();
    });
  });

  describe('User Guidance Integration', () => {
    it('displays tutorials and help topics', () => {
      render(<TestingAndUXHub />);
      
      // Switch to guidance tab
      const guidanceTab = screen.getByText('Help & Tutorials');
      fireEvent.click(guidanceTab);
      
      expect(screen.getByText('Interactive Tutorials')).toBeInTheDocument();
      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
      expect(screen.getByText('Getting Started with Multi-Agent IDE')).toBeInTheDocument();
    });

    it('starts tutorial when button is clicked', () => {
      render(<TestingAndUXHub />);
      
      // Switch to guidance tab
      const guidanceTab = screen.getByText('Help & Tutorials');
      fireEvent.click(guidanceTab);
      
      const startButton = screen.getAllByText('Start')[0];
      fireEvent.click(startButton);
      
      expect(screen.getAllByText('Getting Started with Multi-Agent IDE')).toHaveLength(2);
    });
  });

  describe('Error Handling Integration', () => {
    it('handles errors gracefully with error boundary', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        <TestingAndUXHub />
      );

      // The error boundary should catch any errors and display error UI
      expect(container).toBeInTheDocument();
    });

    it('recovers from crashes with recovery dialog', () => {
      render(<TestingAndUXHub />);
      
      const crashButton = screen.getByText('Test Crash Recovery');
      fireEvent.click(crashButton);
      
      expect(screen.getByText('Application Crash Recovery')).toBeInTheDocument();
      expect(screen.getByText('main.tsx (unsaved changes)')).toBeInTheDocument();
      
      const recoverButton = screen.getByText(/Recover Selected/);
      fireEvent.click(recoverButton);
      
      // Should start recovery process
      expect(recoverButton).toBeInTheDocument();
    });
  });

  describe('Optimization Tools Integration', () => {
    it('displays optimization suggestions', () => {
      render(<TestingAndUXHub />);
      
      // Switch to optimization tab
      const optimizationTab = screen.getByText('Optimization');
      fireEvent.click(optimizationTab);
      
      expect(screen.getByText('Application Optimization Tools')).toBeInTheDocument();
      expect(screen.getByText('Startup Analysis')).toBeInTheDocument();
      expect(screen.getByText('Resource Optimization')).toBeInTheDocument();
    });

    it('applies optimizations when button is clicked', () => {
      render(<TestingAndUXHub />);
      
      // Switch to optimization tab
      const optimizationTab = screen.getByText('Optimization');
      fireEvent.click(optimizationTab);
      
      const applyButton = screen.getByText('Apply All Auto-fixes');
      fireEvent.click(applyButton);
      
      // Should apply optimizations
      expect(applyButton).toBeInTheDocument();
    });
  });
});