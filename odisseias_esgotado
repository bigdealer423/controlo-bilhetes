import type { NextApiRequest, NextApiResponse } from "next";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { sendAlertEmail } from "../../../lib/email";

const URL = "COLOCAR_URL_AQUI";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let browser;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto(URL, { waitUntil: "networkidle2" });

    const temEsgotado = await page.evaluate(() => {
      const el = document.querySelector("span.soldout.is-hidden-mobile");
      if (!el) return false;

      const texto = (el.textContent || "").trim().toLowerCase();
      return texto.includes("esgotado");
    });

    if (!temEsgotado) {
      console.log("⚡ 'Esgotado' não encontrado -> enviar email");

      await sendAlertEmail({
        subject: "ALERTA BILHETES",
        text: `Já não aparece "Esgotado" na página ${URL}`,
      });
    } else {
      console.log("Ainda aparece 'Esgotado'");
    }

    await browser.close();

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    if (browser) await browser.close();
    res.status(500).json({ error: "Erro no monitor" });
  }
}
