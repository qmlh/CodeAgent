import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Card, Typography, Space, Collapse, Alert } from 'antd';
import { BugOutlined, ReloadOutlined, SendOutlined, CopyOutlined } from '@ant-design/icons';
import './ErrorBoundary.css';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorReport {
  errorId: string;
  timestamp: Date;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  componentStack: string;
  userAgent: string;
  url: string;
  userId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In production, you would send this to your error reporting service
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport: ErrorReport = {
      errorId: this.state.errorId,
      timestamp: new Date(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      componentStack: errorInfo.componentStack || '',
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: 'anonymous' // In real app, get from auth context
    };

    // Store locally for now (in production, send to error reporting service)
    const existingReports = JSON.parse(localStorage.getItem('errorReports') || '[]');
    existingReports.push(errorReport);
    localStorage.setItem('errorReports', JSON.stringify(existingReports));
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  handleCopyError = () => {
    const errorText = `
Error ID: ${this.state.errorId}
Error: ${this.state.error?.name}: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
    `.trim();

    navigator.clipboard.writeText(errorText || '').then(() => {
      console.log('Error details copied to clipboard');
    });
  };

  handleSendReport = () => {
    // In a real application, this would send the error report to your backend
    console.log('Sending error report...', {
      errorId: this.state.errorId,
      error: this.state.error,
      errorInfo: this.state.errorInfo
    });
    
    // Show success message
    alert('Error report sent successfully. Thank you for helping us improve the application!');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <Card className="error-card">
            <Result
              status="error"
              icon={<BugOutlined />}
              title="Something went wrong"
              subTitle={`Error ID: ${this.state.errorId}`}
              extra={
                <Space>
                  <Button type="primary" icon={<ReloadOutlined />} onClick={this.handleReload}>
                    Reload Application
                  </Button>
                  <Button onClick={this.handleReset}>
                    Try Again
                  </Button>
                  <Button icon={<SendOutlined />} onClick={this.handleSendReport}>
                    Send Report
                  </Button>
                </Space>
              }
            />

            <Alert
              message="Application Error"
              description="The application encountered an unexpected error. You can try reloading the page or send us an error report to help fix this issue."
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Collapse ghost>
              <Panel header="Error Details" key="1">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Error Message:</Text>
                    <Paragraph code copyable>
                      {this.state.error?.message}
                    </Paragraph>
                  </div>

                  {this.state.error?.stack && (
                    <div>
                      <Text strong>Stack Trace:</Text>
                      <Paragraph code copyable style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.error.stack}
                      </Paragraph>
                    </div>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <Text strong>Component Stack:</Text>
                      <Paragraph code copyable style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.errorInfo.componentStack}
                      </Paragraph>
                    </div>
                  )}

                  <div>
                    <Text strong>Timestamp:</Text>
                    <Text> {new Date().toISOString()}</Text>
                  </div>

                  <div>
                    <Text strong>User Agent:</Text>
                    <Paragraph code copyable>
                      {navigator.userAgent}
                    </Paragraph>
                  </div>

                  <Button 
                    icon={<CopyOutlined />} 
                    onClick={this.handleCopyError}
                    style={{ marginTop: 16 }}
                  >
                    Copy All Error Details
                  </Button>
                </Space>
              </Panel>
            </Collapse>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}