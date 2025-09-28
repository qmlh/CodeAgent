import React, { useState, useRef } from 'react';
import { Modal, Form, Input, Select, Rate, Button, Upload, Space, Typography, Alert, Progress, message } from 'antd';
import { MessageOutlined, CameraOutlined, FileTextOutlined, SendOutlined, PaperClipOutlined } from '@ant-design/icons';
import html2canvas from 'html2canvas';
import './FeedbackSystem.css';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface FeedbackFormData {
  type: 'bug' | 'feature' | 'improvement' | 'question';
  title: string;
  description: string;
  rating?: number;
  category: string;
  priority: 'low' | 'medium' | 'high';
  email?: string;
  attachments: File[];
  screenshot?: string;
  systemInfo: boolean;
  logs: boolean;
}

interface FeedbackSystemProps {
  visible: boolean;
  onClose: () => void;
}

export const FeedbackSystem: React.FC<FeedbackSystemProps> = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const feedbackTypes = [
    { value: 'bug', label: 'Bug Report', icon: '🐛' },
    { value: 'feature', label: 'Feature Request', icon: '💡' },
    { value: 'improvement', label: 'Improvement Suggestion', icon: '🔧' },
    { value: 'question', label: 'Question/Help', icon: '❓' }
  ];

  const categories = [
    'User Interface',
    'Performance',
    'Agent Management',
    'File Operations',
    'Task Management',
    'Settings',
    'Integration',
    'Other'
  ];

  const captureScreenshot = async () => {
    setIsCapturing(true);
    try {
      // Hide the modal temporarily
      const modal = document.querySelector('.ant-modal') as HTMLElement;
      if (modal) modal.style.display = 'none';

      // Wait a bit for the modal to hide
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture screenshot
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5 // Reduce size for better performance
      });

      const screenshotData = canvas.toDataURL('image/png');
      setScreenshot(screenshotData);

      // Show the modal again
      if (modal) modal.style.display = 'block';

      message.success('Screenshot captured successfully!');
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      message.error('Failed to capture screenshot');
    } finally {
      setIsCapturing(false);
    }
  };

  const collectSystemInfo = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      memory: (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
      } : null
    };
  };

  const collectLogs = () => {
    // In a real application, this would collect actual logs
    const mockLogs = [
      `[${new Date().toISOString()}] INFO: Application started`,
      `[${new Date().toISOString()}] DEBUG: User opened feedback dialog`,
      `[${new Date().toISOString()}] INFO: Current route: /main`,
      `[${new Date().toISOString()}] DEBUG: Memory usage: 156MB`
    ];
    return mockLogs.join('\n');
  };

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    setSubmitProgress(0);

    try {
      // Simulate submission process
      const steps = [
        'Preparing feedback data...',
        'Collecting system information...',
        'Gathering logs...',
        'Uploading attachments...',
        'Submitting feedback...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setSubmitProgress(((i + 1) / steps.length) * 100);
      }

      // Prepare feedback data
      const feedbackData: FeedbackFormData = {
        ...values,
        screenshot: screenshot || undefined,
        attachments: values.attachments?.fileList?.map((file: any) => file.originFileObj) || [],
        systemInfo: values.includeSystemInfo,
        logs: values.includeLogs
      };

      // Add system info and logs if requested
      const additionalData: any = {};
      if (values.includeSystemInfo) {
        additionalData.systemInfo = collectSystemInfo();
      }
      if (values.includeLogs) {
        additionalData.logs = collectLogs();
      }

      // In a real application, send to backend
      console.log('Feedback submitted:', { ...feedbackData, ...additionalData });

      message.success('Feedback submitted successfully! Thank you for helping us improve.');
      form.resetFields();
      setScreenshot(null);
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      message.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSubmitProgress(0);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      form.resetFields();
      setScreenshot(null);
      onClose();
    }
  };

  return (
    <Modal
      title={
        <Space>
          <MessageOutlined />
          <Title level={4} style={{ margin: 0 }}>Send Feedback</Title>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      closable={!isSubmitting}
      maskClosable={!isSubmitting}
    >
      <div className="feedback-system">
        {isSubmitting && (
          <Alert
            message="Submitting Feedback"
            description={<Progress percent={submitProgress} status="active" />}
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={isSubmitting}
        >
          <Form.Item
            name="type"
            label="Feedback Type"
            rules={[{ required: true, message: 'Please select feedback type' }]}
          >
            <Select placeholder="Select feedback type">
              {feedbackTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  <Space>
                    <span>{type.icon}</span>
                    {type.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Brief description of your feedback" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please provide details' }]}
          >
            <TextArea
              rows={4}
              placeholder="Please provide detailed information about your feedback..."
            />
          </Form.Item>

          <Form.Item name="rating" label="Overall Experience Rating">
            <Rate allowHalf />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select category">
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            initialValue="medium"
          >
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
          </Form.Item>

          <Form.Item name="email" label="Email (optional)">
            <Input placeholder="Your email for follow-up (optional)" />
          </Form.Item>

          {/* Screenshot Section */}
          <div className="screenshot-section">
            <Text strong>Screenshot</Text>
            <div style={{ marginTop: 8 }}>
              <Space>
                <Button
                  icon={<CameraOutlined />}
                  onClick={captureScreenshot}
                  loading={isCapturing}
                >
                  {isCapturing ? 'Capturing...' : 'Capture Screenshot'}
                </Button>
                {screenshot && (
                  <Button
                    type="link"
                    onClick={() => setScreenshot(null)}
                  >
                    Remove
                  </Button>
                )}
              </Space>
              {screenshot && (
                <div className="screenshot-preview">
                  <img src={screenshot} alt="Screenshot" style={{ maxWidth: '100%', maxHeight: 200 }} />
                </div>
              )}
            </div>
          </div>

          {/* File Attachments */}
          <Form.Item name="attachments" label="Attachments">
            <Upload.Dragger
              multiple
              beforeUpload={() => false} // Prevent auto upload
              accept=".png,.jpg,.jpeg,.gif,.pdf,.txt,.log"
            >
              <p className="ant-upload-drag-icon">
                <PaperClipOutlined />
              </p>
              <p className="ant-upload-text">Click or drag files to attach</p>
              <p className="ant-upload-hint">
                Support for images, PDFs, text files, and logs
              </p>
            </Upload.Dragger>
          </Form.Item>

          {/* Additional Data Collection */}
          <div className="additional-data">
            <Text strong>Additional Information</Text>
            <div style={{ marginTop: 8 }}>
              <Form.Item name="includeSystemInfo" valuePropName="checked">
                <label>
                  <input type="checkbox" style={{ marginRight: 8 }} />
                  Include system information (browser, OS, memory usage)
                </label>
              </Form.Item>
              <Form.Item name="includeLogs" valuePropName="checked">
                <label>
                  <input type="checkbox" style={{ marginRight: 8 }} />
                  Include application logs (helps with debugging)
                </label>
              </Form.Item>
            </div>
          </div>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Send Feedback'}
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Alert
          message="Privacy Notice"
          description="Your feedback helps us improve the application. We only collect the information you choose to share and use it solely for product improvement purposes."
          type="info"
          style={{ marginTop: 16 }}
        />
      </div>
    </Modal>
  );
};