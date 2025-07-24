export class ThemeManager {
  private themedElements: Map<HTMLElement, { theme: string; inView: boolean }> =
    new Map();
  private body: HTMLElement = document.body;

  registerElement(element: HTMLElement, theme: string) {
    this.themedElements.set(element, { theme, inView: false });
  }

  updateElementViewStatus(element: HTMLElement, inView: boolean) {
    if (this.themedElements.has(element)) {
      this.themedElements.get(element)!.inView = inView;
    }
    this.updateBodyTheme();
  }

  private updateBodyTheme() {
    const activeThemes = Array.from(this.themedElements.values())
      .filter((item) => item.inView)
      .map((item) => item.theme);

    if (activeThemes.length > 0) {
      // Simple approach: use the theme of the last active element
      this.body.setAttribute(
        "data-theme",
        activeThemes[activeThemes.length - 1]
      );
    } else {
      this.body.removeAttribute("data-theme");
    }
  }
}
