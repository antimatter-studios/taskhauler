import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import Hero from '../sections/Hero.jsx';

afterEach(() => cleanup());

describe('Hero', () => {
  it('renders without crashing', () => {
    expect(() => render(<Hero />)).not.toThrow();
  });

  it('contains the headline copy "The kanban for teams"', () => {
    const { container } = render(<Hero />);
    expect(container.textContent).toContain('The kanban for teams');
  });

  it('mentions humans and agents in the headline', () => {
    const { container } = render(<Hero />);
    expect(container.textContent).toContain('humans');
    expect(container.textContent).toContain('agents');
  });
});
