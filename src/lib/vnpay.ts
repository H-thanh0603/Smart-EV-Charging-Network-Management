import crypto from "crypto";

const TMN_CODE = process.env.VNPAY_TMN_CODE || "DEMOV210";
const HASH_SECRET = process.env.VNPAY_HASH_SECRET || "RAOEXHGTUKCREMHVKHQYHSXBVCNIKYEK";
const VNPAY_URL = process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const RETURN_URL = process.env.VNPAY_RETURN_URL || "http://localhost:3000/api/payments/vnpay/return";

function sortObject(obj: Record<string, any>) {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const k of keys) sorted[k] = encodeURIComponent(String(obj[k])).replace(/%20/g, "+");
  return sorted;
}

export function buildVNPayUrl(params: {
  txnRef: string;
  amount: number; // VND
  orderInfo: string;
  ipAddr: string;
  bankCode?: string;
}) {
  const date = new Date();
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const MM = String(date.getMinutes()).padStart(2, "0");
  const SS = String(date.getSeconds()).padStart(2, "0");
  const createDate = `${yy}${mm}${dd}${HH}${MM}${SS}`;

  const expire = new Date(date.getTime() + 15 * 60 * 1000);
  const ey = expire.getFullYear();
  const em = String(expire.getMonth() + 1).padStart(2, "0");
  const ed = String(expire.getDate()).padStart(2, "0");
  const eH = String(expire.getHours()).padStart(2, "0");
  const eM = String(expire.getMinutes()).padStart(2, "0");
  const eS = String(expire.getSeconds()).padStart(2, "0");
  const expireDate = `${ey}${em}${ed}${eH}${eM}${eS}`;

  const vnpParams: Record<string, any> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: TMN_CODE,
    vnp_Amount: params.amount * 100,
    vnp_CurrCode: "VND",
    vnp_TxnRef: params.txnRef,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: RETURN_URL,
    vnp_IpAddr: params.ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };
  if (params.bankCode) vnpParams.vnp_BankCode = params.bankCode;

  const sorted = sortObject(vnpParams);
  const signData = Object.entries(sorted).map(([k, v]) => `${k}=${v}`).join("&");
  const signed = crypto.createHmac("sha512", HASH_SECRET).update(signData).digest("hex");

  return `${VNPAY_URL}?${signData}&vnp_SecureHash=${signed}`;
}

export function verifyVNPayReturn(query: Record<string, string>): {
  valid: boolean;
  status: "success" | "failed" | "pending";
  txnRef: string;
  amount: number;
  responseCode: string;
  bankCode?: string;
  bankTranNo?: string;
} {
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = query;
  const sorted = sortObject(rest);
  const signData = Object.entries(sorted).map(([k, v]) => `${k}=${v}`).join("&");
  const expected = crypto.createHmac("sha512", HASH_SECRET).update(signData).digest("hex");

  return {
    valid: expected === vnp_SecureHash,
    status: rest.vnp_ResponseCode === "00" ? "success" : "failed",
    txnRef: rest.vnp_TxnRef,
    amount: parseInt(rest.vnp_Amount || "0") / 100,
    responseCode: rest.vnp_ResponseCode,
    bankCode: rest.vnp_BankCode,
    bankTranNo: rest.vnp_BankTranNo,
  };
}
