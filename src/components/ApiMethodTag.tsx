import { Tag } from 'antd';
import { HttpMethod } from '@/types';
import { getMethodColor, getMethodBgColor } from '@/utils/helpers';

interface ApiMethodTagProps {
  method: HttpMethod;
}

export const ApiMethodTag = ({ method }: ApiMethodTagProps) => {
  return (
    <Tag
      color={getMethodColor(method)}
      style={{
        backgroundColor: getMethodBgColor(method),
        border: 'none',
        borderRadius: 4,
        fontWeight: 600,
        minWidth: 56,
        textAlign: 'center',
        margin: 0,
      }}
    >
      {method}
    </Tag>
  );
};
