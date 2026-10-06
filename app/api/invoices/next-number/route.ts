import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { peekNextInvoiceNumber } from "@/lib/invoice/service";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const nextNumber = await peekNextInvoiceNumber();
    return NextResponse.json({ nextInvoiceNumber: nextNumber });
  } catch (error) {
    console.error("Error fetching next invoice number:", error);
    return NextResponse.json({ error: "Failed to fetch next invoice number." }, { status: 500 });
  }
}
