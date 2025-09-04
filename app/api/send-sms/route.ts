import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request) {
  const { to, message } = await req.json();
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json(
      { success: false, error: "Twilio config missing" },
      { status: 500 }
    );
  }

  try {
    const client = twilio(accountSid, authToken);
    const sms = await client.messages.create({
      body: message,
      from: fromNumber,
      to,
    });
    return NextResponse.json({
      success: true,
      sid: sms.sid,
      message: "SMS enviado com sucesso!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Erro ao enviar SMS" },
      { status: 500 }
    );
  }
}
