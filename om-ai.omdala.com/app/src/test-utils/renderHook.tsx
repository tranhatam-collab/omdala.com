import type { ReactElement, ReactNode } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

type RenderHookResult<T> = {
  result: { current: T };
  rerender: () => void;
  unmount: () => void;
};

type Options = {
  wrapper?: ({ children }: { children: ReactNode }) => ReactElement;
};

export function renderHook<T>(callback: () => T, options?: Options): RenderHookResult<T> {
  const result: { current: T } = { current: undefined as unknown as T };

  function HookWrapper() {
    result.current = callback();
    return null;
  }

  const WrapperComponent = options?.wrapper;

  const element = WrapperComponent ? (
    <WrapperComponent>
      <HookWrapper />
    </WrapperComponent>
  ) : (
    <HookWrapper />
  );

  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });

  return {
    result,
    rerender: () => {
      act(() => {
        renderer.update(element);
      });
    },
    unmount: () => {
      act(() => {
        renderer.unmount();
      });
    },
  };
}

export { act } from 'react-test-renderer';
