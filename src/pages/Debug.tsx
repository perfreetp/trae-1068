import { useState, useMemo, useEffect } from 'react';
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
  Modal,
  Form,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  SendOutlined,
  FolderOpenOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useApiStore } from '@/store/apiStore';
import { ApiMethodTag } from '@/components/ApiMethodTag';
import { copyToClipboard, formatRelativeTime, getMethodBgColor, getMethodColor } from '@/utils/helpers';
import { HttpMethod, DebugPreset } from '@/types';
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
  const { getApiById, debugHistory, addDebugHistory, getDebugPresetsByApiId, addDebugPreset, deleteDebugPreset, apis } = useApiStore();

  const api = useMemo(() => (id ? getApiById(id) : undefined), [id, getApiById]);
  const presets = useMemo(() => (id ? getDebugPresetsByApiId(id) : []), [id, getDebugPresetsByApiId]);
  
  const [selectedApiId, setSelectedApiId] = useState<string>(id || '');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [responseTime, setResponseTime] = useState(0);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [form] = Form.useForm();

  const [headers, setHeaders] = useState<KeyValuePair[]>([{ id: 'h0', key: '', value: '', enabled: true }]);
  const [queryParams, setQueryParams] = useState<KeyValuePair[]>([{ id: 'q0', key: '', value: '', enabled: true }]);
  const [bodyTab, setBodyTab] = useState<'none' | 'json' | 'form'>('json');
  const [bodyJson, setBodyJson] = useState('{\n  \n}');
  const [formData, setFormData] = useState<KeyValuePair[]>([{ id: 'f0', key: '', value: '', enabled: true }]);

  useEffect(() => {
    if (api) {
      setMethod(api.method);
      setUrl(`https://api.example.com${api.path}`);
      setSelectedApiId(api.id);
      
      if (api.request.headers.length > 0) {
        setHeaders(
          api.request.headers.map((h, i) => ({
            id: `h${i}`,
            key: h.name,
            value: h.example,
            enabled: true,
          }))
        );
      }
      
      if (api.request.query.length > 0) {
        setQueryParams(
          api.request.query.map((q, i) => ({
            id: `q${i}`,
            key: q.name,
            value: q.example,
            enabled: true,
          }))
        );
      }
      
      if (api.request.body.length > 0) {
        const obj: Record<string, any> = {};
        api.request.body.forEach((p) => {
          obj[p.name] = p.example;
        });
        setBodyJson(JSON.stringify(obj, null, 2));
        setBodyTab('json');
      }
    }
  }, [api]);

  const handleApiChange = (apiId: string) => {
    const selectedApi = getApiById(apiId);
    if (selectedApi) {
      navigate(`/debug/${apiId}`);
    }
  };

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

  const createColumns = (
    setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>
  ): ColumnsType<KeyValuePair> => [
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 60,
      render: (_, record) => (
        <input
          type="checkbox"
          checked={record.enabled}
          onChange={(e) => handleUpdateRow(setter, record.id, 'enabled', e.target.checked)}
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
          onChange={(e) => handleUpdateRow(setter, record.id, 'key', e.target.value)}
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
          onChange={(e) => handleUpdateRow(setter, record.id, 'value', e.target.value)}
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
          onClick={() => handleRemoveRow(setter, record.id)}
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
      apiId: selectedApiId || '',
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

  const handleSavePreset = () => {
    if (selectedApiId) {
      addDebugPreset({
        apiId: selectedApiId,
        name: presetName || '未命名方案',
        method,
        url,
        bodyTab,
        headers: headers.map((h) => ({ key: h.key, value: h.value, enabled: h.enabled })),
        queryParams: queryParams.map((q) => ({ key: q.key, value: q.value, enabled: q.enabled })),
        bodyJson,
        formData: formData.map((f) => ({ key: f.key, value: f.value, enabled: f.enabled })),
        ownerId: 'user-1',
        isShared: false,
      });
      setSaveModalVisible(false);
      setPresetName('');
      message.success('方案已保存');
    } else {
      message.warning('请先选择接口');
    }
  };

  const handleLoadPreset = (preset: DebugPreset) => {
    setMethod(preset.method);
    setUrl(preset.url);
    setBodyTab(preset.bodyTab);
    setHeaders(preset.headers.map((h, i) => ({ ...h, id: `h${i}-${Date.now()}` })));
    setQueryParams(preset.queryParams.map((q, i) => ({ ...q, id: `q${i}-${Date.now()}` })));
    setBodyJson(preset.bodyJson);
    setFormData(preset.formData.map((f, i) => ({ ...f, id: `f${i}-${Date.now()}` })));
    message.success('已加载方案');
  };

  const handleDeletePreset = (id: string) => {
    deleteDebugPreset(id);
    message.success('方案已删除');
  };

  const handleCopyResponse = async () => {
    if (response) {
      const success = await copyToClipboard(JSON.stringify(response.data, null, 2));
      if (success) message.success('已复制响应数据');
    }
  };

  const historyItems = debugHistory.filter((h) => h.apiId === selectedApiId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(selectedApiId ? `/api/${selectedApiId}` : '/api')}>
            返回
          </Button>
          <div>
            <div className="flex items-center gap-2">
              {api && <ApiMethodTag method={api.method} />}
              <h1 className="text-xl font-bold m-0">{api ? `${api.name} - ` : ''}</h1>
              <span className="text-gray-500">在线调试</span>
            </div>
          </div>
        </div>
        <Space>
          <Select
            value={selectedApiId}
            onChange={handleApiChange}
            style={{ width: 200 }}
            size="small"
            placeholder="选择接口"
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {apis.map((a) => (
              <Option key={a.id} value={a.id}>
                <span className="flex items-center gap-2">
                  <Tag color={getMethodColor(a.method)} style={{ backgroundColor: getMethodBgColor(a.method), border: 'none', fontSize: 11, padding: '0 4px' }}>
                    {a.method}
                  </Tag>
                  {a.name}
                </span>
              </Option>
            ))}
          </Select>
          <Button icon={<SaveOutlined />} onClick={() => setSaveModalVisible(true)}>保存方案</Button>
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
                        columns={createColumns(setHeaders)}
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
                        columns={createColumns(setQueryParams)}
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
                            columns={createColumns(setFormData)}
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

        <div className="col-span-4 space-y-4">
          <Card size="small" title={<span className="flex items-center gap-2"><FolderOpenOutlined />调试方案</span>} extra={<Button type="link" size="small" icon={<PlusOutlined />} onClick={() => setSaveModalVisible(true)}>新建</Button>}>
            {presets.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-auto">
                {presets.map((p) => (
                  <div key={p.id} className="p-2 rounded hover:bg-gray-50 border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Tag
                          color={getMethodColor(p.method)}
                          style={{ backgroundColor: getMethodBgColor(p.method), border: 'none', fontSize: 10, padding: '0 4px', margin: 0 }}
                        >
                          {p.method}
                        </Tag>
                        <span className="text-sm font-medium truncate flex-1">{p.name}</span>
                      </div>
                      <Space size="small">
                        <Tooltip title="加载方案">
                          <Button type="text" size="small" icon={<PlayCircleOutlined />} onClick={() => handleLoadPreset(p)} />
                        </Tooltip>
                        <Popconfirm title="确定删除此方案？" onConfirm={() => handleDeletePreset(p.id)}>
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{formatRelativeTime(p.updatedAt)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无保存的方案" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-4" />
            )}
          </Card>

          <Card size="small" title="历史记录">
            {historyItems.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-auto">
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

      <Modal
        title="保存调试方案"
        open={saveModalVisible}
        onCancel={() => setSaveModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSaveModalVisible(false)}>取消</Button>,
          <Button key="save" type="primary" onClick={handleSavePreset}>保存</Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="方案名称" required>
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="请输入方案名称"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Debug;
