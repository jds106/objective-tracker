import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmModal } from './ConfirmModal.js';

// Mock framer-motion to avoid animation issues in jsdom
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
  };

  it('should render title and message when open', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} confirmLabel="Delete" />);

    await user.click(screen.getByText('Delete'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ConfirmModal {...defaultProps} onClose={onClose} cancelLabel="Nevermind" />);

    await user.click(screen.getByText('Nevermind'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should show loading text when isLoading is true', () => {
    render(<ConfirmModal {...defaultProps} isLoading={true} confirmLabel="Delete" />);
    expect(screen.getByText('Processing…')).toBeInTheDocument();
  });

  it('should disable buttons when isLoading is true', () => {
    render(<ConfirmModal {...defaultProps} isLoading={true} />);
    const buttons = screen.getAllByRole('button');
    // All non-close buttons should be disabled
    const actionButtons = buttons.filter(b => b.textContent !== '');
    for (const btn of actionButtons) {
      // Filter to just Cancel and Confirm buttons (skip the X close)
      if (btn.textContent === 'Cancel' || btn.textContent === 'Processing…') {
        expect(btn).toBeDisabled();
      }
    }
  });

  it('should use custom labels', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmLabel="Yes, remove it"
        cancelLabel="Keep it"
      />,
    );
    expect(screen.getByText('Yes, remove it')).toBeInTheDocument();
    expect(screen.getByText('Keep it')).toBeInTheDocument();
  });
});
