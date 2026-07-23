import re
import time

from apps.comparison1.playwright.browser import (
    PROMPTNATUS_URL,
    TIMEOUT,
    SCREENSHOT_DIR,
    LOG_DIR,
)
from apps.comparison1.playwright.manager import BrowserManager1


class PromptnatusService:

    @staticmethod
    def optimize(
        prompt: str,
        screenshot_name: str = "after_optimize.png",
    ) -> str:

        manager = BrowserManager1()
        context = manager.start()
        page = context.new_page()

        try:
            page.goto(
                PROMPTNATUS_URL,
                wait_until="domcontentloaded",
                timeout=TIMEOUT,
            )

            PromptnatusService._fill_prompt(page, prompt)

            optimize_button = page.get_by_role(
                "button",
                name=re.compile("Optimize your AI prompt", re.IGNORECASE),
            )
            optimize_button.click()

            # Wait for the button to enter a "working" state and then
            # come back — a real completion signal instead of guessing
            # from rendered text.
            PromptnatusService._wait_for_button_idle(page, optimize_button)

            optimized_prompt = PromptnatusService._get_result_text(
                page,
                timeout_ms=30000,
            )

            page.wait_for_timeout(500)

            screenshot_path = SCREENSHOT_DIR / screenshot_name
            page.screenshot(path=str(screenshot_path), full_page=True)

            log_file = LOG_DIR / "promptnatus_optimized_prompt.txt"
            log_file.write_text(optimized_prompt, encoding="utf-8")

            return optimized_prompt

        finally:
            manager.stop()

    @staticmethod
    def _fill_prompt(page, prompt):
        prompt_box = page.get_by_role(
            "textbox",
            name=re.compile("Enter your AI prompt to", re.IGNORECASE),
        )
        prompt_box.wait_for(state="visible", timeout=TIMEOUT)
        prompt_box.scroll_into_view_if_needed()
        prompt_box.fill(prompt)

    @staticmethod
    def _wait_for_button_idle(page, button, timeout_ms=30000):
        """
        Waits for the Optimize button to reflect a loading state and then
        return to idle. Falls back gracefully if no such state exists,
        so this never hard-fails the whole flow — the text-based poll
        in _get_result_text is the real source of truth either way.
        """
        try:
            page.wait_for_function(
                """(btn) => {
                    return btn.disabled === true
                        || btn.getAttribute('aria-busy') === 'true'
                        || btn.querySelector('.spinner, .loading, [class*="loading"]') !== null;
                }""",
                arg=button.element_handle(),
                timeout=3000,
            )
        except Exception:
            pass

        try:
            page.wait_for_function(
                """(btn) => {
                    return btn.disabled !== true
                        && btn.getAttribute('aria-busy') !== 'true'
                        && btn.querySelector('.spinner, .loading, [class*="loading"]') === null;
                }""",
                arg=button.element_handle(),
                timeout=timeout_ms,
            )
        except Exception:
            pass

    @staticmethod
    def _get_result_text(page, timeout_ms=30000, stable_checks=3, poll_interval_ms=300):
        """
        Waits for the result textbox to contain optimized content AND
        for that content to stop changing across consecutive polls,
        then reads it.

        Important: we re-resolve the locator on every poll rather than
        capturing a single element_handle(). If the framework replaces
        the textbox node during/after rendering (common with
        React/Vue re-renders), a cached handle silently goes stale and
        wait_for_function just spins until timeout — which is the most
        likely cause of the intermittent 30000ms errors you were
        seeing. Reading via .input_value() on the locator each time
        avoids that entirely.
        """
        result_box = page.get_by_role(
            "textbox",
            name=re.compile("Optimized AI prompt result", re.IGNORECASE),
        )
        result_box.wait_for(state="visible", timeout=timeout_ms)

        start = time.time()
        last_value = None
        stable_count = 0

        while (time.time() - start) * 1000 < timeout_ms:
            try:
                value = result_box.input_value().strip()
            except Exception:
                value = ""

            if value:
                if value == last_value:
                    stable_count += 1
                    if stable_count >= stable_checks:
                        return value
                else:
                    stable_count = 0
                last_value = value
            else:
                last_value = None
                stable_count = 0

            page.wait_for_timeout(poll_interval_ms)

        if last_value:
            return last_value

        raise TimeoutError(
            f"Optimized prompt result did not populate within {timeout_ms}ms"
        )