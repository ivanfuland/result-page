import Head from 'next/head';
import { useRef, useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Form, Alert, Spinner } from 'react-bootstrap';
import { isValidBase64Image } from '../utils/imageUtils';

export default function Home() {
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [ocrResult, setOcrResult] = useState('');
  const [canCopy, setCanCopy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{message: string, type: string} | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [pasteAreaText, setPasteAreaText] = useState('拖拽图片到此处，点击选择文件，或粘贴图片 (Ctrl+V / Cmd+V)');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);

  // n8n Webhook URL
  const N8N_WEBHOOK_URL = 'https://n8n.judyplan.com/webhook/image-ocr';

  useEffect(() => {
    // 监听粘贴事件
    document.addEventListener('paste', handlePaste);
    
    // 初始化状态
    showStatus('准备就绪，请上传图片', 'info', 5000);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handlePaste = async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    let imageFile = null;

    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          imageFile = items[i].getAsFile();
          break;
        }
      }
    }

    if (imageFile) {
      event.preventDefault(); // 阻止默认的粘贴行为
      processImageFile(imageFile);
    } else {
      showStatus('粘贴的内容不是图片，请粘贴图片文件', 'danger', 4000);
    }
  };
  
  // 处理拖拽事件
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.indexOf('image') !== -1) {
        processImageFile(file);
      } else {
        showStatus('拖放的文件不是图片，请使用图片文件', 'danger', 4000);
      }
    }
  };
  
  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
      // 清空input，以便于重复选择同一个文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // 触发文件选择对话框
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 统一处理图片文件
  const processImageFile = (file: File) => {
    if (!file || isProcessing) return;
    
    setIsProcessing(true);
    setResultVisible(false); // 新识别过程开始时隐藏结果区域
    showStatus('图片已捕获，正在处理...', 'info');
    setPasteAreaText('图片已捕获，处理中...');

    const reader = new FileReader();
    reader.onload = async function(e) {
      const result = e.target?.result as string;
      setImageBase64(result);
      
      // 设置预览图片
      setPreviewSrc(result);
      setPreviewVisible(true);
      
      setOcrResult('');
      setCanCopy(false);

      await sendToN8n(result);
    };
    
    reader.onerror = function() {
      showStatus('无法读取图片文件', 'danger');
      resetPasteArea();
      setIsProcessing(false);
    };
    
    reader.readAsDataURL(file);
  };

  const sendToN8n = async (imageBase64: string) => {
    // 检查webhook URL是否有效
    if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL.includes('YOUR_N8N_WEBHOOK_URL')) {
      showStatus('错误: 请在JS代码中配置你的n8n Webhook URL', 'danger', 10000);
      resetPasteArea();
      setIsProcessing(false);
      return;
    }

    // 验证图片格式
    if (!isValidBase64Image(imageBase64)) {
      showStatus('错误: 无效的图片格式', 'danger', 5000);
      resetPasteArea();
      setIsProcessing(false);
      return;
    }

    showStatus('正在发送到n8n进行文字识别...', 'info');

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: imageBase64,
          fileName: `image_${Date.now()}.png` // 可选的文件名
        }),
      });

      if (response.ok) {
        const resultData = await response.json();
        if (resultData && typeof resultData.extractedText !== 'undefined') {
          // 解码 URL 编码的文本
          let decodedText = '';
          try {
            decodedText = decodeURIComponent(resultData.extractedText);
          } catch (e) {
            // 如果解码失败 (例如，文本不是有效的URL编码格式), 仍然使用原始文本
            console.warn('解码 extractedText 失败，可能它不是URL编码的:', e);
            decodedText = resultData.extractedText;
          }
          setOcrResult(decodedText);
          setCanCopy(decodedText.length > 0);
          setResultVisible(decodedText.length > 0); // 只在有识别结果时显示结果区域
          showStatus('文字识别成功！', 'success', 3000);
        } else {
          throw new Error('n8n返回的响应格式不正确，缺少 extractedText 字段');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`n8n处理错误 ${response.status}: ${errorText || response.statusText}`);
      }
    } catch (error: any) {
      console.error('发送到n8n或处理响应时出错:', error);
      setOcrResult('');
      setCanCopy(false);
      setResultVisible(false);
      showStatus(`错误: ${error.message}`, 'danger', 7000);
    } finally {
      resetPasteArea();
      setIsProcessing(false);
    }
  };

  const resetPasteArea = () => {
    setPasteAreaText('拖拽图片到此处，点击选择文件，或粘贴图片 (Ctrl+V / Cmd+V)');
  };

  const copyToClipboard = async () => {
    if (!ocrResult) {
      showStatus('没有文字可复制', 'info', 3000);
      return;
    }

    try {
      await navigator.clipboard.writeText(ocrResult);
      showStatus('文字已复制到剪贴板！', 'success', 3000);
    } catch (err) {
      console.error('复制失败:', err);
      showStatus('复制失败。您的浏览器可能不支持或权限不足', 'danger', 5000);
      // 可以考虑提供一个备选方案，比如手动选择文本
      tryManualCopy();
    }
  };

  const tryManualCopy = () => {
    // 尝试选中文字让用户手动复制
    const selection = window.getSelection();
    const range = document.createRange();
    const ocrResultElement = document.getElementById('ocrResult');
    
    if (ocrResultElement && selection) {
      range.selectNodeContents(ocrResultElement);
      selection.removeAllRanges();
      selection.addRange(range);
      showStatus('无法自动复制，请手动复制选中的文本 (Ctrl+C / Cmd+C)', 'info', 7000);
    }
  };

  const showStatus = (message: string, type = 'info', duration = 0) => {
    setStatusMessage({ message, type });

    if (duration > 0) {
      setTimeout(() => {
        setStatusMessage(null);
      }, duration);
    }
  };

  return (
    <>
      <Head>
        <title>图片文字识别 - OCR工具</title>
        <meta name="description" content="使用AI技术识别图片中的文字" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="bg-light min-vh-100 py-4">
        <Container>
          <Row className="justify-content-center">
            <Col md={10} lg={8}>
              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <h1 className="text-center mb-4 h3">智能文字识别工具</h1>
                  
                  {/* 隐藏的文件输入 */}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={handleFileSelect}
                  />
                  
                  <div 
                    className={`
                      d-flex flex-column 
                      justify-content-center 
                      align-items-center 
                      text-center 
                      p-4 
                      mb-4
                      rounded
                      bg-white
                      ${isDragging ? 'border-primary' : 'border'}
                      border-2
                      border-dashed
                      position-relative
                    `}
                    style={{ 
                      minHeight: "180px", 
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out" 
                    }}
                    onClick={triggerFileInput}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    ref={pasteAreaRef}
                  >
                    <div className="display-4 mb-2 text-muted">
                      {isDragging ? '📥' : '📷'}
                    </div>
                    <div className="text-muted">
                      {pasteAreaText}
                    </div>
                    
                    {isProcessing && (
                      <div className="position-absolute top-0 start-0 w-100 h-100 bg-white bg-opacity-75 rounded d-flex flex-column justify-content-center align-items-center">
                        <Spinner animation="border" variant="secondary" className="mb-2" />
                        <span className="text-muted">处理中...</span>
                      </div>
                    )}
                  </div>

                  {previewVisible && previewSrc && (
                    <div className="text-center mb-4">
                      <img 
                        src={previewSrc}
                        alt="图片预览"
                        className="img-fluid rounded border"
                        style={{ maxHeight: "300px" }} 
                      />
                    </div>
                  )}

                  {resultVisible && (
                    <div className="mt-4">
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">识别结果:</Form.Label>
                        <div 
                          id="ocrResult"
                          className="form-control bg-light"
                          style={{ 
                            minHeight: '120px', 
                            whiteSpace: 'pre-wrap', 
                            fontFamily: 'monospace',
                            overflow: 'auto'
                          }}
                        >
                          {ocrResult}
                        </div>
                      </Form.Group>
                      
                      <Button 
                        variant="secondary" 
                        onClick={copyToClipboard}
                        disabled={!canCopy}
                        className="mt-1"
                      >
                        复制文字
                      </Button>
                    </div>
                  )}

                  {statusMessage && (
                    <Alert 
                      variant={statusMessage.type}
                      className="mt-4 mb-0"
                    >
                      {statusMessage.message}
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
} 