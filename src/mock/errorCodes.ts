import { ErrorCode } from '@/types';

export const mockErrorCodes: ErrorCode[] = [
  { code: '0', message: '成功', description: '请求成功', module: '通用' },
  { code: '10001', message: '手机号或密码错误', description: '登录时手机号或密码不正确', module: '用户认证' },
  { code: '10002', message: '账号已被锁定', description: '账号因多次登录失败或其他原因被锁定', module: '用户认证' },
  { code: '10003', message: '请先登录', description: '未登录或Token已过期', module: '用户认证' },
  { code: '10004', message: '手机号已被注册', description: '注册时手机号已存在', module: '用户认证' },
  { code: '10005', message: '验证码错误', description: '短信或图形验证码错误', module: '用户认证' },
  { code: '20001', message: '参数错误', description: '请求参数不合法', module: '订单' },
  { code: '20002', message: '商品库存不足', description: '下单时商品库存不足', module: '订单' },
  { code: '20003', message: '订单不存在', description: '查询的订单不存在', module: '订单' },
  { code: '20004', message: '订单状态不允许此操作', description: '当前订单状态无法执行该操作', module: '订单' },
  { code: '30001', message: '商品不存在', description: '查询的商品不存在或已下架', module: '商品' },
  { code: '30002', message: '商品已下架', description: '商品已下架无法购买', module: '商品' },
  { code: '40001', message: '支付失败', description: '支付过程中发生错误', module: '支付' },
  { code: '40002', message: '订单已支付', description: '订单已支付，请勿重复支付', module: '支付' },
  { code: '50000', message: '系统错误', description: '服务器内部错误', module: '系统' },
];
