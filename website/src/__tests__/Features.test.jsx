import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import Features from '../sections/Features.jsx';

afterEach(() => cleanup());

describe('Features', () => {
  it('renders without crashing', () => {
    expect(() => render(<Features />)).not.toThrow();
  });

  it('renders the section heading anchor', () => {
    const { container } = render(<Features />);
    const section = container.querySelector('section#features');
    expect(section).toBeTruthy();
  });

  it('renders 5 feature cards (one <h3> per card)', () => {
    const { container } = render(<Features />);
    const h3s = container.querySelectorAll('h3');
    expect(h3s.length).toBe(5);
  });
});
