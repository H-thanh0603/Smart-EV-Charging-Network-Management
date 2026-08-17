import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVNPayUrl, verifyVNPayReturn } from "../src/lib/vnpay";

// Test chỉ dùng logic thuần (không DB) — đặt env cho vnpay module
process.env.VNPAY_TMN_CODE = "TESTCODE";
process.env.VNPAY_HASH_SECRET = "testsecret123";

function parseQuery(url: string) {
  const qs = url.split("?")[1];
  return Object.fromEntries(new URLSearchParams(qs));
}

test("buildVNPayUrl → verifyVNPayReturn roundtrip valid", () => {
  const url = buildVNPayUrl({ txnRef: "TXN1", amount: 100000, orderInfo: "Test", ipAddr: "127.0.0.1" });
  const query = parseQuery(url); // chứa vnp_SecureHash — verify tự bỏ hashType/hash
  const r = verifyVNPayReturn(query);
  assert.equal(r.valid, true);
  assert.equal(r.txnRef, "TXN1");
  assert.equal(r.amount, 100000);
});

test("sửa 1 param → valid=false", () => {
  const url = buildVNPayUrl({ txnRef: "TXN2", amount: 50000, orderInfo: "Test", ipAddr: "127.0.0.1" });
  const query = parseQuery(url);
  query.vnp_Amount = "99999999"; // tampered
  const r = verifyVNPayReturn({ ...query, vnp_ResponseCode: "00", vnp_TxnRef: "TXN2" });
  assert.equal(r.valid, false);
});

test("thiếu vnp_SecureHash → valid=false", () => {
  const url = buildVNPayUrl({ txnRef: "TXN3", amount: 10000, orderInfo: "Test", ipAddr: "127.0.0.1" });
  const query = parseQuery(url);
  delete query.vnp_SecureHash;
  const r = verifyVNPayReturn(query);
  assert.equal(r.valid, false);
});
