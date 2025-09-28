# 应用配置和用户偏好界面

这个模块实现了完整的应用配置和用户偏好设置界面，包含8个主要设置分类和丰富的配置选项。

## 功能特性

### 1. 设置对话框 (SettingsDialog)
- **分类导航**: 左侧导航菜单，支持图标和描述
- **搜索功能**: 实时搜索设置项和分类
- **状态管理**: 显示未保存更改和最后保存时间
- **响应式布局**: 适配不同屏幕尺寸

### 2. 主题配置面板 (AppearanceSettings)
- **主题模式**: 深色/浅色/自动跟随系统
- **预设主题**: 5种预设主题模板
- **自定义颜色**: 主色调、强调色、自定义颜色方案
- **字体设置**: 字体系列选择、大小调整、实时预览

### 3. Agent配置界面 (AgentSettings)
- **Agent类型管理**: 启用/禁用不同类型的Agent
- **性能参数**: 并发数量、超时时间、内存限制、CPU阈值
- **行为设置**: 自动分配、协作模式、错误处理、通信级别

### 4. 编辑器设置 (EditorSettings)
- **基本配置**: 制表符大小、编辑器主题
- **编辑行为**: 空格/制表符、自动换行、行号显示
- **自动化功能**: 自动保存、保存时格式化

### 5. 快捷键设置 (ShortcutSettings)
- **分类管理**: 按功能分类的快捷键
- **可视化编辑**: 快捷键录制和编辑
- **冲突检测**: 自动检测和解决快捷键冲突
- **搜索过滤**: 快速查找特定快捷键

### 6. 数据管理设置 (DataManagementSettings)
- **自动备份**: 定时备份、备份数量限制、加密选项
- **手动备份**: 创建、恢复、删除备份文件
- **配置同步**: 本地/云端同步、多设备配置共享
- **导入导出**: 配置文件的导入导出功能

### 7. 更新设置 (UpdateSettings)
- **版本信息**: 当前版本、更新通道显示
- **自动更新**: 检查、下载、安装自动化配置
- **更新管理**: 手动检查、下载进度、更新日志
- **通道选择**: 稳定版/测试版/开发版

### 8. 使用统计 (UsageStatistics)
- **使用情况**: 使用时长、任务完成数、成功率统计
- **性能指标**: CPU、内存使用率图表
- **Agent统计**: 各类型Agent的工作统计
- **功能分析**: 功能使用频率饼图

### 9. 高级设置 (AdvancedSettings)
- **调试选项**: 调试模式、日志级别配置
- **实验性功能**: Beta功能开关、状态标识
- **性能模式**: 节能/平衡/性能模式选择
- **系统维护**: 缓存清理、设置重置、诊断工具

## 技术实现

### 状态管理
- **Redux Toolkit**: 使用现代Redux模式管理设置状态
- **异步操作**: 支持设置的加载、保存、导入导出
- **实时同步**: 设置变更的实时反映和持久化

### 数据持久化
- **本地存储**: 使用Electron的userData目录存储设置
- **备份系统**: 自动和手动备份机制
- **版本兼容**: 设置格式的向后兼容性

### 用户体验
- **即时反馈**: 设置变更的实时预览
- **表单验证**: 输入值的验证和错误提示
- **进度显示**: 长时间操作的进度指示
- **确认对话框**: 危险操作的二次确认

## 文件结构

```
src/renderer/components/settings/
├── SettingsDialog.tsx          # 主设置对话框
├── SettingsDialog.css          # 样式文件
├── SettingsDemo.tsx            # 演示组件
├── SettingsTest.tsx            # 测试组件
├── categories/                 # 设置分类组件
│   ├── AppearanceSettings.tsx  # 外观设置
│   ├── AgentSettings.tsx       # Agent设置
│   ├── EditorSettings.tsx      # 编辑器设置
│   ├── ShortcutSettings.tsx    # 快捷键设置
│   ├── DataManagementSettings.tsx # 数据管理
│   ├── UpdateSettings.tsx      # 更新设置
│   ├── UsageStatistics.tsx     # 使用统计
│   └── AdvancedSettings.tsx    # 高级设置
└── README.md                   # 说明文档

src/renderer/types/
└── settings.ts                 # 设置相关类型定义

src/renderer/store/slices/
└── settingsSlice.ts           # Redux状态管理

src/electron/services/
└── SettingsService.ts         # 后端设置服务

src/electron/handlers/
└── settingsHandlers.ts        # IPC处理器
```

## 使用方法

### 基本使用
```tsx
import SettingsDialog from './components/settings/SettingsDialog';

function App() {
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <div>
      <Button onClick={() => setSettingsVisible(true)}>
        打开设置
      </Button>
      
      <SettingsDialog
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        initialCategory="appearance"
      />
    </div>
  );
}
```

### Redux状态访问
```tsx
import { useSelector, useDispatch } from 'react-redux';
import { updateThemeSettings } from '../store/slices/settingsSlice';

function MyComponent() {
  const { theme } = useSelector(state => state.settings.settings);
  const dispatch = useDispatch();

  const handleThemeChange = (newTheme) => {
    dispatch(updateThemeSettings(newTheme));
  };

  return (
    <div style={{ color: theme.primaryColor }}>
      主题颜色示例
    </div>
  );
}
```

## 扩展指南

### 添加新的设置分类
1. 在 `categories/` 目录下创建新组件
2. 在 `SettingsDialog.tsx` 中添加分类定义
3. 在 `settingsSlice.ts` 中添加相应的状态和操作
4. 在 `settings.ts` 中定义类型接口

### 自定义设置项
1. 扩展 `AppSettings` 接口
2. 添加默认值到 `defaultSettings`
3. 创建相应的更新操作
4. 在UI组件中实现设置界面

## 注意事项

1. **性能优化**: 大量设置项时使用虚拟滚动
2. **数据验证**: 确保设置值的有效性
3. **错误处理**: 妥善处理文件操作错误
4. **用户体验**: 提供清晰的操作反馈
5. **安全性**: 敏感设置的加密存储

## 依赖项

- React 18+
- Redux Toolkit
- Ant Design
- Recharts (图表组件)
- Electron (文件系统操作)
- dayjs (日期处理)

## 测试

运行测试组件查看完整功能：

```tsx
import SettingsTest from './components/settings/SettingsTest';

// 在应用中渲染测试组件
<SettingsTest />
```

这个实现提供了完整的应用配置界面，支持所有主要的设置分类和用户偏好管理功能。