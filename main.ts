const candidates = [
  "chromium",
  "chromium-browser",
  "google-chrome",
  "google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
];

async function checkExecutable(
  executable: string,
) {
  try {
    const command = new Deno.Command(
      executable,
      {
        args: ["--version"],

        stdout: "piped",
        stderr: "piped",
      },
    );

    const output =
      await command.output();

    const stdout =
      new TextDecoder().decode(
        output.stdout,
      ).trim();

    const stderr =
      new TextDecoder().decode(
        output.stderr,
      ).trim();

    return {
      executable,
      found: true,
      exitCode: output.code,
      stdout,
      stderr,
    };
  } catch {
    return {
      executable,
      found: false,
    };
  }
}


/* =========================================================
   TEST CHROMIUM
========================================================= */

async function findChromium() {
  const results = [];

  for (
    const executable of candidates
  ) {
    results.push(
      await checkExecutable(
        executable,
      ),
    );
  }

  return results;
}


/* =========================================================
   SERVER
========================================================= */

Deno.serve(
  async () => {
    const results =
      await findChromium();

    const found =
      results.filter(
        (result) =>
          result.found &&
          result.exitCode === 0,
      );

    /*
     * If we found an executable,
     * try actually launching it.
     */
    let launchTest = null;

    if (found.length > 0) {
      const executable =
        found[0].executable;

      try {
        const command =
          new Deno.Command(
            executable,
            {
              args: [
                "--headless",
                "--no-sandbox",
                "--disable-gpu",
                "--dump-dom",
                "https://example.com",
              ],

              stdout: "piped",
              stderr: "piped",
            },
          );

        const output =
          await command.output();

        const stdout =
          new TextDecoder()
            .decode(
              output.stdout,
            );

        const stderr =
          new TextDecoder()
            .decode(
              output.stderr,
            );

        launchTest = {
          executable,

          started:
            true,

          exitCode:
            output.code,

          producedHtml:
            stdout.includes(
              "<html",
            ) ||
            stdout.includes(
              "<!doctype",
            ),

          stdoutPreview:
            stdout.substring(
              0,
              1000,
            ),

          stderrPreview:
            stderr.substring(
              0,
              1000,
            ),
        };

      } catch (error) {
        launchTest = {
          executable,

          started:
            false,

          error:
            error instanceof Error
              ? error.message
              : String(error),
        };
      }
    }

    return new Response(
      JSON.stringify(
        {
          chromiumInstalled:
            found.length > 0,

          chromiumExecutables:
            found,

          launchTest,

          allCandidates:
            results,
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
  },
);
