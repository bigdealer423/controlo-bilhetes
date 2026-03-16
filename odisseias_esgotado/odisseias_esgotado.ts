import type { NextApiRequest, NextApiResponse } from "next";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { sendAlertEmail } from "../../../lib/email";

const URL = "https://viagens.slbenfica.pt/programas/sporting-cp-vs-sl-benfica-30-jornada-com-almoco/1005818#ps:4c043c43-1ebb-4796-a9d7-8c921df3789f/ps:e72ebad9-8e71-4989-bebf-eeb6c60a9ed2/ps:1b35e567-5c05-4909-bbaf-d61f2730faf3/ps:fd12648f-d196-4316-a02f-501ddac23f2f/ps:94bb73db-dddf-4a24-8f2a-8df30cb1d023/ps:81f27aba-6e24-46c4-a09a-0ccacbfcda45/ps:70b6a374-c1c0-408a-a9d3-49d7b0608d1a/ps:7a5542a5-c431-4c7b-b8f5-1f782ccd9003/ps:7f5123be-9e25-4a83-a33e-658e7aa95058/ps:cfe504e2-34b8-41fe-b10d-9f2f359557e7/ps:503f11d2-d3e5-4727-b0a1-92c65dd7afe9/ps:5b1cc57e-56c5-47a4-a8aa-9137205e5195/ps:7db844c5-6e88-4ac7-b456-224f1a23f48c/ps:804a4d3f-b201-4071-a6ce-efe1f0db4209";

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
