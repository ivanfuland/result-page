/**
 * 图片处理工具函数
 */

/**
 * 验证base64字符串是否为有效的图片格式
 * @param base64String - base64编码的字符串
 * @returns 是否为有效图片
 */
export const isValidBase64Image = (base64String: string): boolean => {
  if (!base64String) return false;
  
  // 检查是否以data:image开头
  if (!base64String.startsWith('data:image/')) return false;
  
  // 检查是否包含base64标记
  if (!base64String.includes(';base64,')) return false;
  
  return true;
};

/**
 * 获取Base64图片的完整URL
 * @param base64String - 可能不完整的base64字符串
 * @returns 完整的base64 URL
 */
export const getBase64ImageUrl = (base64String: string): string => {
  if (!base64String) return '';
  
  // 如果已经是完整的data URL，直接返回
  if (base64String.startsWith('data:image/')) {
    return base64String;
  }
  
  // 否则，添加前缀
  return `data:image/png;base64,${base64String}`;
};

/**
 * 使图片适合显示的尺寸
 * @param imageElement - 图片元素
 * @param maxWidth - 最大宽度
 * @param maxHeight - 最大高度
 */
export const resizeImageForDisplay = (
  imageElement: HTMLImageElement,
  maxWidth = 500,
  maxHeight = 300
): void => {
  if (!imageElement) return;
  
  const aspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
  
  if (imageElement.naturalWidth > maxWidth) {
    imageElement.width = maxWidth;
    imageElement.height = maxWidth / aspectRatio;
  }
  
  if (imageElement.height > maxHeight) {
    imageElement.height = maxHeight;
    imageElement.width = maxHeight * aspectRatio;
  }
}; 