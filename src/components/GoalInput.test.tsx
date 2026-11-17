import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalInput } from './GoalInput';

function setup(initialValue?: string) {
  const onSetGoal = vi.fn();
  render(<GoalInput onSetGoal={onSetGoal} initialValue={initialValue} />);
  return {
    onSetGoal,
    user: userEvent.setup(),
    textbox: screen.getByRole('textbox', { name: 'Najważniejszy cel na dziś' }),
    submit: screen.getByRole('button', { name: 'Zaczynam dziś' }),
  };
}

describe('GoalInput', () => {
  it('nie pozwala zatwierdzić pustego celu ani samych spacji', async () => {
    const { user, textbox, submit, onSetGoal } = setup();
    expect(submit).toHaveProperty('disabled', true);
    await user.type(textbox, '   ');
    expect(submit).toHaveProperty('disabled', true);
    await user.keyboard('{Enter}');
    expect(onSetGoal).not.toHaveBeenCalled();
  });

  it('Enter zatwierdza cel bez spacji na brzegach', async () => {
    const { user, textbox, onSetGoal } = setup();
    await user.type(textbox, '  Napisać testy  {Enter}');
    expect(onSetGoal).toHaveBeenCalledWith('Napisać testy');
  });

  it('Shift + Enter dodaje nową linię zamiast zatwierdzać', async () => {
    const { user, textbox, onSetGoal } = setup();
    await user.type(textbox, 'Linia 1{Shift>}{Enter}{/Shift}Linia 2');
    expect(onSetGoal).not.toHaveBeenCalled();
    expect((textbox as HTMLTextAreaElement).value).toBe('Linia 1\nLinia 2');
  });

  it('przycisk „Zaczynam dziś” zatwierdza cel', async () => {
    const { user, textbox, submit, onSetGoal } = setup();
    await user.type(textbox, 'Cel z przycisku');
    await user.click(submit);
    expect(onSetGoal).toHaveBeenCalledWith('Cel z przycisku');
  });

  it('przykład wpisuje się do pola i liczy znaki', async () => {
    const { user, textbox } = setup();
    const example = 'Wysłać gotową ofertę do klienta';
    await user.click(screen.getByRole('button', { name: example }));
    expect((textbox as HTMLTextAreaElement).value).toBe(example);
    expect(screen.getByText(`${example.length} znaków`)).toBeTruthy();
  });

  it('przy edycji pokazuje dotychczasową treść celu', () => {
    const { textbox } = setup('Stary cel');
    expect((textbox as HTMLTextAreaElement).value).toBe('Stary cel');
  });
});
