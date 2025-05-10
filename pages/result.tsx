import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';

export default function Result() {
  const router = useRouter();
  const [resultText, setResultText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 从URL中获取文本参数
    if (router.query.text) {
      try {
        setResultText(decodeURIComponent(router.query.text as string));
      } catch (e) {
        console.error('解码文本失败:', e);
        setResultText(router.query.text as string);
      }
    }
  }, [router.query]);

  const copyText = async () => {
    if (!resultText) return;

    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
      alert('复制失败，请手动选择文本并复制');
    }
  };

  return (
    <>
      <Head>
        <title>识别结果</title>
        <meta name="description" content="图片文字识别结果" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <div className="bg-white p-4 rounded shadow-sm">
              <h1 className="text-center mb-4">识别结果</h1>
              
              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  value={resultText}
                  readOnly
                  style={{ height: '300px', fontFamily: 'monospace' }}
                />
              </Form.Group>
              
              <Button 
                variant="primary" 
                onClick={copyText}
                disabled={!resultText}
              >
                {copied ? '已复制!' : '点击复制'}
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
} 