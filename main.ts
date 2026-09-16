import chromium from "npm:@sparticuz/chromium";
import { chromium as playwright } from "npm:playwright-core";

Deno.serve(async () => {
  let browser = null;

  try {
    // This extracts the bundled Chromium into /tmp
    // and returns the executable path.
    const executablePath =
      await chromium.executablePath();

    console.log(
      "Chromium executable:",
      executablePath,
    );

    browser =
      await playwright.launch({
        executablePath,

        args: [
          ...chromium.args,
          "--no-sandbox",
          "--disable-setuid-sandbox",
        ],

        headless: true,

        timeout: 30000,
      });

    const page =
      await browser.newPage();

    await page.goto(
      "https://example.com",
      {
        waitUntil:
          "domcontentloaded",

        timeout:
          30000,
      },
    );

    const title =
      await page.title();

    const text =
      await page.locator(
        "body",
      ).innerText();

    const finalUrl =
      page.url();

    await browser.close();

    return new Response(
      JSON.stringify(
        {
          success: true,

          chromiumLaunched:
            true,

          executablePath,

          title,

          finalUrl,

          textPreview:
            text.substring(
              0,
              1000,
            ),
        },
        null,
        2,
      ),
      {
        headers: {
          "Content-Type":
            "application/json",

          "Cache-Control":
            "no-store",
        },
      },
    );

  } catch (error) {

    try {
      await browser?.close();
    } catch {
      // Ignore cleanup errors.
    }

    return new Response(
      JSON.stringify(
        {
          success: false,

          chromiumLaunched:
            false,

          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
        null,
        2,
      ),
      {
        status: 500,

        headers: {
          "Content-Type":
            "application/json",

          "Cache-Control":
            "no-store",
        },
      },
    );
  }
});
