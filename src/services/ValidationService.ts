import { ProjectSchema } from '../types/schema';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  data?: ProjectSchema;
}

export class ValidationService {
  public static validate(jsonText: string): ValidationResult {
    try {
      const obj = JSON.parse(jsonText);

      if (!obj || typeof obj !== 'object') {
        return { isValid: false, error: 'Dữ liệu file không phải là JSON object hợp lệ.' };
      }

      if (!obj.version) {
        return { isValid: false, error: 'Thiếu trường bắt buộc: "version".' };
      }

      if (!obj.metadata || typeof obj.metadata !== 'object') {
        return { isValid: false, error: 'Thiếu hoặc sai định dạng trường: "metadata".' };
      }

      if (!Array.isArray(obj.roles)) {
        return { isValid: false, error: 'Trường "roles" phải là một mảng.' };
      }

      if (!Array.isArray(obj.node_palette)) {
        return { isValid: false, error: 'Trường "node_palette" phải là một mảng.' };
      }

      if (!Array.isArray(obj.frames)) {
        return { isValid: false, error: 'Trường "frames" phải là một mảng.' };
      }

      // Validate frames and node instances
      for (const frame of obj.frames) {
        if (!frame.frame_id || !frame.title || typeof frame.order !== 'number') {
          return {
            isValid: false,
            error: `Frame [${frame.title || frame.frame_id || 'không tên'}] thiếu thông tin cơ bản.`,
          };
        }
        if (!Array.isArray(frame.nodes)) {
          return {
            isValid: false,
            error: `Frame "${frame.title}" có trường "nodes" không hợp lệ.`,
          };
        }
      }

      return {
        isValid: true,
        data: obj as ProjectSchema,
      };
    } catch (err) {
      return {
        isValid: false,
        error: `Lỗi cú pháp JSON: ${(err as Error).message}`,
      };
    }
  }
}
