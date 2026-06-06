import { useState } from 'react';
import { Avatar, Input, Button, List, message, Mentions } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { Comment } from '@/types';
import { useUserStore } from '@/store/userStore';
import { useApiStore } from '@/store/apiStore';
import { formatRelativeTime } from '@/utils/helpers';

const { TextArea } = Input;

interface CommentListProps {
  apiId: string;
}

const CommentList = ({ apiId }: CommentListProps) => {
  const { members, currentUser } = useUserStore();
  const { getCommentsByApiId, addComment } = useApiStore();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const comments = getCommentsByApiId(apiId);
  const memberOptions = members.map((m) => ({ value: m.name, key: m.id }));

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    
    const mentions: string[] = [];
    members.forEach((m) => {
      if (content.includes(`@${m.name}`)) {
        mentions.push(m.id);
      }
    });

    addComment({
      apiId,
      content,
      author: currentUser.id,
      mentions,
    });

    setContent('');
    setSubmitting(false);
    message.success('评论已发送');
  };

  const getMember = (id: string) => members.find((m) => m.id === id);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">评论讨论 ({comments.length})</h3>
      
      <List
        dataSource={comments}
        renderItem={(comment) => {
          const author = getMember(comment.author);
          return (
            <List.Item key={comment.id} className="px-0">
              <div className="flex gap-3 w-full">
                <Avatar src={author?.avatar} size={36}>
                  {author?.name[0]}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{author?.name}</span>
                    <span className="text-gray-400 text-xs">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 mt-1 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            </List.Item>
          );
        }}
      />

      <div className="flex gap-3">
        <Avatar src={currentUser.avatar} size={36}>
          {currentUser.name[0]}
        </Avatar>
        <div className="flex-1 space-y-2">
          <Mentions
            value={content}
            onChange={setContent as any}
            options={memberOptions}
            prefix="@"
            placeholder="输入评论，@ 提及成员..."
            autoSize={{ minRows: 2, maxRows: 6 }}
          />
          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={submitting}
              disabled={!content.trim()}
            >
              发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentList;
