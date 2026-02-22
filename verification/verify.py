from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:8080")

        # Screenshot Auth
        page.screenshot(path="verification/auth_screen.png")

        # Check Auth Labels
        try:
            label_user = page.locator("label[for=\"login-user\"]")
            print(f"Login User Label: {label_user.inner_text()}")
            if label_user.count() > 0:
                print("SUCCESS: Login User label found.")
            else:
                print("FAILURE: Login User label NOT found.")
        except Exception as e:
            print(f"Error checking login label: {e}")

        # Force show app to check internal pages
        page.evaluate("document.getElementById(\"auth-screen\").classList.add(\"hidden\")")
        page.evaluate("document.getElementById(\"app\").classList.remove(\"hidden\")")

        # Screenshot Feed
        page.screenshot(path="verification/feed_screen.png")

        # Check Compose Label
        try:
            compose_label = page.locator("label[for=\"compose-text\"]")
            cls = compose_label.get_attribute("class")
            print(f"Compose Label Class: {cls}")
            if "sr-only" in cls:
                 print("SUCCESS: Compose label has sr-only class.")
            else:
                 print("FAILURE: Compose label missing sr-only class.")
        except Exception as e:
            print(f"Error checking compose label: {e}")

        # Check Settings
        # Wait for nav settings to be visible
        page.wait_for_selector("#nav-settings")
        page.click("#nav-settings")
        page.wait_for_selector("#settings-view") # wait for settings view
        page.screenshot(path="verification/settings_screen.png")

        browser.close()

if __name__ == "__main__":
    run()
