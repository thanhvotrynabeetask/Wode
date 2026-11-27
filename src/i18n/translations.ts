export type Language = 'en' | 'vi';

export interface Translations {
  common: {
    save: string;
    cancel: string;
    delete: string;
    confirm: string;
    close: string;
    copy: string;
    copied: string;
    reset: string;
    edit: string;
    add: string;
    remove: string;
    success: string;
    error: string;
    info: string;
    warning: string;
    duplicate: string;
  };
  header: {
    newDiagram: string;
    openDiagram: string;
    openReplace: string;
    openAppend: string;
    saveProject: string;
    savedToast: string;
    exportMenu: string;
    exportHTMLLight: string;
    exportHTMLDark: string;
    exportSuccessToast: string;
    settings: string;
    mcpConnector: string;
    mcpConnected: string;
    mcpStandby: string;
    exit: string;
    projectNamePlaceholder: string;
    unsavedChangesPrompt: string;
    newProjectConfirm: string;
  };
  sidebar: {
    paletteTab: string;
    builderTab: string;
    connectionsTab: string;
    collapse: string;
    expand: string;
  };
  palette: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    addRole: string;
    sampleButton: string;
    sampleButtonTitle: string;
    emptyRolesTitle: string;
    emptyRolesDesc: string;
    createFirstRole: string;
    quickSampleButton: string;
    roleNamePrompt: string;
    specialObjects: string;
    specialObjectsDesc: string;
    storageNodeTitle: string;
    storageNodeDesc: string;
    addNodeTemplate: string;
    nodeTitlePrompt: string;
    usageBadge: string;
    unusedWarning: string;
    editRole: string;
    deleteRoleConfirm: string;
    moveRoleUp: string;
    moveRoleDown: string;
    swimlaneMoved: string;
    editNode: string;
    deleteNodeConfirm: string;
    duplicateNode: string;
    roleModalTitle: string;
    roleModalNameLabel: string;
    roleModalColorLabel: string;
    nodeModalTitle: string;
    nodeModalTitleLabel: string;
    nodeModalRoleLabel: string;
    nodeModalSymbolLabel: string;
    noSampleTemplates: string;
    createNewTask: string;
    crossLaneDrag: string;
    addToPhase: string;
    addToDiagram: string;
    onDiagram: string;
    duplicateIndependent: string;
    storageGroupTitle: string;
    mediatorGroupTitle: string;
    storageHint: string;
    mediatorHint: string;
    cornerSymbols: {
      userAction: string;
      bot: string;
      check: string;
      timer: string;
      none: string;
    };
  };
  builder: {
    title: string;
    subtitle: string;
    addFrame: string;
    frameTitlePlaceholder: string;
    emptyFrames: string;
    emptyFrameNodes: string;
    nextFrameLabel: string;
    nextFrameAuto: string;
    nextFrameEnd: string;
    microFlowTitle: string;
    edgesCount: string;
    addConnection: string;
    deleteFrameConfirm: string;
    customNotePlaceholder: string;
    moveNodePromptTitle: string;
    moveNodePromptDesc: string;
    nodeCount: string;
    editTitle: string;
    moveUp: string;
    moveDown: string;
    deleteFrame: string;
    emptyFrameHint: string;
    emptyFrameHintDesc: string;
    showEdgeConfig: string;
    hideEdgeConfig: string;
    nextPhase: string;
    autoSequential: string;
    autoConnect: string;
    autoConnectDesc: string;
    autoConnectNotice: string;
    dragToReorder: string;
    fromNode: string;
    toNode: string;
    fromNodeTooltip: string;
    toNodeTooltip: string;
    messageTooltip: string;
    clickToChangeStyle: string;
    customEdgeDetails: string;
    moveEdgeUp: string;
    moveEdgeDown: string;
    deleteEdge: string;
    deleteEdgeSuccess: string;
    edgeDetailsTitle: string;
    messagePlaceholder: string;
    messageShortPlaceholder: string;
    swapDirection: string;
    messageLabel: string;
    lineStyle: string;
    color: string;
    colorColon: string;
    addFlow: string;
    untitled: string;
    saveEnter: string;
    cancelEsc: string;
    laneIndicator: string;
    moveNodeUp: string;
    moveNodeDown: string;
    editNodeNote: string;
    deleteFromFrame: string;
    itemsCount: string;
    addList: string;
    clickToEdit: string;
    itemPlaceholder: string;
    listingTypes: {
      skill: string;
      ai_model: string;
      ai_agent: string;
      connector: string;
      tool: string;
      custom: string;
    };
    deleteFrameModalTitle: string;
    deleteFrameModalMessage: string;
    noFramesOptional: string;
    noFramesDesc: string;
    tasksOnDiagram: string;
    standaloneNoFrame: string;
    phaseCreated: string;
    phaseDeleted: string;
  };
  canvas: {
    modeSelect: string;
    modePan: string;
    boxSelect: string;
    selectedCount: string;
    selectAll: string;
    spacingLabel: string;
    spacingCompact: string;
    spacingStandard: string;
    spacingWide: string;
    autoAlign: string;
    alignedBadge: string;
    zoomIn: string;
    zoomOut: string;
    fitScreen: string;
    undo: string;
    redo: string;
    emptyCanvasTitle: string;
    emptyCanvasDesc: string;
    dragToMovePrompt: string;
    edgeEditorTitle: string;
    edgeLabelPlaceholder: string;
    edgeStyle: string;
    styleSolid: string;
    styleDashed: string;
    styleDotted: string;
    edgeColor: string;
    edgeEndpoints: string;
    resetRoute: string;
    deleteEdge: string;
    deleteEdgeSuccess: string;
    diagramLabel: string;
    diagramSummary: string;
    activeEditing: string;
    clickToSelect: string;
    noSwimlaneTitle: string;
    noSwimlaneSub: string;
    noSwimlaneDesc: string;
    manageDiagrams: string;
    diagramsOrderDesc: string;
    appendFile: string;
    newBlankDiagram: string;
    duplicateDiagram: string;
    sourceDiagram: string;
    duplicateMode: string;
    duplicateFull: string;
    duplicateSwimlanesOnly: string;
    diagramTitle: string;
    duplicateFullDesc: string;
    duplicateSwimlanesOnlyDesc: string;
    duplicateNow: string;
    duplicateSuccessFull: string;
    duplicateSuccessSwimlanes: string;
    createdNewBlankDiagram: string;
    moveDiagramUp: string;
    moveDiagramDown: string;
    duplicateThisDiagram: string;
    renameDiagram: string;
    deleteDiagram: string;
    deleteDiagramConfirm: string;
    diagramMovedUp: string;
    diagramMovedDown: string;
    diagramDeleted: string;
    doubleClickToAddNote: string;
    collapseList: string;
    expandList: string;
    sideTop: string;
    sideRight: string;
    sideBottom: string;
    sideLeft: string;
    edgeAnchorSource: string;
    edgeAnchorTarget: string;
    edgeHandleSource: string;
    edgeHandleTarget: string;
    edgeAnchorSwitched: string;
    flowTasksSelected: string;
    flowUpdated: string;
    nodeMovedToFrame: string;
    activeDiagramToast: string;
    routeAutoToast: string;
    resetManualRoutesToast: string;
    resetManualRoutes: string;
    statusLanes: string;
    statusPhases: string;
    statusTasks: string;
    sourceNodeFallback: string;
    targetNodeFallback: string;
    confirmTransfer: string;
    keepOriginal: string;
    editingFlowRoute: string;
    editingFlowRouteHint: string;
    resetToAutoBtn: string;
    resetToAutoTitle: string;
    doneBtn: string;
    doneBtnTitle: string;
    clearCanvasBtn: string;
    clearCanvasTitle: string;
    clearCanvasMsg: string;
    clearCanvasConfirm: string;
    canvasClearedToast: string;
    resetSingleDiagramConfirm: string;
    singleDiagramResetToast: string;
    deleteDiagramMenu: string;
  };
  settings: {
    modalTitle: string;
    tabs: {
      general: string;
      appearance: string;
      keybindings: string;
      language: string;
    };
    language: {
      title: string;
      desc: string;
      en: string;
      vi: string;
    };
    appearance: {
      themeTitle: string;
      lightTitle: string;
      lightDesc: string;
      darkTitle: string;
      darkDesc: string;
      systemTitle: string;
      systemDesc: string;
      glowTitle: string;
      glowDesc: string;
    };
    keybindings: {
      title: string;
      desc: string;
      recordingPrompt: string;
      resetDefault: string;
      actions: {
        undo: { title: string; desc: string };
        redo: { title: string; desc: string };
        modeSelect: { title: string; desc: string };
        modePan: { title: string; desc: string };
        selectAll: { title: string; desc: string };
        save: { title: string; desc: string };
        zoomIn: { title: string; desc: string };
        zoomOut: { title: string; desc: string };
        fitScreen: { title: string; desc: string };
      };
    };
    workspace: {
      title: string;
      pathLabel: string;
      noFolderSelected: string;
      chooseFolder: string;
      clearFolder: string;
      logsTitle: string;
      downloadLogs: string;
      logsCount: string;
    };
  };
  mcpModal: {
    title: string;
    statusActive: string;
    statusStandby: string;
    activeDesc: string;
    standbyDesc: string;
    cmdLabel: string;
    configLabel: string;
    copyCmd: string;
  };
  dialogs: {
    exitTitle: string;
    exitDirtyWarning: string;
    saveAndExit: string;
    discardAndExit: string;
    cancelExit: string;
    cleanExitTitle: string;
    cleanExitDesc: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      confirm: 'Confirm',
      close: 'Close',
      copy: 'Copy',
      copied: 'Copied!',
      reset: 'Reset',
      edit: 'Edit',
      add: 'Add',
      remove: 'Remove',
      success: 'Success',
      error: 'Error',
      info: 'Info',
      warning: 'Warning',
      duplicate: 'Duplicate',
    },
    header: {
      newDiagram: 'New Diagram',
      openDiagram: 'Open Diagram',
      openReplace: 'Open File (Replace current)',
      openAppend: 'Append from File (Add as section)',
      saveProject: 'Save Project',
      savedToast: 'Saved project successfully: {fileName}',
      exportMenu: 'Export',
      exportHTMLLight: 'Export HTML (Light Mode)',
      exportHTMLDark: 'Export HTML (Dark Mode)',
      exportSuccessToast: 'Exported standalone HTML: {fileName}',
      settings: 'Settings',
      mcpConnector: 'AI Agent MCP Connector',
      mcpConnected: 'MCP Live Sync Active',
      mcpStandby: 'MCP Standby',
      exit: 'Exit Session',
      projectNamePlaceholder: 'Untitled Workflow',
      unsavedChangesPrompt: 'You have unsaved changes. Do you want to save before proceeding?',
      newProjectConfirm: 'Create new project? Any unsaved changes in current diagram will be lost.',
    },
    sidebar: {
      paletteTab: 'Palette',
      builderTab: 'Frame Builder',
      connectionsTab: 'Connections',
      collapse: 'Collapse sidebar',
      expand: 'Expand sidebar',
    },
    palette: {
      title: 'Role & Node Palette',
      subtitle: 'Define participant roles and node templates',
      searchPlaceholder: 'Search roles or tasks...',
      addRole: 'Add Role',
      sampleButton: 'Sample',
      sampleButtonTitle: 'Load sample starter data',
      emptyRolesTitle: 'No participant roles yet',
      emptyRolesDesc: 'Each role corresponds to a swimlane on the diagram.',
      createFirstRole: 'Create First Role',
      quickSampleButton: 'Load Quick Starter Data',
      roleNamePrompt: 'Enter role name (e.g., Customer, Backend, Admin):',
      specialObjects: 'Special Objects',
      specialObjectsDesc: 'Cross-lane storage and queues',
      storageNodeTitle: 'Storage / Queue',
      storageNodeDesc: 'Database, Cache, Message Queue (can cross swimlanes)',
      addNodeTemplate: 'Add Task Template',
      nodeTitlePrompt: 'Enter node template title:',
      usageBadge: 'Used {count}x',
      unusedWarning: 'Not used in any frame yet',
      editRole: 'Edit Role',
      deleteRoleConfirm: 'Delete role "{name}" and all associated nodes?',
      moveRoleUp: 'Move swimlane up',
      moveRoleDown: 'Move swimlane down',
      swimlaneMoved: 'Swimlane reordered',
      editNode: 'Edit Template',
      deleteNodeConfirm: 'Delete node template "{name}"?',
      duplicateNode: 'Duplicate Node',
      roleModalTitle: 'Edit Role',
      roleModalNameLabel: 'Role Name',
      roleModalColorLabel: 'Theme Color',
      nodeModalTitle: 'Edit Task Template',
      nodeModalTitleLabel: 'Task Title',
      nodeModalRoleLabel: 'Assigned Role',
      nodeModalSymbolLabel: 'Corner Icon / Task Type',
      noSampleTemplates: 'No task templates in this role yet',
      createNewTask: 'Create new task',
      crossLaneDrag: 'Free cross-lane drag',
      addToPhase: '+ Add to {phase}',
      addToDiagram: '+ Add to diagram',
      onDiagram: 'On diagram',
      duplicateIndependent: 'Duplicate independent',
      storageGroupTitle: 'Storage',
      mediatorGroupTitle: 'Mediator / Queue',
      storageHint: 'Database, cache, data storage... drag freely across swimlanes.',
      mediatorHint: 'Message queue, API gateway, webhook... drag freely across swimlanes.',
      cornerSymbols: {
        userAction: 'User Action (Human)',
        bot: 'Automated Bot / Service',
        check: 'Approval / Checkpoint',
        timer: 'Timer / Delay Wait',
        none: 'None',
      },
    },
    builder: {
      title: 'Frame & Flow Builder',
      subtitle: 'Sequence phases and configure connections',
      addFrame: 'Add Phase',
      frameTitlePlaceholder: 'Phase name (e.g., Checkout, Verification)...',
      emptyFrames: 'No frames created yet. Click "Add Phase" above to begin.',
      emptyFrameNodes: 'Drag or add nodes from the Palette into this phase.',
      nextFrameLabel: 'Next Phase:',
      nextFrameAuto: 'Linear (Next frame in list)',
      nextFrameEnd: '🏁 End of Workflow',
      microFlowTitle: 'Phase Connections (Micro-flow)',
      edgesCount: '{count} connection(s)',
      addConnection: 'Add connection',
      deleteFrameConfirm: 'Delete frame "{title}" and all its node instances?',
      customNotePlaceholder: 'Add custom note or execution description...',
      moveNodePromptTitle: 'Move Node to Another Phase',
      moveNodePromptDesc: 'Do you want to move task "{nodeTitle}" to phase "{targetFrameTitle}"?',
      nodeCount: '({count} node)',
      editTitle: 'Edit frame title',
      moveUp: 'Move frame up',
      moveDown: 'Move frame down',
      deleteFrame: 'Delete this frame',
      emptyFrameHint: 'No tasks in this frame yet.',
      emptyFrameHintDesc: 'Switch to "Palette" tab and click + Add to include.',
      showEdgeConfig: 'Customize connections (Edges)',
      hideEdgeConfig: 'Hide connection config',
      nextPhase: 'Branch to next:',
      autoSequential: 'Sequential (Next frame)',
      autoConnect: 'Auto connect',
      autoConnectDesc: 'Auto sequential connection based on display order',
      autoConnectNotice: 'Applying automatic sequential connection (default).',
      dragToReorder: 'Drag to reorder connection',
      fromNode: 'From Node',
      toNode: 'To Node',
      fromNodeTooltip: 'From node: {title} (Click to change)',
      toNodeTooltip: 'To node: {title} (Click to change)',
      messageTooltip: 'Message: "{label}"',
      clickToChangeStyle: 'Click to change line style',
      customEdgeDetails: 'Custom edge details (label, style, color)',
      moveEdgeUp: 'Move connection up',
      moveEdgeDown: 'Move connection down',
      deleteEdge: 'Delete connection',
      deleteEdgeSuccess: 'Connection deleted successfully',
      edgeDetailsTitle: 'Connection Details #{number}',
      messagePlaceholder: 'Enter flow message (e.g., Submit for review, Respond...)',
      messageShortPlaceholder: 'Flow message name...',
      swapDirection: 'Swap direction (Source ⇄ Target)',
      messageLabel: 'Message label on connector',
      lineStyle: 'Line style',
      color: 'Color',
      colorColon: 'Color:',
      addFlow: 'Add flow',
      untitled: 'Untitled',
      saveEnter: 'Save (Enter)',
      cancelEsc: 'Cancel (Esc)',
      laneIndicator: '• Lane: {name}',
      moveNodeUp: 'Move node up (reorder)',
      moveNodeDown: 'Move node down (reorder)',
      editNodeNote: 'Add or edit description/note for this task',
      deleteFromFrame: 'Remove from this phase',
      itemsCount: '📋 {count} items',
      addList: 'Add list',
      clickToEdit: 'click to edit',
      itemPlaceholder: 'Name...',
      listingTypes: {
        skill: 'Skill',
        ai_model: 'AI Model',
        ai_agent: 'AI Agent',
        connector: 'Connector (API/MCP)',
        tool: 'Tool (Paid)',
        custom: 'Other',
      },
      deleteFrameModalTitle: 'Delete Phase (Frame)',
      deleteFrameModalMessage: 'Delete frame "{title}"? All tasks inside will remain intact on the diagram.',
      noFramesOptional: 'No phases defined yet (Optional)',
      noFramesDesc: 'Frames are optional groups for sequencing tasks across swimlanes. Your diagram can work seamlessly without frames.',
      tasksOnDiagram: 'Tasks on diagram ({count})',
      standaloneNoFrame: 'Freeform (No Frame)',
      phaseCreated: 'Created {title}',
      phaseDeleted: 'Phase deleted.',
    },
    canvas: {
      modeSelect: 'Select & Move',
      modePan: 'Pan Canvas',
      boxSelect: 'Box Select',
      selectedCount: '{count} selected',
      selectAll: 'Select All',
      spacingLabel: 'Spacing',
      spacingCompact: 'Compact (24px)',
      spacingStandard: 'Standard (40px)',
      spacingWide: 'Wide (72px)',
      autoAlign: 'Auto-align Spacing',
      alignedBadge: '✓ Aligned',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      fitScreen: 'Fit Screen',
      undo: 'Undo',
      redo: 'Redo',
      emptyCanvasTitle: 'Canvas is Empty',
      emptyCanvasDesc: 'Create roles and add phases with nodes on the left sidebar to generate your swimlane diagram.',
      dragToMovePrompt: 'Drag horizontally within lane • Drag Storage nodes across lanes',
      edgeEditorTitle: 'Edit Connection Flow',
      edgeLabelPlaceholder: 'Message or payload label (e.g., POST /order, Token verified)...',
      edgeStyle: 'Line Style',
      styleSolid: 'Solid Line',
      styleDashed: 'Dashed Line',
      styleDotted: 'Dotted Line',
      edgeColor: 'Flow Color',
      edgeEndpoints: 'Connection Endpoints',
      resetRoute: 'Reset to Default Curved Route',
      deleteEdge: 'Delete Connection',
      deleteEdgeSuccess: 'Connection deleted successfully',
      diagramLabel: 'Diagram {order}',
      diagramSummary: '• {frameCount} frame(s) ({nodeCount} tasks)',
      activeEditing: '● Active (Editing)',
      clickToSelect: 'Click to select',
      noSwimlaneTitle: '+ No swimlanes yet',
      noSwimlaneSub: '(Click to add lane)',
      noSwimlaneDesc: 'This diagram has no swimlanes yet. Click here to select, then add roles on the left panel.',
      manageDiagrams: 'Manage Diagrams',
      diagramsOrderDesc: 'Diagrams stacked top-to-bottom on canvas',
      appendFile: 'Append File',
      newBlankDiagram: 'New Blank Diagram',
      duplicateDiagram: 'Duplicate Diagram',
      sourceDiagram: 'Source Diagram to Duplicate',
      duplicateMode: 'Duplicate Mode',
      duplicateFull: 'Duplicate All (Swimlanes, Frames & Tasks)',
      duplicateSwimlanesOnly: 'Swimlanes Only (Empty diagram)',
      diagramTitle: 'Diagram Title',
      duplicateFullDesc: 'Copy everything: keeps swimlanes, node templates, and all drawn phases and tasks into a new independent diagram below.',
      duplicateSwimlanesOnlyDesc: 'Copy swimlanes & templates only, leaving phases empty so you can design a new workflow without recreating roles.',
      duplicateNow: 'Duplicate Now',
      duplicateSuccessFull: 'Duplicated diagram "{title}" as a new diagram below!',
      duplicateSuccessSwimlanes: 'Duplicated swimlane structure of "{title}" as a new diagram below!',
      createdNewBlankDiagram: 'Added a new blank diagram below!',
      moveDiagramUp: 'Move diagram up',
      moveDiagramDown: 'Move diagram down',
      duplicateThisDiagram: 'Duplicate this diagram',
      renameDiagram: 'Rename diagram',
      deleteDiagram: 'Delete diagram',
      deleteDiagramConfirm: 'Are you sure you want to delete "{title}"?',
      diagramMovedUp: 'Moved "{title}" up',
      diagramMovedDown: 'Moved "{title}" down',
      diagramDeleted: 'Deleted "{title}"',
      doubleClickToAddNote: '(Double click to add note)',
      collapseList: 'Collapse list',
      expandList: 'Expand list',
      sideTop: 'Top',
      sideRight: 'Right',
      sideBottom: 'Bottom',
      sideLeft: 'Left',
      edgeAnchorSource: 'Side {side}: Click to attach source here',
      edgeAnchorTarget: 'Side {side}: Click to attach target here',
      edgeHandleSource: 'Source endpoint: Drag to connect to node edges',
      edgeHandleTarget: 'Target endpoint: Drag to connect to node edges',
      edgeAnchorSwitched: 'Switched {endpoint} anchor to {side} edge.',
      flowTasksSelected: 'Selected {count} tasks along the flow',
      flowUpdated: 'Connection properties updated.',
      nodeMovedToFrame: 'Moved "{title}" to {targetFrame}',
      activeDiagramToast: 'Selected {title} for editing.',
      routeAutoToast: 'Connection route reset to automatic.',
      resetManualRoutesToast: 'Reset {count} manual route(s) to automatic.',
      resetManualRoutes: 'Reset {count} manual routes',
      statusLanes: '{count} Lanes',
      statusPhases: '{count} Phases',
      statusTasks: '{count} Tasks',
      sourceNodeFallback: 'Source Node',
      targetNodeFallback: 'Target Node',
      confirmTransfer: 'Transfer Phase',
      keepOriginal: 'Keep Current',
      editingFlowRoute: 'Editing flow route:',
      editingFlowRouteHint: 'Select node side to change anchor • Drag orange handles to bend',
      resetToAutoBtn: 'Reset to Auto',
      resetToAutoTitle: 'Clear manual bends, reset to automatic route',
      doneBtn: 'Done (Enter)',
      doneBtnTitle: 'Finish route editing (Enter or Esc)',
      clearCanvasBtn: 'Clear Canvas (Delete All)',
      clearCanvasTitle: 'Clear Entire Canvas',
      clearCanvasMsg: 'This action will wipe all existing diagrams on the canvas and reset to a clean blank canvas. Are you sure?',
      clearCanvasConfirm: 'Clear Canvas',
      canvasClearedToast: 'All diagrams cleared. Canvas reset to blank.',
      resetSingleDiagramConfirm: 'Are you sure you want to clear "{title}" and reset it to a blank diagram?',
      singleDiagramResetToast: 'Diagram "{title}" reset to blank.',
      deleteDiagramMenu: 'Delete / Clear Diagrams',
    },
    settings: {
      modalTitle: 'System Settings',
      tabs: {
        general: 'Workspace & Logs',
        appearance: 'Appearance & Theme',
        keybindings: 'Shortcuts & Controls',
        language: 'Language',
      },
      language: {
        title: 'Application Language',
        desc: 'Choose your preferred language for the interface',
        en: 'English (Default)',
        vi: 'Tiếng Việt (Vietnamese)',
      },
      appearance: {
        themeTitle: 'Theme Mode',
        lightTitle: 'Light Mode',
        lightDesc: 'Clean white background',
        darkTitle: 'Dark Slate Mode',
        darkDesc: 'Deep slate for night sessions',
        systemTitle: 'System Match',
        systemDesc: 'Follow OS preference',
        glowTitle: 'Luminous Glow Effects',
        glowDesc: 'Emit vibrant glowing highlights on nodes and flows in Dark Mode',
      },
      keybindings: {
        title: 'Custom Keyboard Shortcuts',
        desc: 'Click on any shortcut, then press your desired combination to rebind.',
        recordingPrompt: 'Press new combination on your keyboard...',
        resetDefault: 'Restore Defaults',
        actions: {
          undo: { title: 'Undo', desc: 'Revert last action' },
          redo: { title: 'Redo', desc: 'Re-apply reverted action' },
          modeSelect: { title: 'Select Mode', desc: 'Select and drag nodes' },
          modePan: { title: 'Pan Mode', desc: 'Move canvas view' },
          selectAll: { title: 'Select All', desc: 'Select all nodes on canvas' },
          save: { title: 'Save Project', desc: 'Save to workspace file' },
          zoomIn: { title: 'Zoom In', desc: 'Increase zoom level' },
          zoomOut: { title: 'Zoom Out', desc: 'Decrease zoom level' },
          fitScreen: { title: 'Fit Screen', desc: 'Fit diagram to screen' },
        },
      },
      workspace: {
        title: 'Local Workspace Folder',
        pathLabel: 'Workspace Path',
        noFolderSelected: 'No workspace folder selected (Prompts on save)',
        chooseFolder: 'Choose Folder',
        clearFolder: 'Clear Folder',
        logsTitle: 'Execution Log (app_execution.log)',
        downloadLogs: 'Download Logs',
        logsCount: '{count} log entries recorded in this session',
      },
    },
    mcpModal: {
      title: 'AI Agent Connector (Model Context Protocol - MCP)',
      statusActive: 'MCP Live Sync: Active',
      statusStandby: 'MCP Server: Standby',
      activeDesc: 'Any diagram drawn by your AI Agent via MCP will update instantly on this canvas in real time!',
      standbyDesc: 'Launch the MCP server using the command below to connect with Claude, Cursor, or Antigravity.',
      cmdLabel: 'Command to Launch MCP Server',
      configLabel: 'MCP Configuration for Claude Desktop / Cursor / Antigravity',
      copyCmd: 'Copy command',
    },
    dialogs: {
      exitTitle: 'Unsaved Changes Detected',
      exitDirtyWarning: 'You have unsaved changes in your current workflow session. Do you want to export a backup snapshot before leaving?',
      saveAndExit: 'Save Backup & Exit',
      discardAndExit: 'Discard & Exit',
      cancelExit: 'Keep Editing',
      cleanExitTitle: 'Exit Wode',
      cleanExitDesc: 'Are you sure you want to close this session? All saved files are securely stored on your disk.',
    },
  },

  vi: {
    common: {
      save: 'Lưu',
      cancel: 'Hủy',
      delete: 'Xóa',
      confirm: 'Xác nhận',
      close: 'Đóng',
      copy: 'Sao chép',
      copied: 'Đã chép!',
      reset: 'Đặt lại',
      edit: 'Sửa',
      add: 'Thêm',
      remove: 'Gỡ bỏ',
      success: 'Thành công',
      error: 'Lỗi',
      info: 'Thông tin',
      warning: 'Cảnh báo',
      duplicate: 'Nhân bản',
    },
    header: {
      newDiagram: 'Tạo Sơ Đồ Mới',
      openDiagram: 'Mở File Sơ Đồ',
      openReplace: 'Mở File (Thay thế sơ đồ hiện tại)',
      openAppend: 'Mở Nối Tiếp (Thêm vào như phân đoạn mới)',
      saveProject: 'Lưu Dự Án',
      savedToast: 'Đã lưu dự án thành công: {fileName}',
      exportMenu: 'Xuất File',
      exportHTMLLight: 'Xuất File HTML (Giao diện sáng)',
      exportHTMLDark: 'Xuất File HTML (Giao diện tối phát sáng)',
      exportSuccessToast: 'Đã xuất HTML độc lập: {fileName}',
      settings: 'Cài Đặt',
      mcpConnector: 'Bộ Kết Nối AI Agent MCP',
      mcpConnected: 'MCP Live Sync Đang Hoạt Động',
      mcpStandby: 'MCP Đang Chờ Kết Nối',
      exit: 'Thoát Phiên Làm Việc',
      projectNamePlaceholder: 'Sơ đồ quy trình chưa đặt tên',
      unsavedChangesPrompt: 'Bạn có thay đổi chưa lưu. Bạn có muốn lưu trước khi tiếp tục không?',
      newProjectConfirm: 'Tạo dự án mới? Mọi thay đổi chưa lưu trên sơ đồ hiện tại sẽ bị mất.',
    },
    sidebar: {
      paletteTab: 'Kho Nhiệm Vụ',
      builderTab: 'Dựng Phân Đoạn',
      connectionsTab: 'Đường Nối',
      collapse: 'Thu gọn thanh bên',
      expand: 'Mở rộng thanh bên',
    },
    palette: {
      title: 'Kho Vai Trò & Node Mẫu',
      subtitle: 'Quản lý các làn bơi và nhiệm vụ mẫu',
      searchPlaceholder: 'Tìm vai trò hoặc nhiệm vụ...',
      addRole: 'Thêm Vai Trò',
      sampleButton: 'Mẫu',
      sampleButtonTitle: 'Khởi tạo dữ liệu mẫu',
      emptyRolesTitle: 'Chưa có vai trò nào',
      emptyRolesDesc: 'Mỗi vai trò (Role) sẽ tương ứng với một làn bơi (Swimlane) trên sơ đồ.',
      createFirstRole: 'Tạo vai trò đầu tiên',
      quickSampleButton: 'Tạo dữ liệu mẫu nhanh',
      roleNamePrompt: 'Nhập tên vai trò (vd: Customer, Backend, Admin):',
      specialObjects: 'Trường Đối Tượng Đặc Biệt',
      specialObjectsDesc: 'Lưu trữ và hàng đợi xuyên làn bơi',
      storageNodeTitle: 'Kho Dữ Liệu / Hàng Đợi',
      storageNodeDesc: 'Database, Cache, Message Queue (tự do di chuyển xuyên làn)',
      addNodeTemplate: 'Thêm Node Mẫu',
      nodeTitlePrompt: 'Nhập tên nhiệm vụ mẫu:',
      usageBadge: 'Dùng {count} lần',
      unusedWarning: 'Chưa được đưa vào phân đoạn nào',
      editRole: 'Sửa vai trò',
      deleteRoleConfirm: 'Xóa vai trò "{name}" và toàn bộ node liên quan?',
      moveRoleUp: 'Di chuyển swimlane lên',
      moveRoleDown: 'Di chuyển swimlane xuống',
      swimlaneMoved: 'Đã thay đổi thứ tự swimlane',
      editNode: 'Sửa node mẫu',
      deleteNodeConfirm: 'Xóa node mẫu "{name}"?',
      duplicateNode: 'Nhân bản node',
      roleModalTitle: 'Chỉnh Sửa Vai Trò',
      roleModalNameLabel: 'Tên Vai Trò (Làn bơi)',
      roleModalColorLabel: 'Màu Nhận Diện',
      nodeModalTitle: 'Chỉnh Sửa Node Mẫu',
      nodeModalTitleLabel: 'Tên Nhiệm Vụ',
      nodeModalRoleLabel: 'Vai Trò Thuộc Về',
      nodeModalSymbolLabel: 'Biểu Tượng Góc / Phân Loại',
      noSampleTemplates: 'Chưa có nhiệm vụ mẫu nào trong vai trò này',
      createNewTask: 'Tạo nhiệm vụ mới',
      crossLaneDrag: 'Kéo đổi làn tự do',
      addToPhase: '+ Đưa vào {phase}',
      addToDiagram: '+ Đưa vào sơ đồ',
      onDiagram: 'Đã có trên sơ đồ',
      duplicateIndependent: 'Nhân bản độc lập',
      storageGroupTitle: 'Storage',
      mediatorGroupTitle: 'Kênh trung gian',
      storageHint: 'Database, cache, kho dữ liệu... tự hút vào làn khi kéo thả.',
      mediatorHint: 'Queue, API gateway, webhook... tự hút vào làn khi kéo thả.',
      cornerSymbols: {
        userAction: 'Hành động người dùng (Human)',
        bot: 'Tác vụ tự động / Bot / Dịch vụ',
        check: 'Xét duyệt / Kiểm tra điều kiện',
        timer: 'Chờ đợi thời gian / Delay',
        none: 'Không có',
      },
    },
    builder: {
      title: 'Trình Dựng Phân Đoạn (Frames)',
      subtitle: 'Sắp xếp giai đoạn và liên kết luồng nghiệp vụ',
      addFrame: 'Thêm Phân Đoạn',
      frameTitlePlaceholder: 'Tên giai đoạn (vd: Đặt hàng, Xác thực)...',
      emptyFrames: 'Chưa có phân đoạn nào. Bấm "Thêm Phân Đoạn" ở trên để bắt đầu.',
      emptyFrameNodes: 'Kéo thả hoặc thêm node từ Kho vào giai đoạn này.',
      nextFrameLabel: 'Giai đoạn tiếp theo:',
      nextFrameAuto: 'Tuyến tính (Nối sang frame kế tiếp)',
      nextFrameEnd: '🏁 Kết thúc quy trình',
      microFlowTitle: 'Nối dây trong Frame (Micro-flow)',
      edgesCount: '{count} liên kết',
      addConnection: 'Thêm liên kết',
      deleteFrameConfirm: 'Xóa giai đoạn "{title}" và toàn bộ node bên trong?',
      customNotePlaceholder: 'Thêm ghi chú mô tả chi tiết...',
      moveNodePromptTitle: 'Chuyển Nhiệm Vụ Sang Giai Đoạn Khác',
      moveNodePromptDesc: 'Bạn có muốn chuyển nhiệm vụ "{nodeTitle}" sang giai đoạn "{targetFrameTitle}" không?',
      nodeCount: '({count} node)',
      editTitle: 'Sửa tiêu đề Frame',
      moveUp: 'Di chuyển Frame lên trước',
      moveDown: 'Di chuyển Frame xuống sau',
      deleteFrame: 'Xóa Frame này',
      emptyFrameHint: 'Chưa có nhiệm vụ nào trong phân đoạn này.',
      emptyFrameHintDesc: 'Chuyển sang tab "Kho Node" và bấm + Thêm để đưa vào.',
      showEdgeConfig: 'Tùy biến nối dây (Edges)',
      hideEdgeConfig: 'Ẩn cấu hình nối dây',
      nextPhase: 'Rẽ nhánh tiếp:',
      autoSequential: 'Tuần tự (Frame tiếp theo)',
      autoConnect: 'Nối tự động',
      autoConnectDesc: 'Tự động nối tuần tự theo thứ tự hiển thị',
      autoConnectNotice: 'Đang áp dụng nối tuần tự tự động (mặc định).',
      dragToReorder: 'Kéo thả để đổi thứ tự dây',
      fromNode: 'Từ Node',
      toNode: 'Đến Node',
      fromNodeTooltip: 'Từ node: {title} (Bấm để chọn lại node)',
      toNodeTooltip: 'Đến node: {title} (Bấm để chọn lại node)',
      messageTooltip: 'Thông điệp: "{label}"',
      clickToChangeStyle: 'Bấm để chuyển kiểu nét',
      customEdgeDetails: 'Tùy chỉnh chi tiết (nhãn thông điệp, nét, màu)',
      moveEdgeUp: 'Di chuyển dây lên trên',
      moveEdgeDown: 'Di chuyển dây xuống dưới',
      deleteEdge: 'Xóa liên kết',
      deleteEdgeSuccess: 'Đã xóa đường nối thành công',
      edgeDetailsTitle: 'Tùy chỉnh chi tiết luồng #{number}',
      messagePlaceholder: 'Nhập thông điệp luồng (ví dụ: Gửi duyệt, Phản hồi...)',
      messageShortPlaceholder: 'Tên thông điệp luồng...',
      swapDirection: 'Đảo chiều luồng (đổi nguồn ⇄ đích)',
      messageLabel: 'Nhãn thông điệp trên dây',
      lineStyle: 'Kiểu nét',
      color: 'Màu sắc dây',
      colorColon: 'Màu:',
      addFlow: 'Thêm luồng',
      untitled: 'Chưa đặt tên',
      saveEnter: 'Lưu (Enter)',
      cancelEsc: 'Hủy (Esc)',
      laneIndicator: '• Làn: {name}',
      moveNodeUp: 'Di chuyển node lên trước (đổi thứ tự)',
      moveNodeDown: 'Di chuyển node xuống sau (đổi thứ tự)',
      editNodeNote: 'Thêm hoặc sửa mô tả / ghi chú cho nhiệm vụ này',
      deleteFromFrame: 'Xóa khỏi phân đoạn này',
      itemsCount: '📋 {count} mục',
      addList: 'Thêm danh sách',
      clickToEdit: 'bấm để edit',
      itemPlaceholder: 'Tên...',
      listingTypes: {
        skill: 'Skill',
        ai_model: 'AI Model',
        ai_agent: 'AI Agent',
        connector: 'Connector (API/MCP)',
        tool: 'Tool (trả phí)',
        custom: 'Khác',
      },
      deleteFrameModalTitle: 'Xóa Phân Đoạn (Frame)',
      deleteFrameModalMessage: 'Xóa phân đoạn "{title}"? Mọi nhiệm vụ bên trong vẫn sẽ được giữ nguyên an toàn trên sơ đồ.',
      noFramesOptional: 'Chưa có phân đoạn nào (Tùy chọn)',
      noFramesDesc: 'Frame là phần tùy chọn để gom nhóm các nhiệm vụ thành từng giai đoạn cắt ngang các làn bơi. Sơ đồ của bạn hoàn toàn có thể hoạt động mà không cần Frame.',
      tasksOnDiagram: 'Nhiệm vụ trên sơ đồ ({count})',
      standaloneNoFrame: 'Tự do (Không Frame)',
      phaseCreated: 'Đã tạo {title}',
      phaseDeleted: 'Đã xóa phân đoạn.',
    },
    canvas: {
      modeSelect: 'Chọn & Kéo Node',
      modePan: 'Di Chuyển Canvas (Pan)',
      boxSelect: 'Quét chọn vùng',
      selectedCount: 'Đã chọn {count} node',
      selectAll: 'Chọn tất cả',
      spacingLabel: 'Khoảng cách',
      spacingCompact: 'Gọn (24px)',
      spacingStandard: 'Chuẩn (40px)',
      spacingWide: 'Rộng (72px)',
      autoAlign: 'Căn đều khoảng cách',
      alignedBadge: '✓ Thẳng hàng',
      zoomIn: 'Phóng to (+)',
      zoomOut: 'Thu nhỏ (-)',
      fitScreen: 'Vừa màn hình (Fit)',
      undo: 'Hoàn tác (Undo)',
      redo: 'Làm lại (Redo)',
      emptyCanvasTitle: 'Vùng Vẽ Đang Trống',
      emptyCanvasDesc: 'Tạo vai trò và thêm các giai đoạn chứa node ở thanh bên trái để tự động tạo sơ đồ phân làn.',
      dragToMovePrompt: 'Kéo ngang trong làn bơi • Kéo node Storage tự do xuyên làn',
      edgeEditorTitle: 'Chỉnh Sửa Dây Nối Luồng',
      edgeLabelPlaceholder: 'Nhãn thông điệp (vd: POST /order, Đã xác thực)...',
      edgeStyle: 'Kiểu nét vẽ',
      styleSolid: 'Nét liền (Solid)',
      styleDashed: 'Nét đứt (Dashed)',
      styleDotted: 'Nét chấm (Dotted)',
      edgeColor: 'Màu dây nối',
      edgeEndpoints: 'Cổng tiếp xúc đầu cuối',
      resetRoute: 'Khôi phục đường uốn cong mặc định',
      deleteEdge: 'Xóa dây nối',
      deleteEdgeSuccess: 'Đã xóa đường nối thành công',
      diagramLabel: 'Sơ đồ {order}',
      diagramSummary: '• {frameCount} phân đoạn ({nodeCount} nhiệm vụ)',
      activeEditing: '● Đang chọn chỉnh sửa',
      clickToSelect: 'Bấm để chọn sửa',
      noSwimlaneTitle: '+ Chưa có làn bơi',
      noSwimlaneSub: '(Bấm để tạo làn mới)',
      noSwimlaneDesc: 'Sơ đồ mới này chưa có làn bơi (swimlane). Bấm vào đây để chọn sơ đồ, sau đó thêm vai trò ở bảng bên trái để tạo làn bơi.',
      manageDiagrams: 'Quản lý Sơ đồ',
      diagramsOrderDesc: 'Sơ đồ xếp theo thứ tự từ trên xuống dưới trên Canvas',
      appendFile: 'Ghép file',
      newBlankDiagram: 'Tạo sơ đồ trống mới',
      duplicateDiagram: 'Nhân bản Sơ đồ',
      sourceDiagram: 'Sơ đồ gốc cần nhân bản',
      duplicateMode: 'Chế độ nhân bản',
      duplicateFull: 'Nhân bản toàn bộ (Làn bơi, phân đoạn & nhiệm vụ)',
      duplicateSwimlanesOnly: 'Chỉ giữ khung làn bơi (Xóa sạch nhiệm vụ)',
      diagramTitle: 'Tên sơ đồ mới',
      duplicateFullDesc: 'Sao chép toàn bộ: Giữ nguyên các làn bơi (swimlane), bảng mẫu nhiệm vụ và tất cả phân đoạn, nhiệm vụ đã vẽ sang sơ đồ mới độc lập bên dưới.',
      duplicateSwimlanesOnlyDesc: 'Sao chép các làn bơi & mẫu nhiệm vụ, giữ phân đoạn trống để bạn vẽ quy trình mới mà không cần tạo lại vai trò/swimlane.',
      duplicateNow: 'Nhân bản ngay',
      duplicateSuccessFull: 'Đã nhân bản toàn bộ sơ đồ "{title}" thành sơ đồ mới bên dưới!',
      duplicateSuccessSwimlanes: 'Đã nhân bản khung làn bơi của "{title}" thành sơ đồ mới bên dưới!',
      createdNewBlankDiagram: 'Đã thêm sơ đồ mới hoàn toàn bên dưới!',
      moveDiagramUp: 'Chuyển sơ đồ lên trên',
      moveDiagramDown: 'Chuyển sơ đồ xuống dưới',
      duplicateThisDiagram: 'Nhân bản sơ đồ này',
      renameDiagram: 'Đổi tên sơ đồ',
      deleteDiagram: 'Xóa sơ đồ này',
      deleteDiagramConfirm: 'Bạn có chắc muốn xóa "{title}"?',
      diagramMovedUp: 'Đã chuyển "{title}" lên trên',
      diagramMovedDown: 'Đã chuyển "{title}" xuống dưới',
      diagramDeleted: 'Đã xóa "{title}"',
      doubleClickToAddNote: '(Nhấp đúp để thêm chú thích)',
      collapseList: 'Thu gọn danh sách',
      expandList: 'Mở danh sách',
      sideTop: 'Trên',
      sideRight: 'Phải',
      sideBottom: 'Dưới',
      sideLeft: 'Trái',
      edgeAnchorSource: 'Cạnh {side}: Nhấp để chuyển đầu nguồn vào giữa cạnh này',
      edgeAnchorTarget: 'Cạnh {side}: Nhấp để chuyển đầu đích vào giữa cạnh này',
      edgeHandleSource: 'Điểm chạm nguồn: Kéo để đổi sang 1 trong 4 cạnh (ở giữa cạnh)',
      edgeHandleTarget: 'Điểm chạm đích: Kéo để đổi sang 1 trong 4 cạnh (ở giữa cạnh)',
      edgeAnchorSwitched: 'Đã chuyển điểm chạm {endpoint} sang cạnh {side}.',
      flowTasksSelected: 'Đã chọn {count} nhiệm vụ theo luồng',
      flowUpdated: 'Đã cập nhật thuộc tính luồng dữ liệu.',
      nodeMovedToFrame: 'Đã chuyển "{title}" sang {targetFrame}',
      activeDiagramToast: 'Đã chọn {title} để chỉnh sửa.',
      routeAutoToast: 'Đã trả luồng về tự động định tuyến.',
      resetManualRoutesToast: 'Đã đặt lại {count} đường thủ công về tự động.',
      resetManualRoutes: 'Đặt lại {count} đường thủ công',
      statusLanes: '{count} Làn',
      statusPhases: '{count} Phân đoạn',
      statusTasks: '{count} Nhiệm vụ',
      sourceNodeFallback: 'Node nguồn',
      targetNodeFallback: 'Node đích',
      confirmTransfer: 'Chuyển phân đoạn',
      keepOriginal: 'Giữ nguyên',
      editingFlowRoute: 'Đang uốn luồng:',
      editingFlowRouteHint: 'Chọn 1 trong 4 cạnh Node để đổi điểm chạm • Kéo ô vàng để uốn',
      resetToAutoBtn: 'Tự động lại',
      resetToAutoTitle: 'Xóa đường vẽ tay, đưa về tự động',
      doneBtn: 'Xong (Enter)',
      doneBtnTitle: 'Hoàn tất chỉnh sửa đường đi (Phím tắt: Enter hoặc Esc)',
      clearCanvasBtn: 'Xóa Sạch Canvas (Xóa Tất Cả)',
      clearCanvasTitle: 'Xóa Sạch Toàn Bộ Canvas',
      clearCanvasMsg: 'Hành động này sẽ xóa tất cả các sơ đồ hiện có trên Canvas và đưa về một sơ đồ trống tinh ban đầu. Bạn có chắc chắn không?',
      clearCanvasConfirm: 'Xóa Sạch Canvas',
      canvasClearedToast: 'Đã xóa toàn bộ sơ đồ. Canvas trở về trạng thái trống ban đầu.',
      resetSingleDiagramConfirm: 'Bạn có chắc muốn làm sạch sơ đồ "{title}" và đưa về sơ đồ trống không?',
      singleDiagramResetToast: 'Đã làm sạch sơ đồ "{title}".',
      deleteDiagramMenu: 'Tùy Chọn Xóa Sơ Đồ',
    },
    settings: {
      modalTitle: 'Cài Đặt Hệ Thống',
      tabs: {
        general: 'Workspace & Log',
        appearance: 'Giao Diện & Glow',
        keybindings: 'Phím Tắt & Điều Khiển',
        language: 'Ngôn Ngữ (Language)',
      },
      language: {
        title: 'Ngôn Ngữ Ứng Dụng (Application Language)',
        desc: 'Chọn ngôn ngữ hiển thị mặc định cho toàn bộ giao diện',
        en: 'English (Tiếng Anh - Mặc định)',
        vi: 'Tiếng Việt (Vietnamese)',
      },
      appearance: {
        themeTitle: 'Chế độ giao diện (Theme)',
        lightTitle: 'Giao diện sáng',
        lightDesc: 'Nền trắng thanh lịch',
        darkTitle: 'Giao diện tối',
        darkDesc: 'Dịu mắt ban đêm',
        systemTitle: 'Theo hệ thống',
        systemDesc: 'Tự động theo OS',
        glowTitle: 'Hiệu ứng phát sáng (Luminous Glow)',
        glowDesc: 'Bật ánh sáng hào quang rực rỡ quanh node và dây nối khi ở chế độ Dark Mode',
      },
      keybindings: {
        title: 'Tùy Chỉnh Phím Tắt',
        desc: 'Bấm vào phím tắt bất kỳ, sau đó gõ tổ hợp phím mới trên bàn phím để gán lại.',
        recordingPrompt: 'Bấm tổ hợp phím mới trên bàn phím...',
        resetDefault: 'Khôi phục mặc định',
        actions: {
          undo: { title: 'Hoàn tác (Undo)', desc: 'Khôi phục thao tác trước đó' },
          redo: { title: 'Làm lại (Redo)', desc: 'Thực hiện lại thao tác vừa hoàn tác' },
          modeSelect: { title: 'Chế độ Chọn / Kéo', desc: 'Chọn node, di chuyển vị trí trong làn' },
          modePan: { title: 'Chế độ Di chuyển (Pan)', desc: 'Kéo di chuyển góc nhìn Canvas' },
          selectAll: { title: 'Chọn tất cả', desc: 'Chọn toàn bộ node trên sơ đồ' },
          save: { title: 'Lưu dự án', desc: 'Lưu vào thư mục Workspace' },
          zoomIn: { title: 'Phóng to (+)', desc: 'Tăng mức thu phóng' },
          zoomOut: { title: 'Thu nhỏ (-)', desc: 'Giảm mức thu phóng' },
          fitScreen: { title: 'Vừa màn hình (Fit)', desc: 'Căn khung nhìn bao quát sơ đồ' },
        },
      },
      workspace: {
        title: 'Thư Mục Workspace Cục Bộ',
        pathLabel: 'Đường dẫn Workspace',
        noFolderSelected: 'Chưa chọn thư mục (Hệ thống sẽ hỏi khi lưu file)',
        chooseFolder: 'Chọn Thư Mục',
        clearFolder: 'Xóa Thiết Lập',
        logsTitle: 'File Nhật Ký Thực Thi (app_execution.log)',
        downloadLogs: 'Tải File Log',
        logsCount: 'Đã ghi nhận {count} dòng nhật ký trong phiên này',
      },
    },
    mcpModal: {
      title: 'Bộ Kết Nối AI Agent (Model Context Protocol - MCP)',
      statusActive: 'MCP Live Sync: Đang hoạt động',
      statusStandby: 'MCP Server: Đang ở chế độ chờ (Standby)',
      activeDesc: 'Bất kỳ sơ đồ nào AI Agent vẽ thông qua MCP sẽ tự động cập nhật ngay lập tức lên Canvas này!',
      standbyDesc: 'Khởi chạy server MCP bằng lệnh bên dưới để kết nối với Claude, Cursor hoặc Antigravity.',
      cmdLabel: 'Lệnh Khởi Chạy MCP Server',
      configLabel: 'Cấu hình MCP cho Claude Desktop / Cursor / Antigravity',
      copyCmd: 'Copy lệnh',
    },
    dialogs: {
      exitTitle: 'Phát Hiện Thay Đổi Chưa Lưu',
      exitDirtyWarning: 'Bạn có thay đổi chưa lưu trong phiên làm việc hiện tại. Bạn có muốn xuất bản sao lưu phiên làm việc trước khi rời đi không?',
      saveAndExit: 'Lưu Bản Sao & Thoát',
      discardAndExit: 'Không Lưu & Thoát',
      cancelExit: 'Tiếp Tục Chỉnh Sửa',
      cleanExitTitle: 'Thoát Ứng Dụng Wode',
      cleanExitDesc: 'Bạn có chắc chắn muốn đóng phiên làm việc này? Mọi file đã lưu đều an toàn trên máy của bạn.',
    },
  },
};
