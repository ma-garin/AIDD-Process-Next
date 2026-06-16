"""
Playwright スモークテスト — AIDD Process Next
事前:
  pip install pytest-playwright && playwright install chromium
  npx serve docs -l 8767
実行:
  pytest tests/test_smoke.py -v
"""
import pytest
from playwright.sync_api import Page, expect

APP_URL = "http://localhost:8767/"


# ── ヘルパー ──────────────────────────────────────────────────────────────────

def assert_shell_always_visible(page: Page):
    """ヘッダーとサイドナビが常に表示されていることを確認する共通アサーション"""
    expect(page.locator(".shell-header")).to_be_visible()
    expect(page.locator(".shell-sidenav")).to_be_visible()


# ── ロード / エラーなし ───────────────────────────────────────────────────────

def test_page_loads_without_console_errors(page: Page):
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.goto(APP_URL)
    page.wait_for_load_state("networkidle")
    assert errors == [], f"console error あり: {errors}"


# ── ヘッダー永続表示 (課題の核心) ────────────────────────────────────────────

def test_header_visible_on_welcome(page: Page):
    page.goto(APP_URL)
    assert_shell_always_visible(page)


def test_header_persists_after_start_assessment(page: Page):
    page.goto(APP_URL)
    page.click("text=診断を開始")
    page.wait_for_selector("#screen-assessment.active")
    assert_shell_always_visible(page)


def test_header_persists_on_results(page: Page):
    """サンプルで一気に結果画面まで遷移してヘッダーが残ることを確認"""
    page.goto(APP_URL)
    page.click("text=サンプルで確認")
    page.wait_for_selector("#screen-assessment.active")
    page.click("text=結果を見る")
    page.wait_for_selector("#screen-results.active")
    assert_shell_always_visible(page)


def test_header_persists_on_report(page: Page):
    page.goto(APP_URL)
    page.click("text=サンプルで確認")
    page.wait_for_selector("#screen-assessment.active")
    page.click("text=結果を見る")
    page.wait_for_selector("#screen-results.active")
    page.click("text=レポートを見る")
    page.wait_for_selector("#screen-report.active")
    assert_shell_always_visible(page)


def test_header_persists_when_navigating_back(page: Page):
    """Results → Assessment → Welcome と戻っても常にヘッダーが表示される"""
    page.goto(APP_URL)
    page.click("text=サンプルで確認")
    page.wait_for_selector("#screen-assessment.active")
    page.click("text=結果を見る")
    page.wait_for_selector("#screen-results.active")
    page.locator("#sidenav-results .back-btn").click()
    page.wait_for_selector("#screen-assessment.active")
    assert_shell_always_visible(page)
    page.locator("#sidenav-assessment .back-btn").click()
    page.wait_for_selector("#screen-welcome.active")
    assert_shell_always_visible(page)


# ── サイドナビ コンテキスト切替 ───────────────────────────────────────────────

def test_sidenav_context_switches_to_assessment(page: Page):
    page.goto(APP_URL)
    page.click("text=診断を開始")
    page.wait_for_selector("#sidenav-assessment.active")
    expect(page.locator("#sidenav-welcome")).not_to_have_class("active")


def test_sidenav_context_switches_to_results(page: Page):
    page.goto(APP_URL)
    page.click("text=サンプルで確認")
    page.wait_for_selector("#screen-assessment.active")
    page.click("text=結果を見る")
    page.wait_for_selector("#sidenav-results.active")
    expect(page.locator("#sidenav-assessment")).not_to_have_class("active")


def test_sidenav_results_shows_score(page: Page):
    """Results サイドナビにスコアが表示される"""
    page.goto(APP_URL)
    page.click("text=サンプルで確認")
    page.wait_for_selector("#screen-assessment.active")
    page.click("text=結果を見る")
    page.wait_for_selector("#sidenav-results.active")
    score_text = page.locator("#sidenav-result-score").text_content()
    assert score_text and "/100" in score_text, f"スコア表示なし: {score_text!r}"


# ── 主要操作 ──────────────────────────────────────────────────────────────────

def test_assessment_navigation_works(page: Page):
    """診断画面でカテゴリナビが表示され、クリックできる"""
    page.goto(APP_URL)
    page.click("text=診断を開始")
    page.wait_for_selector("#screen-assessment.active")
    expect(page.locator("#category-nav")).to_be_visible()
    expect(page.locator(".question-card")).to_be_visible()


def test_answer_selection_works(page: Page):
    """選択肢をクリックして回答できる"""
    page.goto(APP_URL)
    page.click("text=診断を開始")
    page.wait_for_selector("#screen-assessment.active")
    page.locator(".choice-label").first.click()
    expect(page.locator(".choice-label.selected")).to_be_visible()


def test_report_screen_shows_markdown(page: Page):
    page.goto(APP_URL)
    page.click("text=サンプルで確認")
    page.wait_for_selector("#screen-assessment.active")
    page.click("text=結果を見る")
    page.wait_for_selector("#screen-results.active")
    page.click("text=レポートを見る")
    page.wait_for_selector("#screen-report.active")
    report_text = page.locator("#report-content").text_content()
    assert report_text and len(report_text) > 100, "レポートが空"


# ── レスポンシブ (360px) ──────────────────────────────────────────────────────

@pytest.mark.parametrize("width,height", [(360, 820), (1280, 800)])
def test_layout_holds_at_various_widths(page: Page, width: int, height: int):
    page.set_viewport_size({"width": width, "height": height})
    page.goto(APP_URL)
    expect(page.locator(".shell-header")).to_be_visible()
    # welcome画面のメインCTAボタンで確認（サイドナビ内の同名要素と区別）
    expect(page.locator("#screen-welcome .btn-primary")).to_be_visible()
