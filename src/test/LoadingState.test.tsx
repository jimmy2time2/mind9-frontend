import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LoadingState } from '../components/LoadingState';

describe('LoadingState', () => {
  it('renders loading spinner', () => {
    const { container } = render(<LoadingState />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});