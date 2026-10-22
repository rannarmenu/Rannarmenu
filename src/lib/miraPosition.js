/** Clamp Mira's floating button to the visible viewport. */
export function clampMiraAnchor(anchor, viewport, button) {
  const viewportWidth = Math.max(0, Number(viewport?.width) || 0);
  const viewportHeight = Math.max(0, Number(viewport?.height) || 0);
  const buttonWidth = Math.max(0, Number(button?.width) || 0);
  const buttonHeight = Math.max(0, Number(button?.height) || 0);
  const left = Number(anchor?.left) || 0;
  const top = Number(anchor?.top) || 0;
  return {
    left: Math.min(Math.max(0, left), Math.max(0, viewportWidth - buttonWidth)),
    top: Math.min(Math.max(0, top), Math.max(0, viewportHeight - buttonHeight))
  };
}

/**
 * Position the wide chat panel container around the chosen launcher point.
 * The launcher itself stays at anchorLeft; the container grows toward screen centre.
 */
export function getMiraWidgetOrigin(anchorLeft, viewportWidth, widgetWidth, buttonWidth) {
  const viewport = Math.max(0, Number(viewportWidth) || 0);
  const width = Math.min(viewport, Math.max(0, Number(widgetWidth) || 0));
  const button = Math.max(0, Number(buttonWidth) || 0);
  const anchor = Math.min(Math.max(0, Number(anchorLeft) || 0), Math.max(0, viewport - button));
  const towardLeft = anchor < viewport / 2;
  const desired = towardLeft ? anchor : anchor - (width - button);
  return {
    left: Math.min(Math.max(0, desired), Math.max(0, viewport - width)),
    side: towardLeft ? 'left' : 'right'
  };
}
