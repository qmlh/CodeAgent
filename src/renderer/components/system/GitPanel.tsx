/**
 * Git Version Control Panel
 * Git integration with file status, commit history, and branch management
 */

import React, { useState, useEffect } from 'react';
import {
  Tree,
  Button,
  Input,
  Select,
  Space,
  Badge,
  Tooltip,
  Modal,
  Form,
  List,
  Typography,
  Divider,
  Tag,
  Dropdown
} from 'antd';
import {
  BranchesOutlined,
  PlusOutlined,
  SyncOutlined,
  HistoryOutlined,
  FileAddOutlined,
  FileExclamationOutlined,
  DeleteOutlined,
  EditOutlined,
  MergeOutlined,
  PullRequestOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { 
  setGitStatus, 
  setGitBranches, 
  setGitCommits 
} from '../../store/slices/systemSlice';
import { GitStatus, GitFileStatus, GitCommit, GitBranch } from '../../types/system';
import './GitPanel.css';

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;

interface GitFileTreeProps {
  files: GitFileStatus[];
  onStageFile: (file: string) => void;
  onUnstageFile: (file: string) => void;
  onDiscardChanges: (file: string) => void;
}

const GitFileTree: React.FC<GitFileTreeProps> = ({
  files,
  onStageFile,
  onUnstageFile,
  onDiscardChanges
}) => {
  const getFileIcon = (status: string) => {
    switch (status) {
      case 'added': return <FileAddOutlined style={{ color: '#73c991' }} />;
      case 'modified': return <EditOutlined style={{ color: '#e2c08d' }} />;
      case 'deleted': return <DeleteOutlined style={{ color: '#f48771' }} />;
      default: return <FileExclamationOutlined style={{ color: '#cccccc' }} />;
    }
  };

  const getStatusTag = (status: string) => {
    const colors = {
      added: 'success',
      modified: 'warning',
      deleted: 'error',
      renamed: 'processing',
      copied: 'default',
      unmerged: 'error'
    };
    return <Tag color={colors[status as keyof typeof colors] || 'default'}>{status.toUpperCase()}</Tag>;
  };

  return (
    <div className="git-file-tree">
      {files.map((file) => (
        <div key={file.path} className="git-file-item">
          <div className="git-file-info">
            {getFileIcon(file.status)}
            <span className="git-file-path">{file.path}</span>
            {getStatusTag(file.status)}
          </div>
          <div className="git-file-actions">
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'stage',
                    label: file.staged ? 'Unstage' : 'Stage',
                    onClick: () => file.staged ? onUnstageFile(file.path) : onStageFile(file.path)
                  },
                  {
                    key: 'discard',
                    label: 'Discard Changes',
                    onClick: () => onDiscardChanges(file.path),
                    disabled: file.staged
                  }
                ]
              }}
              trigger={['click']}
            >
              <Button type="text" icon={<SettingOutlined />}>
                ⋯
              </Button>
            </Dropdown>
          </div>
        </div>
      ))}
    </div>
  );
};

export const GitPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { gitStatus, gitBranches, gitCommits } = useAppSelector(state => state.system);
  const [commitMessage, setCommitMessage] = useState('');
  const [showCommitHistory, setShowCommitHistory] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('main');

  // Mock data initialization
  useEffect(() => {
    const mockGitStatus: GitStatus = {
      branch: 'main',
      ahead: 2,
      behind: 0,
      staged: [
        { path: 'src/components/NewComponent.tsx', status: 'added', staged: true },
        { path: 'src/utils/helpers.ts', status: 'modified', staged: true }
      ],
      unstaged: [
        { path: 'README.md', status: 'modified', staged: false },
        { path: 'package.json', status: 'modified', staged: false }
      ],
      untracked: ['temp.txt', 'debug.log'],
      conflicted: []
    };

    const mockBranches = ['main', 'develop', 'feature/new-ui', 'hotfix/bug-123'];
    
    const mockCommits: GitCommit[] = [
      {
        hash: 'abc123',
        author: 'John Doe',
        email: 'john@example.com',
        date: new Date(Date.now() - 3600000),
        message: 'Add new terminal component',
        parents: ['def456'],
        refs: ['HEAD', 'origin/main']
      },
      {
        hash: 'def456',
        author: 'Jane Smith',
        email: 'jane@example.com',
        date: new Date(Date.now() - 7200000),
        message: 'Fix git integration issues',
        parents: ['ghi789'],
        refs: []
      }
    ];

    dispatch(setGitStatus(mockGitStatus));
    dispatch(setGitBranches(mockBranches));
    dispatch(setGitCommits(mockCommits));
  }, [dispatch]);

  const handleStageFile = (file: string) => {
    if (!gitStatus) return;
    
    const unstagedFile = gitStatus.unstaged.find(f => f.path === file);
    if (unstagedFile) {
      const newStaged = [...gitStatus.staged, { ...unstagedFile, staged: true }];
      const newUnstaged = gitStatus.unstaged.filter(f => f.path !== file);
      
      dispatch(setGitStatus({
        ...gitStatus,
        staged: newStaged,
        unstaged: newUnstaged
      }));
    }
  };

  const handleUnstageFile = (file: string) => {
    if (!gitStatus) return;
    
    const stagedFile = gitStatus.staged.find(f => f.path === file);
    if (stagedFile) {
      const newUnstaged = [...gitStatus.unstaged, { ...stagedFile, staged: false }];
      const newStaged = gitStatus.staged.filter(f => f.path !== file);
      
      dispatch(setGitStatus({
        ...gitStatus,
        staged: newStaged,
        unstaged: newUnstaged
      }));
    }
  };

  const handleDiscardChanges = (file: string) => {
    if (!gitStatus) return;
    
    Modal.confirm({
      title: 'Discard Changes',
      content: `Are you sure you want to discard changes to ${file}? This action cannot be undone.`,
      okText: 'Discard',
      okType: 'danger',
      onOk: () => {
        const newUnstaged = gitStatus.unstaged.filter(f => f.path !== file);
        dispatch(setGitStatus({
          ...gitStatus,
          unstaged: newUnstaged
        }));
      }
    });
  };

  const handleCommit = () => {
    if (!commitMessage.trim() || !gitStatus?.staged.length) return;
    
    // In real implementation, this would call git commit
    console.log('Committing with message:', commitMessage);
    setCommitMessage('');
    
    // Clear staged files
    dispatch(setGitStatus({
      ...gitStatus,
      staged: []
    }));
  };

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    
    const newBranches = [...gitBranches, newBranchName];
    dispatch(setGitBranches(newBranches));
    setNewBranchName('');
    setShowBranchModal(false);
  };

  const handleSwitchBranch = (branch: string) => {
    setSelectedBranch(branch);
    if (gitStatus) {
      dispatch(setGitStatus({
        ...gitStatus,
        branch
      }));
    }
  };

  if (!gitStatus) {
    return (
      <div className="git-panel-loading">
        <Text type="secondary">Loading Git status...</Text>
      </div>
    );
  }

  return (
    <div className="git-panel">
      {/* Branch selector */}
      <div className="git-branch-section">
        <div className="git-section-header">
          <BranchesOutlined />
          <span>Branch</span>
          <Space>
            <Tooltip title="Create Branch">
              <Button 
                type="text" 
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setShowBranchModal(true)}
              />
            </Tooltip>
            <Tooltip title="Sync">
              <Button type="text" size="small" icon={<SyncOutlined />} />
            </Tooltip>
          </Space>
        </div>
        <Select
          value={gitStatus.branch}
          onChange={handleSwitchBranch}
          style={{ width: '100%' }}
          dropdownMatchSelectWidth={false}
        >
          {gitBranches.map(branch => (
            <Option key={branch} value={branch}>
              <Space>
                <BranchesOutlined />
                {branch}
                {branch === gitStatus.branch && <Tag>current</Tag>}
              </Space>
            </Option>
          ))}
        </Select>
        {(gitStatus.ahead > 0 || gitStatus.behind > 0) && (
          <div className="git-sync-status">
            {gitStatus.ahead > 0 && <Tag color="green">↑{gitStatus.ahead}</Tag>}
            {gitStatus.behind > 0 && <Tag color="orange">↓{gitStatus.behind}</Tag>}
          </div>
        )}
      </div>

      <Divider />

      {/* Staged changes */}
      <div className="git-changes-section">
        <div className="git-section-header">
          <span>Staged Changes</span>
          <Badge count={gitStatus.staged.length} size="small" />
        </div>
        {gitStatus.staged.length > 0 ? (
          <GitFileTree
            files={gitStatus.staged}
            onStageFile={handleStageFile}
            onUnstageFile={handleUnstageFile}
            onDiscardChanges={handleDiscardChanges}
          />
        ) : (
          <Text type="secondary" className="git-empty-state">No staged changes</Text>
        )}
      </div>

      {/* Commit section */}
      {gitStatus.staged.length > 0 && (
        <div className="git-commit-section">
          <TextArea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            rows={3}
            style={{ marginBottom: 8 }}
          />
          <Button
            type="primary"
            block
            onClick={handleCommit}
            disabled={!commitMessage.trim()}
          >
            Commit ({gitStatus.staged.length})
          </Button>
        </div>
      )}

      <Divider />

      {/* Unstaged changes */}
      <div className="git-changes-section">
        <div className="git-section-header">
          <span>Changes</span>
          <Badge count={gitStatus.unstaged.length} size="small" />
        </div>
        {gitStatus.unstaged.length > 0 ? (
          <GitFileTree
            files={gitStatus.unstaged}
            onStageFile={handleStageFile}
            onUnstageFile={handleUnstageFile}
            onDiscardChanges={handleDiscardChanges}
          />
        ) : (
          <Text type="secondary" className="git-empty-state">No changes</Text>
        )}
      </div>

      {/* Untracked files */}
      {gitStatus.untracked.length > 0 && (
        <>
          <Divider />
          <div className="git-changes-section">
            <div className="git-section-header">
              <span>Untracked Files</span>
              <Badge count={gitStatus.untracked.length} size="small" />
            </div>
            <div className="git-untracked-files">
              {gitStatus.untracked.map(file => (
                <div key={file} className="git-file-item">
                  <div className="git-file-info">
                    <FileExclamationOutlined style={{ color: '#666' }} />
                    <span className="git-file-path">{file}</span>
                  </div>
                  <Button 
                    type="text" 
                    size="small"
                    onClick={() => handleStageFile(file)}
                  >
                    +
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* History button */}
      <div className="git-actions">
        <Button
          block
          icon={<HistoryOutlined />}
          onClick={() => setShowCommitHistory(true)}
        >
          View History
        </Button>
      </div>

      {/* Branch creation modal */}
      <Modal
        title="Create New Branch"
        open={showBranchModal}
        onOk={handleCreateBranch}
        onCancel={() => setShowBranchModal(false)}
        okText="Create"
        okButtonProps={{ disabled: !newBranchName.trim() }}
      >
        <Form layout="vertical">
          <Form.Item label="Branch Name">
            <Input
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="feature/new-feature"
              onPressEnter={handleCreateBranch}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Commit history modal */}
      <Modal
        title="Commit History"
        open={showCommitHistory}
        onCancel={() => setShowCommitHistory(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={gitCommits}
          renderItem={(commit) => (
            <List.Item>
              <div className="git-commit-item">
                <div className="git-commit-header">
                  <Text strong>{commit.message}</Text>
                  <Text type="secondary" className="git-commit-hash">
                    {commit.hash.substring(0, 7)}
                  </Text>
                </div>
                <div className="git-commit-meta">
                  <Text type="secondary">
                    {commit.author} • {commit.date.toLocaleString()}
                  </Text>
                  {commit.refs.length > 0 && (
                    <div className="git-commit-refs">
                      {commit.refs.map((ref: string) => (
                        <Tag key={ref}>{ref}</Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};