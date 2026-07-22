from playwright.sync_api import sync_playwright
from .browser import (
    PROFILE_PATH,
    HEADLESS,
    HAR_DIR,
    TRACE_DIR,
)


class BrowserManager:
    def __init__(self):
        self.playwright = None
        self.context = None

    def start(self):
        self.playwright = sync_playwright().start()

        self.context = self.playwright.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_PATH),
            headless=HEADLESS,
            viewport={"width": 1400, "height": 900},
            record_har_path=str(HAR_DIR / "network.har"),
        )

        self.context.tracing.start(
            screenshots=True,
            snapshots=True,
            sources=True,
        )

        return self.context

    def stop(self):
        if self.context:
            self.context.tracing.stop(
                path=str(TRACE_DIR / "trace.zip")
            )

            self.context.close()

        if self.playwright:
            self.playwright.stop()