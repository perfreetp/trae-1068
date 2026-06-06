import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Param } from '@/types';

interface ParamTableProps {
  data: Param[];
}

const ParamTable = ({ data }: ParamTableProps) => {
  const columns: ColumnsType<Param> = [
    {
      title: '参数名',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string, record) => (
        <span className="font-medium">
          {record.required && <span className="text-red-500 mr-1">*</span>}
          {text}
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {type}
        </Tag>
      ),
    },
    {
      title: '是否必填',
      dataIndex: 'required',
      key: 'required',
      width: 100,
      render: (required: boolean) => (
        <Tag color={required ? 'red' : 'default'} style={{ margin: 0 }}>
          {required ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '示例值',
      dataIndex: 'example',
      key: 'example',
      width: 180,
      ellipsis: true,
      render: (text: string) => <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">{text || '-'}</code>,
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
  ];

  const getDataSource = (params: Param[], level = 0): (Param & { key: string; level: number })[] => {
    return params.flatMap((p) => [
      { ...p, key: p.id, level },
      ...(p.children ? getDataSource(p.children, level + 1) : []),
    ]);
  };

  const dataSource = getDataSource(data);

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      size="small"
      rowKey="key"
      expandable={{
        indentSize: 20,
        defaultExpandAllRows: true,
      }}
    />
  );
};

export default ParamTable;
