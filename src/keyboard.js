export const BUTTON_TO_CMD = {
  '⎋ Esc': 'esc',
  '⌃C': 'c-c',
  '⏎ Enter': 'enter',
  '↑': 'up',
  '↓': 'down',
  '⇥ Tab': 'tab',
};

export const REPLY_KEYBOARD = {
  keyboard: [
    [{ text: '⎋ Esc' }, { text: '⌃C' }, { text: '⏎ Enter' }],
    [{ text: '↑' }, { text: '↓' }, { text: '⇥ Tab' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};
