import { NextResponse } from "next/server";
// Integração SMSDev

export async function POST(req: Request) {
  const { to, message } = await req.json();
  const smsdevKey = process.env.SMSDEV_KEY;
  if (!smsdevKey) {
    return NextResponse.json(
      { success: false, error: "SMSDev config missing" },
      { status: 500 }
    );
  }
  try {
    const res = await fetch("https://api.smsdev.com.br/send", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        key: smsdevKey,
        type: "text",
        number: to,
        msg: message,
      }).toString(),
    });
    const data = await res.json();
    if (data.status === "success" || data.result === "success") {
      return NextResponse.json({ success: true, id: data.id || data.id_send });
    } else {
      // Log detalhado do erro retornado pela SMSDev
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Erro ao enviar SMS",
          smsdev: data,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Erro ao enviar SMS" },
      { status: 500 }
    );
  }
}
