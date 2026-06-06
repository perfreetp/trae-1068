import { useState, useEffect, useMemo, useRef } from 'react';
import {
  List,
  Input,
  Button,
  Avatar,
  Tag,
  Select,
  Space,
  message,
  Tooltip,
  Mentions,
  Badge,
  Divider,
} from 'antd';
import {
  SendOutlined,
  CommentOutlined,
  EyeOutlined,
  FilterOutlined,
  CloseOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Comment, Member } from '@/types';
import { useApiStore } from '@/store/apiStore';
import { useUserStore } from '@/store/userStore';
import { formatRelativeTime } from '@/utils/helpers';
import { useSearchParams } from 'react-router-dom';

const { TextArea } = Input;
const { Option } = Mentions;

interface CommentListProps {
  apiId: string;
}

const CommentList = ({ apiId }: CommentListProps) => {
  const { comments: allComments, addApiComment, markNotificationRead } = useApiStore();
  const { currentUser, members } = useUserStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showOnlyMentions, setShowOnlyMentions] = useState(false);
  const [mentionTargetIds, setMentionTargetIds] = useState<string[]>([]);
  const [replyMentionTargetIds, setReplyMentionTargetIds] = useState<string[]>([]);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const comments = useMemo(() => allComments.filter((c) => c.apiId === apiId), [allComments, apiId]);

  const parentComments = useMemo(() => comments.filter((c) => !c.parentId), [comments]);

  const getReplies = (parentId: string) => {
    return comments.filter((c) => c.parentId === parentId);
  };

  const filteredComments = useMemo(() => {
    if (!showOnlyMentions || !currentUser) return parentComments;

    return parentComments.filter((comment) => {
      if (comment.mentionedUserIds?.includes(currentUser.id)) return true;
      const replies = getReplies(comment.id);
      return replies.some((r) => r.mentionedUserIds?.includes(currentUser.id));
    });
  }, [parentComments, showOnlyMentions, currentUser]);

  useEffect(() => {
    const commentIdParam = searchParams.get('commentId');
    const notificationId = searchParams.get('notificationId');
    if (commentIdParam) {
      setHighlightedCommentId(commentIdParam);
      setTimeout(() => {
        const element = commentRefs.current[commentIdParam];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (notificationId) {
          markNotificationRead(notificationId);
        }
      }, 300);
      setTimeout(() => {
        setHighlightedCommentId(null);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('commentId');
        newParams.delete('notificationId');
        setSearchParams(newParams, { replace: true });
      }, 5000);
    }
  }, [searchParams]);

  const handleSubmitComment = () => {
    if (!commentText.trim()) {
      message.warning('请输入评论内容');
      return;
    }
    addApiComment({
      apiId,
      userId: currentUser?.id || '',
      author: currentUser?.id || '',
      content: commentText,
      mentionedUserIds: mentionTargetIds,
      mentions: mentionTargetIds,
      parentId: undefined,
    });
    setCommentText('');
    setMentionTargetIds([]);
    message.success('评论已发送');
  };

  const handleReply = (parentId: string, replyToUserId: string) => {
    setReplyingTo(parentId);
    setReplyText('');
    setReplyMentionTargetIds([replyToUserId]);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
    setReplyMentionTargetIds([]);
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyText.trim()) {
      message.warning('请输入回复内容');
      return;
    }
    addApiComment({
      apiId,
      userId: currentUser?.id || '',
      author: currentUser?.id || '',
      content: replyText,
      mentionedUserIds: replyMentionTargetIds,
      mentions: replyMentionTargetIds,
      parentId,
    });
    handleCancelReply();
    message.success('回复已发送');
  };

  const getMemberName = (userId: string) => {
    const member = members.find((m) => m.id === userId);
    return member?.name || '未知成员';
  };

  const getMember = (userId: string) => {
    return members.find((m) => m.id === userId);
  };

  const renderCommentItem = (comment: Comment, isReply = false) => {
    const member = getMember(comment.userId);
    const isHighlighted = highlightedCommentId === comment.id;
    const replies = isReply ? [] : getReplies(comment.id);

    return (
      <div
        key={comment.id}
        ref={(el) => (commentRefs.current[comment.id] = el)}
        className={`relative transition-all duration-500 ${
          isHighlighted ? 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50 rounded-lg' : ''
        } ${isReply ? 'ml-12 mt-2' : ''}`}
      >
        {isHighlighted && (
          <Badge
            status="processing"
            text="新消息"
            className="absolute -top-2 -right-2 z-10"
          />
        )}
        <List.Item>
          <div className="w-full">
            <div className="flex items-start gap-3">
              <Avatar src={member?.avatar} icon={<CommentOutlined />} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{member?.name || '未知成员'}</span>
                  <Tag color="purple" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                    {member?.role || '成员'}
                  </Tag>
                  {comment.mentionedUserIds && comment.mentionedUserIds.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <span className="text-blue-500 font-bold">@</span>
                      {comment.mentionedUserIds.map((uid) => getMemberName(uid)).join(', ')}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{comment.content}</p>
                {!isReply && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="text"
                      size="small"
                      icon={<CommentOutlined />}
                      onClick={() => handleReply(comment.id, comment.userId)}
                    >
                      回复
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {replyingTo === comment.id && !isReply && (
              <div className="ml-12 mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    回复 <span className="text-blue-500">@{getMemberName(comment.userId)}</span>
                  </span>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={handleCancelReply}
                  />
                </div>
                <Mentions
                  value={replyText}
                  onChange={(value) => setReplyText(value)}
                  onSelect={(option) => {
                    if (option && option.value) {
                      setReplyMentionTargetIds((prev) =>
                        prev.includes(option.value as string) ? prev : [...prev, option.value as string]
                      );
                    }
                  }}
                  placeholder="输入回复内容，@提及成员"
                  rows={3}
                >
                  {members.map((m) => (
                    <Option key={m.id} value={m.id}>
                      {m.name}
                    </Option>
                  ))}
                </Mentions>
                <div className="flex justify-end mt-2">
                  <Button type="primary" size="small" icon={<SendOutlined />} onClick={() => handleSubmitReply(comment.id)}>
                    发送回复
                  </Button>
                </div>
              </div>
            )}

            {replies.length > 0 && (
              <div className="mt-2">
                {replies.map((reply) => renderCommentItem(reply, true))}
              </div>
            )}
          </div>
        </List.Item>
      </div>
    );
  };

  return (
    <div id="comments-section" className="pt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CommentOutlined />
          评论讨论 ({comments.length})
        </h3>
        <Space>
          <Button
            type={showOnlyMentions ? 'primary' : 'default'}
            size="small"
            icon={<UserOutlined />}
            onClick={() => setShowOnlyMentions(!showOnlyMentions)}
          >
            只看 @ 我的
          </Button>
        </Space>
      </div>

      <div className="mb-4 flex gap-3">
        <Avatar src={currentUser?.avatar} icon={<CommentOutlined />} />
        <div className="flex-1">
          <Mentions
            value={commentText}
            onChange={(value) => setCommentText(value)}
            onSelect={(option) => {
              if (option && option.value) {
                setMentionTargetIds((prev) =>
                  prev.includes(option.value as string) ? prev : [...prev, option.value as string]
                );
              }
            }}
            placeholder="输入评论内容，@可以提及成员"
            rows={3}
          >
            {members.map((m) => (
              <Option key={m.id} value={m.id}>
                {m.name}
              </Option>
            ))}
          </Mentions>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-400">
              提示：输入 @ 可以提及相关成员，被提及的人会收到通知
            </span>
            <Button type="primary" icon={<SendOutlined />} onClick={handleSubmitComment}>
              发表评论
            </Button>
          </div>
        </div>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <List
        dataSource={filteredComments}
        locale={{ emptyText: showOnlyMentions ? '没有 @ 我的评论' : '暂无评论，快来发表第一条评论吧' }}
        renderItem={(comment) => renderCommentItem(comment)}
        split={true}
      />
    </div>
  );
};

export default CommentList;
