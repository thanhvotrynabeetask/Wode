import { ProjectSchema } from '../types/schema';
import { ValidationService } from './ValidationService';
import { LoggerService } from './LoggerService';

export class ImportService {
  /**
   * Import project from file content (supports both .json and .html exported files)
   */
  public static async parseFile(file: File): Promise<ProjectSchema> {
    try {
      const text = await file.text();
      let jsonContent = text;

      // If it's an HTML file, extract the embedded JSON script tag
      if (file.name.endsWith('.html') || text.includes('id="workflow-source-data"')) {
        const match = text.match(/<script\s+id="workflow-source-data"[^>]*>([\s\S]*?)<\/script>/i);
        if (!match || !match[1]) {
          const err = 'File HTML không chứa khối dữ liệu hợp lệ (#workflow-source-data).';
          LoggerService.error('ImportService', `${file.name}: ${err}`);
          throw new Error(err);
        }
        jsonContent = match[1].trim();
      }

      // Validate JSON Schema
      const validation = ValidationService.validate(jsonContent);
      if (!validation.isValid || !validation.data) {
        const err = validation.error || 'Cấu trúc file không đúng chuẩn.';
        LoggerService.error('ImportService', `${file.name}: ${err}`);
        throw new Error(err);
      }

      LoggerService.info('ImportService', `Đã nhập thành công sơ đồ từ file: ${file.name}`);
      return validation.data;
    } catch (err) {
      LoggerService.error('ImportService', `Lỗi nhập file: ${(err as Error).message}`);
      throw err;
    }
  }
}
