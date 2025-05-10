import Head from 'next/head';
import { useRef, useState, useEffect } from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { isValidBase64Image } from '../utils/imageUtils';

export default function Home() {
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [ocrResult, setOcrResult] = useState('');
  const [canCopy, setCanCopy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{message: string, type: string} | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // n8n Webhook URL
  const N8N_WEBHOOK_URL = 'https://n8n.judyplan.com/webhook/image-ocr';

  useEffect(() => {
    // 监听粘贴事件
    document.addEventListener('paste', handlePaste);
    
    // 初始化状态
    showStatus('准备就绪，请粘贴图片。', 'info', 5000);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handlePaste = async (event: ClipboardEvent) => {
    // 检查粘贴内容是否来自 contenteditable div 本身，如果是，则忽略
    if (event.target === pasteAreaRef.current) {
      // 清空 contenteditable div 的内容，避免图片直接渲染在里面
      setTimeout(() => { 
        if (pasteAreaRef.current) {
          pasteAreaRef.current.innerHTML = '处理中...请稍候'; 
        }
      }, 0);
    }

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
      showStatus('图片已捕获，正在处理...', 'info');
      
      if (pasteAreaRef.current) {
        pasteAreaRef.current.innerHTML = '图片已捕获，处理中...';
      }

      const reader = new FileReader();
      reader.onload = async function(e) {
        const result = e.target?.result as string;
        setImageBase64(result);
        
        // 直接设置预览图片的src
        setPreviewSrc(result);
        setPreviewVisible(true);
        
        setOcrResult('');
        setCanCopy(false);

        await sendToN8n(result);
      };
      
      reader.onerror = function() {
        showStatus('无法读取图片文件。', 'error');
        resetPasteArea();
      };
      
      reader.readAsDataURL(imageFile);
    } else {
      showStatus('粘贴的内容不是图片，请粘贴图片文件。', 'error', 4000);
      resetPasteArea();
    }
  };

  const sendToN8n = async (imageBase64: string) => {
    // 检查webhook URL是否有效
    if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL.includes('YOUR_N8N_WEBHOOK_URL')) {
      showStatus('错误: 请在JS代码中配置你的n8n Webhook URL!', 'error', 10000);
      resetPasteArea();
      return;
    }

    // 验证图片格式
    if (!isValidBase64Image(imageBase64)) {
      showStatus('错误: 无效的图片格式', 'error', 5000);
      resetPasteArea();
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
          fileName: `pasted_image_${Date.now()}.png` // 可选的文件名
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
          showStatus('文字识别成功！', 'success', 3000);
        } else {
          throw new Error('n8n返回的响应格式不正确，缺少 extractedText 字段。');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`n8n处理错误 ${response.status}: ${errorText || response.statusText}`);
      }
    } catch (error: any) {
      console.error('发送到n8n或处理响应时出错:', error);
      setOcrResult('');
      setCanCopy(false);
      showStatus(`错误: ${error.message}`, 'error', 7000);
    } finally {
      resetPasteArea();
    }
  };

  const resetPasteArea = () => {
    if (pasteAreaRef.current) {
      pasteAreaRef.current.innerHTML = '点击或在此处粘贴图片 (Ctrl+V / Cmd+V)';
    }
  };

  const copyToClipboard = async () => {
    if (!ocrResult) {
      showStatus('没有文字可复制。', 'info', 3000);
      return;
    }

    try {
      await navigator.clipboard.writeText(ocrResult);
      showStatus('文字已复制到剪贴板！', 'success', 3000);
    } catch (err) {
      console.error('复制失败:', err);
      showStatus('复制失败。您的浏览器可能不支持或权限不足。', 'error', 5000);
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
      showStatus('无法自动复制，请手动复制选中的文本 (Ctrl+C / Cmd+C)。', 'info', 7000);
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

  const handleAreaClick = () => {
    if (pasteAreaRef.current) {
      pasteAreaRef.current.focus();
      showStatus('请使用 Ctrl+V (或 Cmd+V) 粘贴图片。', 'info', 3000);
    }
  };

  const handleAreaFocus = () => {
    if (pasteAreaRef.current) {
      pasteAreaRef.current.classList.add('active');
    }
  };

  const handleAreaBlur = () => {
    if (pasteAreaRef.current) {
      pasteAreaRef.current.classList.remove('active');
    }
  };

  return (
    <>
      <Head>
        <title>粘贴图片进行文字识别</title>
        <meta name="description" content="粘贴图片识别文字的应用" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <div className="bg-white p-4 rounded shadow-sm">
              <h1 className="text-center mb-4">粘贴图片进行文字识别</h1>
              
              <div 
                id="pasteArea"
                ref={pasteAreaRef}
                className="border border-2 border-dashed rounded p-3 d-flex align-items-center justify-content-center text-center bg-light text-secondary mb-3"
                contentEditable="true"
                style={{ height: '150px', cursor: 'pointer' }}
                onClick={handleAreaClick}
                onFocus={handleAreaFocus}
                onBlur={handleAreaBlur}
              >
                点击或在此处粘贴图片 (Ctrl+V / Cmd+V)
              </div>

              {previewVisible && previewSrc && (
                <div className="text-center mb-3" id="previewContainer">
                  <img 
                    src={previewSrc}
                    className="img-fluid rounded border" 
                    alt="图片预览"
                    style={{ 
                      maxHeight: '300px', 
                      maxWidth: '100%',
                      display: 'inline-block' 
                    }} 
                  />
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="ocrResult" className="form-label">识别结果:</label>
                <div 
                  id="ocrResult"
                  className="form-control bg-light"
                  style={{ 
                    minHeight: '100px', 
                    whiteSpace: 'pre-wrap', 
                    fontFamily: 'monospace',
                  }}
                >
                  {ocrResult}
                </div>
              </div>

              <Button 
                variant="success" 
                onClick={copyToClipboard}
                disabled={!canCopy}
              >
                复制文字
              </Button>

              {statusMessage && (
                <Alert 
                  variant={statusMessage.type} 
                  className="mt-3 text-center"
                >
                  {statusMessage.message}
                </Alert>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
} 