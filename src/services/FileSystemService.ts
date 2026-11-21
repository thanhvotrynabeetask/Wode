import { LoggerService } from './LoggerService';
import { ProjectSchema } from '../types/schema';
import { formatSessionFilename } from '../utils/dateFormat';

export class FileSystemService {
  private static workspaceHandle: FileSystemDirectoryHandle | null = null;
  private static logQueue: string[] = [];
  private static isFlushingLogs = false;

  public static setWorkspaceHandle(handle: FileSystemDirectoryHandle | null): void {
    this.workspaceHandle = handle;
    if (handle) {
      LoggerService.info('FileSystemService', `Đã kết nối thư mục Workspace: ${handle.name}`);
      this.flushLogs();
    }
  }

  /**
   * Append a log line to app_execution.log in Workspace folder
   */
  public static async appendLog(line: string): Promise<void> {
    this.logQueue.push(line);
    this.flushLogs();
  }

  private static async flushLogs(): Promise<void> {
    if (this.isFlushingLogs || !this.workspaceHandle || this.logQueue.length === 0) return;
    this.isFlushingLogs = true;

    try {
      const logsToWrite = this.logQueue.splice(0, this.logQueue.length);
      const fileHandle = await this.workspaceHandle.getFileHandle('app_execution.log', {
        create: true,
      });

      const file = await fileHandle.getFile();
      const existingText = await file.text();
      const newText = existingText + (existingText ? '\n' : '') + logsToWrite.join('\n');

      const writable = await fileHandle.createWritable();
      await writable.write(newText);
      await writable.close();
    } catch (err) {
      console.warn('Không thể ghi file app_execution.log:', err);
    } finally {
      this.isFlushingLogs = false;
      if (this.logQueue.length > 0 && this.workspaceHandle) {
        this.flushLogs();
      }
    }
  }

  /**
   * Save project schema to .json file inside Workspace directory or prompt Save As
   */
  public static async saveProject(
    schema: ProjectSchema,
    fileName?: string
  ): Promise<{ success: boolean; fileName: string; canceled?: boolean }> {
    const rawName = fileName || `${schema.metadata.project_name || 'workflow'}.json`;
    const safeName = rawName.endsWith('.json') ? rawName : `${rawName}.json`;
    const jsonContent = JSON.stringify(schema, null, 2);

    try {
      if (this.workspaceHandle) {
        const fileHandle = await this.workspaceHandle.getFileHandle(safeName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(jsonContent);
        await writable.close();

        LoggerService.info('FileSystemService', `Đã lưu dự án thành công: ${safeName}`);
        await this.appendLog(
          `[${new Date().toISOString()}] [INFO] [FileSystemService] - Đã lưu dự án thành công: ${safeName}`
        );
        return { success: true, fileName: safeName };
      } else if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: safeName,
            types: [
              {
                description: 'JSON Workflow File (*.json)',
                accept: { 'application/json': ['.json'] },
              },
            ],
          });
          const writable = await fileHandle.createWritable();
          await writable.write(jsonContent);
          await writable.close();

          LoggerService.info('FileSystemService', `Đã lưu dự án thành công: ${fileHandle.name}`);
          return { success: true, fileName: fileHandle.name };
        } catch (err: unknown) {
          if ((err as Error).name === 'AbortError') {
            LoggerService.info('FileSystemService', 'Người dùng đã hủy lưu file.');
            return { success: false, fileName: safeName, canceled: true };
          }
          // Fallback to download on other errors
          this.downloadFile(safeName, jsonContent, 'application/json');
          LoggerService.info('FileSystemService', `Đã xuất tải về file dự án: ${safeName}`);
          return { success: true, fileName: safeName };
        }
      } else {
        // Fallback: browser download
        this.downloadFile(safeName, jsonContent, 'application/json');
        LoggerService.info('FileSystemService', `Đã xuất tải về file dự án: ${safeName}`);
        return { success: true, fileName: safeName };
      }
    } catch (err) {
      LoggerService.error('FileSystemService', `Lỗi khi lưu dự án: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Save session backup snapshot (session_YYYYMMDD_HHmmss.json)
   */
  public static async saveSessionBackup(schema: ProjectSchema): Promise<string> {
    const backupName = `session_${formatSessionFilename()}.json`;
    const jsonContent = JSON.stringify(schema, null, 2);

    try {
      if (this.workspaceHandle) {
        const fileHandle = await this.workspaceHandle.getFileHandle(backupName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(jsonContent);
        await writable.close();
      } else {
        this.downloadFile(backupName, jsonContent, 'application/json');
      }

      LoggerService.info('FileSystemService', `Đã sao lưu phiên làm việc: ${backupName}`);
      return backupName;
    } catch (err) {
      LoggerService.error('FileSystemService', `Lỗi sao lưu phiên: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Browser file download fallback
   */
  public static downloadFile(fileName: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Hook LoggerService to automatically forward logs to FileSystemService
LoggerService.onNewLog((entry) => {
  const line = `[${entry.timestamp}] [${entry.level}] [${entry.module}] - ${entry.message}`;
  FileSystemService.appendLog(line);
});
