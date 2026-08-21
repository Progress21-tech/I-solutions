import { NextRequest, NextResponse } from "next/server";
import {
  getCopilotResponse,
  toPatientRecordSummary,
  type CopilotMessage,
} from "@/lib/copilot";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, message, history } = body as {
      patientId: string;
      message: string;
      history: CopilotMessage[];
    };

    if (!patientId || !message) {
      return NextResponse.json(
        { error: "patientId and message are required" },
        { status: 400 }
      );
    }

    const record = toPatientRecordSummary(patientId);
    const result = await getCopilotResponse(record, history ?? [], message);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Copilot route error:", err);
    return NextResponse.json(
      { error: "Something went wrong processing your message." },
      { status: 500 }
    );
  }
}
