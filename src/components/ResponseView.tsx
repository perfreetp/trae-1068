import { useState } from 'react';
import { Tabs, Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ResponseExample } from '@/types';
import { copyToClipboard } from '@/utils/helpers';

interface ResponseViewProps {
  success: ResponseExample;
  error?: ResponseExample[];
}

const ResponseView = ({ success, error = [] }: ResponseViewProps) => {
  const items = [
    {
      key: 'success',
      label: `成功响应 (${success.statusCode})`,
      children: <ResponseContent data={success} />,
    },
    ...error.map((e, i) => ({
      key: `error-${i}`,
      label: `${e.name} (${e.statusCode})`,
      children: <ResponseContent data={e} />,
    })),
  ];

  return <Tabs items={items} size="small" />;
};

const ResponseContent = ({ data }: { data: ResponseExample }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(JSON.stringify(data.data, null, 2));
    if (success) {
      setCopied(true);
      message.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
        <span className="text-gray-600 text-sm">{data.description}</span>
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          onClick={handleCopy}
        >
          {copied ? '已复制' : '复制'}
        </Button>
      </div>
      <div className="max-h-96 overflow-auto">
        <SyntaxHighlighter
          language="json"
          style={oneDark}
          customStyle={{ margin: 0, borderRadius: 0, fontSize: 13 }}
          showLineNumbers
        >
          {JSON.stringify(data.data, null, 2)}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default ResponseView;
