import { ReactNode } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

type RenderHookResult<T> = {
  result: { current: T };
  rerender: () => void;
};

type Options = {
  wrapper?: ({ children }: { children: ReactNode }) => JSX.Element;
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
  };
}

export { act } from 'react-test-renderer';
