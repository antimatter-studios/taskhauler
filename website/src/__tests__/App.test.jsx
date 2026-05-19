import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import App from '../App.jsx';

afterEach(() => cleanup());

describe('App', () => {
  it('mounts without throwing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('contains the brand name "Taskhauler"', () => {
    const { container } = render(<App />);
    expect(container.textContent).toContain('Taskhauler');
  });

  it('renders a <nav> element', () => {
    const { container } = render(<App />);
    expect(container.querySelector('nav')).toBeTruthy();
  });
});
