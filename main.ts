import { chromium } from "npm:playwright";

Deno.serve(async () => {
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page =
      await browser.newPage();

    await page.goto(
      "https://example.com",
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    const title =
      await page.title();

    const text =
      await page.locator("body").innerText();

    await browser.close();

    return new Response(
      JSON.stringify({
        success: true,
        chromiumLaunched: true,
        title,
        textPreview:
          text.substring(0, 1000)
      }, null, 2),
      {
        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );

  } catch (error) {
    try {
      await browser?.close();
    } catch {
      // Ignore cleanup errors.
    }

    return new Response(
      JSON.stringify({
        success: false,
        chromiumLaunched: false,
        error:
          error instanceof Error
            ? error.message
            : String(error)
      }, null, 2),
      {
        status: 500,
        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );
  }
});
