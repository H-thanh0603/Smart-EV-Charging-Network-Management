import { z } from "zod";
import { NextResponse } from "next/server";

/**
 * Parse + validate request body theo schema Zod.
 * Trả về { ok: true, data } hoặc { ok: false, response } để route trả thẳng lỗi 400.
 */
export async function parseBody<T extends z.ZodType>(
  req: Request,
  schema: T
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Body không hợp lệ (không phải JSON)" }, { status: 400 }),
    };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const msg = result.error.issues[0]?.message || "Dữ liệu không hợp lệ";
    return { ok: false, response: NextResponse.json({ error: msg }, { status: 400 }) };
  }
  return { ok: true, data: result.data };
}

// ----- Schemas dùng chung -----

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").max(100),
  name: z.string().trim().min(1, "Thiếu tên").max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  password: z.string().min(1, "Thiếu mật khẩu"),
});

export const reservationSchema = z
  .object({
    slotId: z.string().min(1, "Thiếu slotId"),
    startTime: z.coerce.date({ message: "startTime không hợp lệ" }),
    endTime: z.coerce.date({ message: "endTime không hợp lệ" }),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "endTime phải sau startTime",
    path: ["endTime"],
  });

export const walletTopupSchema = z.object({
  amount: z.coerce
    .number({ message: "Số tiền không hợp lệ" })
    .int("Số tiền phải là số nguyên")
    .min(10000, "Nạp tối thiểu 10.000đ")
    .max(50000000, "Nạp tối đa 50.000.000đ"),
  bankCode: z.string().trim().max(20).optional(),
});

export const voucherValidateSchema = z.object({
  code: z.string().trim().min(1, "Thiếu mã voucher").max(50),
  amount: z.coerce.number({ message: "Số tiền không hợp lệ" }).min(0),
});

export const invoicePaySchema = z.object({
  method: z.enum(["wallet"], { message: "Phương thức không hỗ trợ" }),
  voucherCode: z.string().trim().max(50).optional().or(z.literal("")),
  redeemPoints: z.coerce
    .number()
    .int("Điểm phải là số nguyên")
    .min(0)
    .refine((v) => v % 100 === 0, { message: "Điểm quy đổi phải là bội số của 100" })
    .optional()
    .default(0),
});
