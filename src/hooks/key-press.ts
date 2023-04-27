import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export const useKeyPress = (
  keys: string[],
  callback: (event: KeyboardEvent) => void,
  combo: string | null = null,
  node = null
) => {
  // implement the callback ref pattern
  const callbackRef = useRef(callback);
  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  // handle what happens on key press
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (keys.some((key) => event.key === key)) {
        switch (combo) {
          case "ctrl":
            if (
              event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey &&
              !event.metaKey
            ) {
              callbackRef.current(event);
            }
            break;
          case "shift":
            if (
              !event.ctrlKey &&
              event.shiftKey &&
              !event.altKey &&
              !event.metaKey
            ) {
              callbackRef.current(event);
            }
            break;
          case "alt":
            if (
              !event.ctrlKey &&
              !event.shiftKey &&
              event.altKey &&
              !event.metaKey
            ) {
              callbackRef.current(event);
            }
            break;
          case "meta":
            if (
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey &&
              event.metaKey
            ) {
              callbackRef.current(event);
            }
            break;
          case "ctrl+shift":
            if (
              event.ctrlKey &&
              event.shiftKey &&
              !event.altKey &&
              !event.metaKey
            ) {
              callbackRef.current(event);
            }
            break;
          case null:
            callbackRef.current(event);
            break;
          default:
            break;
        }
      }
    },
    [combo, keys]
  );

  useEffect(() => {
    // target is either the provided node or the document
    const targetNode = node ?? document;
    // attach the event listener
    targetNode && targetNode.addEventListener("keydown", handleKeyPress);

    // remove the event listener
    return () =>
      targetNode && targetNode.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress, node]);
};

//git commit
