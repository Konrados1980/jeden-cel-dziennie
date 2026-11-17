import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayReview } from './DayReview';
import { DayGoal } from '../types';
import { makeGoal } from '../services/testFactories';

function setup(overrides: Partial<DayGoal> = {}) {
  const onFinishDay = vi.fn();
  const onBackToGoal = vi.fn();
  render(<DayReview goal={makeGoal(overrides)} onFinishDay={onFinishDay} onBackToGoal={onBackToGoal} />);
  return { onFinishDay, onBackToGoal, user: userEvent.setup() };
}

const yes = () => screen.getByRole('button', { name: 'Tak' });
const no = () => screen.getByRole('button', { name: 'Nie' });

describe('DayReview', () => {
  it('przy 100% domyślnie zaznacza „Tak”', () => {
    setup({ progress: 100 });
    expect(yes().getAttribute('aria-pressed')).toBe('true');
    expect(no().getAttribute('aria-pressed')).toBe('false');
  });

  it('przy niepełnym postępie domyślnie zaznacza „Nie”', () => {
    setup({ progress: 40 });
    expect(no().getAttribute('aria-pressed')).toBe('true');
  });

  it('przy edycji pokazuje wcześniejszą odpowiedź i refleksję', () => {
    setup({ progress: 100, achieved: false, helped: 'Cisza', hindered: 'Telefon' });
    expect(no().getAttribute('aria-pressed')).toBe('true');
    expect((screen.getByLabelText(/Co pomogło/) as HTMLTextAreaElement).value).toBe('Cisza');
    expect((screen.getByLabelText(/Co przeszkodziło/) as HTMLTextAreaElement).value).toBe('Telefon');
  });

  it('wysyła odpowiedź i refleksję bez spacji na brzegach', async () => {
    const { user, onFinishDay } = setup({ progress: 30 });
    await user.click(yes());
    await user.type(screen.getByLabelText(/Co pomogło/), '  Wyłączony telefon  ');
    await user.type(screen.getByLabelText(/Co przeszkodziło/), ' Spotkania ');
    await user.click(screen.getByRole('button', { name: 'Zakończ dzień' }));
    expect(onFinishDay).toHaveBeenCalledWith({ achieved: true, helped: 'Wyłączony telefon', hindered: 'Spotkania' });
  });

  it('refleksja jest opcjonalna', async () => {
    const { user, onFinishDay } = setup({ progress: 10 });
    await user.click(screen.getByRole('button', { name: 'Zakończ dzień' }));
    expect(onFinishDay).toHaveBeenCalledWith({ achieved: false, helped: '', hindered: '' });
  });

  it('pozwala wrócić do widoku celu', async () => {
    const { user, onBackToGoal } = setup();
    await user.click(screen.getByRole('button', { name: 'Wróć do widoku celu' }));
    expect(onBackToGoal).toHaveBeenCalledOnce();
  });
});
