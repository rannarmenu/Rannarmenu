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


/**
 * Place Mira's chat window in the visible viewport near the floating head.
 * It flips above/below the head when there is insufficient space and never
 * intentionally extends beyond the viewport edges.
 */
export function getMiraPanelPlacement(anchor, viewport, panel, gap = 12) {
  const vw = Math.max(0, Number(viewport?.width) || 0);
  const vh = Math.max(0, Number(viewport?.height) || 0);
  const buttonW = Math.max(0, Number(anchor?.width) || 0);
  const buttonH = Math.max(0, Number(anchor?.height) || 0);
  const leftAnchor = Math.min(Math.max(0, Number(anchor?.left) || 0), Math.max(0, vw - buttonW));
  const topAnchor = Math.min(Math.max(0, Number(anchor?.top) || 0), Math.max(0, vh - buttonH));
  const width = Math.min(Math.max(0, Number(panel?.width) || 0), Math.max(0, vw - gap * 2));
  const height = Math.min(Math.max(0, Number(panel?.height) || 0), Math.max(0, vh - gap * 2));

  const preferLeft = leftAnchor + buttonW / 2 < vw / 2;
  const desiredLeft = preferLeft ? leftAnchor : leftAnchor + buttonW - width;
  const left = Math.min(Math.max(gap, desiredLeft), Math.max(gap, vw - width - gap));

  const below = topAnchor + buttonH + gap;
  const above = topAnchor - height - gap;
  const fitsBelow = below + height <= vh - gap;
  const fitsAbove = above >= gap;
  const availableBelow = Math.max(0, vh - below - gap);
  const availableAbove = Math.max(0, topAnchor - gap * 2);
  // If neither side fits the full chat, choose the side with more room and
  // clamp its position; never blindly pin a tall chat to the bottom edge.
  const placeBelow = fitsBelow || (!fitsAbove && availableBelow >= availableAbove);
  const desiredTop = placeBelow ? below : above;
  const top = Math.min(Math.max(gap, desiredTop), Math.max(gap, vh - height - gap));

  return { left, top, width, height, side: preferLeft ? 'left' : 'right', vertical: placeBelow ? 'below' : 'above' };
}
