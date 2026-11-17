import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActiveGoal } from './ActiveGoal';
import { makeGoal } from '../services/testFactories';

function setup(progress = 0) {
  const props = {
    goal: makeGoal({ goal: 'Dokończyć moduł', progress }),
    onUpdateProgress: vi.fn(),
    onCompleteGoal: vi.fn(),
    onStartReview: vi.fn(),
    onEditGoalText: vi.fn(),
  };
  render(<ActiveGoal {...props} />);
  return { ...props, user: userEvent.setup() };
}

describe('ActiveGoal', () => {
  it('pokazuje cel i zapisany postęp', () => {
    setup(25);
    expect(screen.getByRole('heading', { name: 'Dokończyć moduł' })).toBeTruthy();
    expect(screen.getByText('25%', { selector: 'span' })).toBeTruthy();
    expect(screen.getByText('Pierwsze kroki wykonane')).toBeTruthy();
  });

  it('przycisk etapu ustawia postęp i opis', async () => {
    const { user, onUpdateProgress } = setup();
    await user.click(screen.getByRole('button', { name: '50%' }));
    expect(onUpdateProgress).toHaveBeenCalledWith(50);
    expect(screen.getByText('W trakcie głębokiej pracy')).toBeTruthy();
  });

  it('suwak przekazuje wybraną wartość', () => {
    const { onUpdateProgress } = setup();
    fireEvent.change(screen.getByRole('slider', { name: 'Regulacja postępu celu' }), { target: { value: '85' } });
    expect(onUpdateProgress).toHaveBeenCalledWith(85);
    expect(screen.getByText('Półmetek za Tobą, finisz blisko')).toBeTruthy();
  });

  it('„Cel osiągnięty” ustawia 100% i przechodzi do podsumowania', async () => {
    const { user, onUpdateProgress, onCompleteGoal } = setup(40);
    await user.click(screen.getByRole('button', { name: 'Cel osiągnięty' }));
    expect(onUpdateProgress).toHaveBeenCalledWith(100);
    expect(onCompleteGoal).toHaveBeenCalledOnce();
  });

  it('przyciski podsumowania i edycji wywołują swoje akcje', async () => {
    const { user, onStartReview, onEditGoalText } = setup();
    await user.click(screen.getByRole('button', { name: 'Podsumuj i zakończ dzień' }));
    await user.click(screen.getByRole('button', { name: 'Zmień treść' }));
    expect(onStartReview).toHaveBeenCalledOnce();
    expect(onEditGoalText).toHaveBeenCalledOnce();
  });
});
