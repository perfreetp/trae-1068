import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Tabs,
  Input,
  Select,
  Table,
  Tag,
  message,
  Divider,
  Spin,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useApiStore } from '@/store/apiStore';
import { ApiMethodTag } from '@/components/ApiMethodTag';
import { copyToClipboard, formatRelativeTime, getMethodBgColor, getMethodColor } from '@/utils/helpers';
import { HttpMethod } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;
const { Option } = Select;

interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
  id: string;
}

const Debug = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getApiById, debugHistory, addDebugHistory } = useApiStore();

  const api = useMemo(() => (id ? getApiById(id) : undefined), [id, getApiById]);
  
  const [method, setMethod] = useState<HttpMethod>(api?.method || 'GET');
  const [url, setUrl] = useState(api ? `https://api.example.com${api.path}` : '');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [responseTime, setResponseTime] = useState(0);

  const [headers, setHeaders] = useState<KeyValuePair[]>(() =>
    api?.request.headers.map((h, i) => ({
      id: `h${i}`,
      key: h.name,
      value: h.example,
      enabled: true,
    })) || [{ id: 'h0', key: '', value: '', enabled: true }]
  );

  const [queryParams, setQueryParams] = useState<KeyValuePair[]>(() =>
    api?.request.query.map((q, i) => ({
      id: `q${i}`,
      key: q.name,
      value: q.example,
      enabled: true,
    })) || [{ id: 'q0', key: '', value: '', enabled: true }]
  );

  const [bodyTab, setBodyTab] = useState<'none' | 'json' | 'form'>('json');
  const [bodyJson, setBodyJson] = useState(() => {
    if (api?.request.body.length) {
      const obj: Record<string, any> = {};
      api.request.body.forEach((p) => {
        obj[p.name] = p.example;
      });
      return JSON.stringify(obj, null, 2);
    }
    return '{\n  \n}';
  });
  const [formData, setFormData] = useState<KeyValuePair[]>([{ id: 'f0', key: '', value: '', enabled: true }]);

  const handleAddRow = (setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>) => {
    setter((prev) => [...prev, { id: `${Date.now()}`, key: '', value: '', enabled: true }]);
  };

  const handleRemoveRow = (setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>, id: string) => {
    setter((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateRow = (
    setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>,
    id: string,
    field: keyof KeyValuePair,
    value: any
  ) => {
    setter((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const paramColumns: ColumnsType<KeyValuePair> = [
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 60,
      render: (_, record) => (
        <input
          type="checkbox"
          checked={record.enabled}
          onChange={(e) => handleUpdateRow(setHeaders, record.id, 'enabled', e.target.checked)}
        />
      ),
    },
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      render: (text, record) => (
        <Input
          size="small"
          value={text}
          onChange={(e) => handleUpdateRow(setHeaders, record.id, 'key', e.target.value)}
          placeholder="Key"
        />
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (text, record) => (
        <Input
          size="small"
          value={text}
          onChange={(e) => handleUpdateRow(setHeaders, record.id, 'value', e.target.value)}
          placeholder="Value"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveRow(setHeaders, record.id)}
        />
      ),
    },
  ];

  const handleSend = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 500));
    
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'req-' + Date.now(),
      },
      data: api?.response.success.data || {
        code: 0,
        message: 'success',
        data: { id: 1, name: 'Mock Data' },
      },
    };
    
    setResponse(mockResponse);
    setResponseTime(Date.now() - startTime);
    setLoading(false);

    addDebugHistory({
      apiId: id || '',
      name: api?.name || '未命名',
      method,
      url,
      request: {
        headers: Object.fromEntries(headers.filter((h) => h.enabled && h.key).map((h) => [h.key, h.value])),
        query: Object.fromEntries(queryParams.filter((q) => q.enabled && q.key).map((q) => [q.key, q.value])),
        body: bodyTab === 'json' ? bodyJson : formData,
      },
      response: {
        ...mockResponse,
        duration: Date.now() - startTime,
      },
    });

    message.success('请求完成');
  };

  const handleSave = () => {
    message.success('调试参数已保存');
  };

  const handleCopyResponse = async () => {
    if (response) {
      const success = await copyToClipboard(JSON.stringify(response.data, null, 2));
      if (success) message.success('已复制响应数据');
    }
  };

  if (!api) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">接口不存在</p>
        <Button type="primary" onClick={() => navigate('/api')}>返回列表</Button>
      </div>
    );
  }

  const historyItems = debugHistory.filter((h) => h.apiId === id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/api/${id}`)}>
            返回详情
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <ApiMethodTag method={api.method} />
              <h1 className="text-xl font-bold m-0">{api.name} - 在线调试</h1>
            </div>
          </div>
        </div>
        <Space>
          <Button icon={<SaveOutlined />} onClick={handleSave}>保存参数</Button>
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading}>
            发送请求
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-12 gap-4" style={{ minHeight: 'calc(100vh - 220px)' }}>
        <div className="col-span-8 space-y-4">
          <Card size="small">
            <div className="flex gap-2">
              <Select
                value={method}
                onChange={setMethod as any}
                style={{ width: 120 }}
                size="large"
              >
                {(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as HttpMethod[]).map((m) => (
                  <Option key={m} value={m} style={{ color: getMethodColor(m), fontWeight: 600 }}>
                    {m}
                  </Option>
                ))}
              </Select>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                size="large"
                placeholder="请求 URL"
                className="flex-1"
              />
            </div>
          </Card>

          <Card size="small" title="请求参数" bodyStyle={{ padding: 0 }}>
            <Tabs
              items={[
                {
                  key: 'headers',
                  label: `Headers`,
                  children: (
                    <div className="p-4">
                      <Table
                        columns={paramColumns}
                        dataSource={headers}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        showHeader={false}
                      />
                      <Button
                        type="dashed"
                        block
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => handleAddRow(setHeaders)}
                        className="mt-2"
                      >
                        添加 Header
                      </Button>
                    </div>
                  ),
                },
                {
                  key: 'query',
                  label: 'Query Params',
                  children: (
                    <div className="p-4">
                      <Table
                        columns={paramColumns.map((c) => ({
                          ...c,
                          render: c.key === 'enabled'
                            ? c.render
                            : c.key === 'action'
                            ? (_, record) => (
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleRemoveRow(setQueryParams, record.id)}
                                />
                              )
                            : (text, record) => (
                                <Input
                                  size="small"
                                  value={text}
                                  onChange={(e) =>
                                    handleUpdateRow(setQueryParams, record.id, c.key as any, e.target.value)
                                  }
                                  placeholder={c.title as string}
                                />
                              ),
                        }))}
                        dataSource={queryParams}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        showHeader={false}
                      />
                      <Button
                        type="dashed"
                        block
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => handleAddRow(setQueryParams)}
                        className="mt-2"
                      >
                        添加参数
                      </Button>
                    </div>
                  ),
                },
                {
                  key: 'body',
                  label: 'Body',
                  children: (
                    <div className="p-4">
                      <div className="mb-3">
                        <Select value={bodyTab} onChange={setBodyTab as any} style={{ width: 150 }} size="small">
                          <Option value="none">none</Option>
                          <Option value="json">JSON</Option>
                          <Option value="form">form-data</Option>
                        </Select>
                      </div>
                      {bodyTab === 'json' && (
                        <TextArea
                          value={bodyJson}
                          onChange={(e) => setBodyJson(e.target.value)}
                          rows={12}
                          className="font-mono text-sm"
                          placeholder="请求体 JSON"
                        />
                      )}
                      {bodyTab === 'form' && (
                        <div>
                          <Table
                            columns={paramColumns.map((c) => ({
                              ...c,
                              render: c.key === 'enabled'
                                ? c.render
                                : c.key === 'action'
                                ? (_, record) => (
                                    <Button
                                      type="text"
                                      size="small"
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() => handleRemoveRow(setFormData, record.id)}
                                    />
                                  )
                                : (text, record) => (
                                    <Input
                                      size="small"
                                      value={text}
                                      onChange={(e) =>
                                        handleUpdateRow(setFormData, record.id, c.key as any, e.target.value)
                                      }
                                      placeholder={c.title as string}
                                    />
                                  ),
                            }))}
                            dataSource={formData}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            showHeader={false}
                          />
                          <Button
                            type="dashed"
                            block
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => handleAddRow(setFormData)}
                            className="mt-2"
                          >
                            添加字段
                          </Button>
                        </div>
                      )}
                      {bodyTab === 'none' && (
                        <div className="text-center text-gray-400 py-8">此请求无 Body</div>
                      )}
                    </div>
                  ),
                },
              ]}
              size="small"
            />
          </Card>

          <Card
            size="small"
            title={
              <div className="flex items-center justify-between">
                <span>响应结果</span>
                <Space>
                  {response && (
                    <>
                      <Tag color={response.status < 300 ? 'green' : 'red'}>
                        {response.status} {response.statusText}
                      </Tag>
                      <span className="text-gray-500 text-sm">{responseTime}ms</span>
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={handleCopyResponse}
                      >
                        复制
                      </Button>
                    </>
                  )}
                </Space>
              </div>
            }
          >
            {loading ? (
              <div className="flex justify-center py-12">
                <Spin tip="请求中..." />
              </div>
            ) : response ? (
              <div>
                <Tabs
                  items={[
                    {
                      key: 'body',
                      label: '响应体',
                      children: (
                        <div className="max-h-96 overflow-auto rounded-lg">
                          <SyntaxHighlighter
                            language="json"
                            style={oneDark}
                            customStyle={{ margin: 0, fontSize: 13 }}
                            showLineNumbers
                          >
                            {JSON.stringify(response.data, null, 2)}
                          </SyntaxHighlighter>
                        </div>
                      ),
                    },
                    {
                      key: 'headers',
                      label: '响应头',
                      children: (
                        <div className="space-y-2">
                          {Object.entries(response.headers).map(([k, v]) => (
                            <div key={k} className="flex text-sm">
                              <span className="w-40 text-gray-500">{k}:</span>
                              <span className="text-gray-800">{v as string}</span>
                            </div>
                          ))}
                        </div>
                      ),
                    },
                  ]}
                  size="small"
                />
              </div>
            ) : (
              <Empty description="点击发送按钮发起请求" />
            )}
          </Card>
        </div>

        <div className="col-span-4">
          <Card size="small" title="历史记录">
            {historyItems.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-auto">
                {historyItems.map((h) => (
                  <div
                    key={h.id}
                    className="p-2 rounded hover:bg-gray-50 cursor-pointer border"
                  >
                    <div className="flex items-center gap-2">
                      <Tag
                        color={getMethodColor(h.method)}
                        style={{
                          backgroundColor: getMethodBgColor(h.method),
                          border: 'none',
                          fontSize: 11,
                          padding: '0 4px',
                          margin: 0,
                        }}
                      >
                        {h.method}
                      </Tag>
                      <span className="text-sm truncate flex-1">{h.name}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatRelativeTime(h.createdAt)}
                      {h.response && (
                        <span className="ml-2">
                          <Tag color={h.response.status < 300 ? 'green' : 'red'} style={{ margin: 0, fontSize: 10 }}>
                            {h.response.status}
                          </Tag>
                          <span className="ml-1">{h.response.duration}ms</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无历史记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Debug;
