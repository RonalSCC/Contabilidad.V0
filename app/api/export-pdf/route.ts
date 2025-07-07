import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { accountingEntry } = await request.json()

    // Crear el HTML del asiento contable
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Asiento Contable ${accountingEntry.number}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .company-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .document-title {
              font-size: 16px;
              font-weight: bold;
            }
            .entry-header {
              margin-bottom: 20px;
              padding: 15px;
              background-color: #f8f9fa;
              border: 1px solid #dee2e6;
            }
            .entry-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .entry-number {
              font-weight: bold;
              font-size: 16px;
            }
            .entry-date {
              font-weight: bold;
            }
            .entry-details {
              margin-top: 10px;
            }
            .entry-details div {
              margin-bottom: 5px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .table th,
            .table td {
              border: 1px solid #333;
              padding: 8px;
              text-align: left;
            }
            .table th {
              background-color: #f8f9fa;
              font-weight: bold;
              text-align: center;
            }
            .table .code {
              text-align: center;
              font-family: monospace;
              font-weight: bold;
            }
            .table .amount {
              text-align: right;
              font-family: monospace;
            }
            .table .center {
              text-align: center;
            }
            .totals {
              background-color: #e9ecef;
              font-weight: bold;
            }
            .balance-status {
              text-align: center;
              margin: 20px 0;
              padding: 10px;
              border-radius: 5px;
            }
            .balanced {
              background-color: #d4edda;
              color: #155724;
              border: 1px solid #c3e6cb;
            }
            .unbalanced {
              background-color: #f8d7da;
              color: #721c24;
              border: 1px solid #f5c6cb;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #dee2e6;
              padding-top: 15px;
            }
            .description {
              font-style: italic;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">EMPRESA CONTABLE S.A.S.</div>
            <div>NIT: 900.123.456-7</div>
            <div class="document-title">LIBRO DIARIO</div>
          </div>

          <div class="entry-header">
            <div class="entry-info">
              <div class="entry-number">Asiento No. ${accountingEntry.number}</div>
              <div class="entry-date">Fecha: ${accountingEntry.date}</div>
            </div>
            <div class="entry-details">
              ${accountingEntry.third_party ? `<div><strong>Tercero:</strong> ${accountingEntry.third_party}</div>` : ""}
              ${accountingEntry.description ? `<div><strong>Concepto:</strong> ${accountingEntry.description}</div>` : ""}
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th style="width: 8%">Código</th>
                <th style="width: 35%">Nombre de la cuenta</th>
                <th style="width: 15%">Centro de costo</th>
                <th style="width: 15%">Débito</th>
                <th style="width: 15%">Crédito</th>
                <th style="width: 5%">Ref</th>
              </tr>
            </thead>
            <tbody>
              ${accountingEntry.entries
                .map(
                  (entry, index) => `
                <tr>
                  <td class="code">${entry.account}</td>
                  <td>
                    ${entry.account_name}
                    ${entry.description ? `<div class="description">${entry.description}</div>` : ""}
                  </td>
                  <td class="center">${entry.cost_center || "-"}</td>
                  <td class="amount">${entry.debit > 0 ? "$" + entry.debit.toLocaleString("es-CO") : "-"}</td>
                  <td class="amount">${entry.credit > 0 ? "$" + entry.credit.toLocaleString("es-CO") : "-"}</td>
                  <td class="center">${index + 1}</td>
                </tr>
              `,
                )
                .join("")}
              <tr class="totals">
                <td colspan="3" style="text-align: right; padding-right: 20px;">Sumas iguales:</td>
                <td class="amount">$${accountingEntry.entries.reduce((sum, entry) => sum + entry.debit, 0).toLocaleString("es-CO")}</td>
                <td class="amount">$${accountingEntry.entries.reduce((sum, entry) => sum + entry.credit, 0).toLocaleString("es-CO")}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          ${(() => {
            const totalDebit = accountingEntry.entries.reduce((sum, entry) => sum + entry.debit, 0)
            const totalCredit = accountingEntry.entries.reduce((sum, entry) => sum + entry.credit, 0)
            const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01
            return `
              <div class="balance-status ${isBalanced ? "balanced" : "unbalanced"}">
                ${isBalanced ? "✓ Asiento balanceado" : "⚠ Asiento desbalanceado"}
              </div>
            `
          })()}

          <div class="footer">
            <div>Página 1 | Libro Diario | ${new Date().toLocaleDateString("es-CO")}</div>
            <div style="margin-top: 10px;">Generado por Sistema Contable Inteligente</div>
          </div>
        </body>
      </html>
    `

    // Usar Puppeteer para generar el PDF
    const puppeteer = require("puppeteer")

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })

    const pdf = await page.pdf({
      format: "A4",
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
      printBackground: true,
    })

    await browser.close()

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="asiento-${accountingEntry.number}-${accountingEntry.date}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Error generating PDF" }, { status: 500 })
  }
}
