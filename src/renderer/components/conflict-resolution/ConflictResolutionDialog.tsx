/**
 * Conflict Resolution Dialog
 * Main dialog for resolving file conflicts with three-pane diff view
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Tabs, Space, Typography, Alert, Spin } from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  UndoOutlined, 
  RedoOutlined,
  SettingOutlined,
  HistoryOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { 
  setResolutionDialogVisible, 
  setCurrentConflict,
  updateConflictContent,
  resolveConflict,
  setDiffViewMode,
  toggleLineNumbers,
  toggleWhitespace,
  toggleSyntaxHighlighting
} from '../../store/slices/conflictSlice';
import { ThreeWayDiffView } from './ThreeWayDiffView';
import { ConflictToolbar } from './ConflictToolbar';
import { ResolutionSuggestionsPanel } from './ResolutionSuggestionsPanel';
import { ConflictDetailsPanel } from './ConflictDetailsPanel';
import './ConflictResolutionDialog.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const ConflictResolutionDialog: React.FC = () => {
  const dispatch = useDispatch();
  const {
    resolutionDialogVisible,
    currentConflictId,
    activeConflicts,
    diffViewMode,
    showLineNumbers,
    showWhitespace,
    syntaxHighlighting,
    isResolvingConflict,
    error
  } = useSelector((state: RootState) => state.conflict);

  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const currentConflict = activeConflicts.find((c: any) => c.id === currentConflictId);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Are you sure you want to close?',
        onOk: () => {
          dispatch(setResolutionDialogVisible(false));
          dispatch(setCurrentConflict(null));
          setHasUnsavedChanges(false);
        }
      });
    } else {
      dispatch(setResolutionDialogVisible(false));
      dispatch(setCurrentConflict(null));
    }
  }, [dispatch, hasUnsavedChanges]);

  const handleAcceptLocal = useCallback(() => {
    if (!currentConflict) return;
    
    dispatch(updateConflictContent({
      conflictId: currentConflict.id,
      type: 'merged',
      content: currentConflict.localContent
    }));
    setHasUnsavedChanges(true);
  }, [dispatch, currentConflict]);

  const handleAcceptRemote = useCallback(() => {
    if (!currentConflict) return;
    
    dispatch(updateConflictContent({
      conflictId: currentConflict.id,
      type: 'merged',
      content: currentConflict.remoteContent
    }));
    setHasUnsavedChanges(true);
  }, [dispatch, currentConflict]);

  const handleManualMerge = useCallback((content: string) => {
    if (!currentConflict) return;
    
    // Save current state to undo stack
    setUndoStack(prev => [...prev, currentConflict.mergedContent]);
    setRedoStack([]); // Clear redo stack on new change
    
    dispatch(updateConflictContent({
      conflictId: currentConflict.id,
      type: 'merged',
      content
    }));
    setHasUnsavedChanges(true);
  }, [dispatch, currentConflict]);

  const handleUndo = useCallback(() => {
    if (!currentConflict || undoStack.length === 0) return;
    
    const previousContent = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, currentConflict.mergedContent]);
    setUndoStack(prev => prev.slice(0, -1));
    
    dispatch(updateConflictContent({
      conflictId: currentConflict.id,
      type: 'merged',
      content: previousContent
    }));
  }, [dispatch, currentConflict, undoStack]);

  const handleRedo = useCallback(() => {
    if (!currentConflict || redoStack.length === 0) return;
    
    const nextContent = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, currentConflict.mergedContent]);
    setRedoStack(prev => prev.slice(0, -1));
    
    dispatch(updateConflictContent({
      conflictId: currentConflict.id,
      type: 'merged',
      content: nextContent
    }));
  }, [dispatch, currentConflict, redoStack]);

  const handleResolve = useCallback(async () => {
    if (!currentConflict) return;
    
    try {
      await (dispatch as any)(resolveConflict({
        conflictId: currentConflict.id,
        resolution: {
          strategy: 'manual',
          content: currentConflict.mergedContent,
          resolvedBy: 'user'
        }
      })).unwrap();
      
      setHasUnsavedChanges(false);
      dispatch(setResolutionDialogVisible(false));
      dispatch(setCurrentConflict(null));
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  }, [dispatch, currentConflict]);

  const handleAbort = useCallback(() => {
    Modal.confirm({
      title: 'Abort Resolution',
      content: 'Are you sure you want to abort the conflict resolution? All changes will be lost.',
      onOk: () => {
        dispatch(setResolutionDialogVisible(false));
        dispatch(setCurrentConflict(null));
        setHasUnsavedChanges(false);
      }
    });
  }, [dispatch]);

  if (!currentConflict) {
    return null;
  }

  return (
    <Modal
      title={
        <div className="conflict-dialog-header">
          <Title level={4} style={{ margin: 0 }}>
            Resolve Conflict: {currentConflict.conflict.filePath}
          </Title>
          <Text type="secondary">
            {currentConflict.conflict.conflictType.replace('_', ' ')} â€?
            {currentConflict.involvedAgents.length} agents involved
          </Text>
        </div>
      }
      open={resolutionDialogVisible}
      onCancel={handleClose}
      width="95vw"
      style={{ top: 20 }}
      className="conflict-resolution-dialog"
      footer={
        <div className="conflict-dialog-footer">
          <div className="footer-left">
            <Button 
              icon={<HistoryOutlined />}
              onClick={() => {/* Show conflict history */}}
            >
              History
            </Button>
            <Button 
              icon={<BulbOutlined />}
              onClick={() => {/* Show suggestions */}}
            >
              Suggestions
            </Button>
          </div>
          <div className="footer-right">
            <Space>
              <Button onClick={handleAbort}>
                Abort
              </Button>
              <Button 
                type="primary" 
                icon={<CheckOutlined />}
                onClick={handleResolve}
                loading={isResolvingConflict}
                disabled={!hasUnsavedChanges}
              >
                Resolve Conflict
              </Button>
            </Space>
          </div>
        </div>
      }
    >
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <div className="conflict-resolution-content">
        <ConflictToolbar
          onAcceptLocal={handleAcceptLocal}
          onAcceptRemote={handleAcceptRemote}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          diffViewMode={diffViewMode}
          onViewModeChange={(mode) => dispatch(setDiffViewMode(mode))}
          showLineNumbers={showLineNumbers}
          onToggleLineNumbers={() => dispatch(toggleLineNumbers())}
          showWhitespace={showWhitespace}
          onToggleWhitespace={() => dispatch(toggleWhitespace())}
          syntaxHighlighting={syntaxHighlighting}
          onToggleSyntaxHighlighting={() => dispatch(toggleSyntaxHighlighting())}
        />

        <div className="conflict-main-content">
          <div className="diff-container">
            <ThreeWayDiffView
              localContent={currentConflict.localContent}
              remoteContent={currentConflict.remoteContent}
              mergedContent={currentConflict.mergedContent}
              baseContent={currentConflict.baseContent}
              filePath={currentConflict.conflict.filePath}
              viewMode={diffViewMode}
              showLineNumbers={showLineNumbers}
              showWhitespace={showWhitespace}
              syntaxHighlighting={syntaxHighlighting}
              onMergedContentChange={handleManualMerge}
            />
          </div>

          <div className="conflict-side-panel">
            <Tabs defaultActiveKey="details" >
              <TabPane tab="Details" key="details">
                <ConflictDetailsPanel conflict={currentConflict} />
              </TabPane>
              <TabPane tab="Suggestions" key="suggestions">
                <ResolutionSuggestionsPanel 
                  conflictId={currentConflict.id}
                  suggestions={currentConflict.resolutionSuggestions}
                  onApplySuggestion={(suggestion) => {
                    if (suggestion.preview) {
                      handleManualMerge(suggestion.preview);
                    }
                  }}
                />
              </TabPane>
            </Tabs>
          </div>
        </div>
      </div>
    </Modal>
  );
};