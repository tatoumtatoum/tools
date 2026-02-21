from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    # Desktop
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto('http://localhost:3000/cabinet-medical.html')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='screenshot_landing_desktop.png', full_page=True)
    # Mobile
    page2 = browser.new_page(viewport={"width": 390, "height": 844})
    page2.goto('http://localhost:3000/cabinet-medical.html')
    page2.wait_for_load_state('networkidle')
    page2.screenshot(path='screenshot_landing_mobile.png', full_page=True)
    browser.close()
    print("Screenshots saved")
