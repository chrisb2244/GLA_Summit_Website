import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, of } from 'react-hook-form';
import { Person } from '@/Components/Form/Person';
import type { PersonProps } from '@/Components/Form/Person';
import { fail } from 'assert';
import { BaseSyntheticEvent } from 'react';

type FormData = {
  personA: PersonProps;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const submitFn = jest.fn<
  void,
  [Readonly<FormData>, BaseSyntheticEvent | undefined]
>(async (data, event) => {});

const Form = (): JSX.Element => {
  // Note the 'onBlur' mode here.
  const {
    register,
    formState: { errors },
    handleSubmit
  } = useForm<FormData>({
    mode: 'onBlur'
  });
  return (
    <form onSubmit={handleSubmit(submitFn)}>
      <Person<FormData>
        path={of('personA')}
        errors={errors.personA}
        register={register}
      />
      <button type='submit'>Submit</button>
    </form>
  );
};

const getEmailInput = () => {
  return screen.getByRole('textbox', { name: 'Email' });
};

describe('Person', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('produces 3 errors for an empty form', async () => {
    render(<Form />);
    await userEvent.click(screen.getByRole('button'));

    const errors = await screen.findAllByRole('alert');
    expect(errors).toHaveLength(3);
  });

  it('rejects an invalid email without @ symbol', async () => {
    render(<Form />);
    const emailInput = getEmailInput();
    expect(emailInput).toBeVisible();

    const emailString = 'invalidemail.blah.com';
    await userEvent.type(emailInput, emailString);
    expect(emailInput).toHaveValue(emailString);

    fireEvent.blur(emailInput);

    const errors = await screen.findAllByRole('alert');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toHaveTextContent(
      "This email doesn't match the expected pattern"
    );
  });

  it('accepts an email with the @ symbol and suitable pattern', async () => {
    render(<Form />);
    const emailInput = getEmailInput();
    await userEvent.type(emailInput, 'a.b@c.d');

    fireEvent.blur(emailInput);

    await screen.findAllByRole('alert').then(
      (foundElems) => {
        console.error(foundElems.map((elem) => elem.innerHTML));
        fail('Found errors when unexpected');
      },
      (rejectReason) => {
        expect(rejectReason).toBeDefined();
      }
    );

    expect(submitFn).not.toBeCalled();
  });

  it('returns entered values on successful submit', async () => {
    render(<Form />);
    const fname = 'Test';
    const lname = 'User';
    const email = 'test.user@test.com';

    await userEvent.type(
      screen.getByRole('textbox', { name: 'First Name' }),
      fname
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Last Name' }),
      lname
    );
    await userEvent.type(getEmailInput(), email);
    await userEvent.click(screen.getByRole('button'));

    const expectedData: FormData = {
      personA: {
        firstName: fname,
        lastName: lname,
        email: email
      }
    };

    // Don't care about the event, match with anything()
    // If validation had failed, this wouldn't have been called at all
    return waitFor(() => {
      expect(submitFn).toBeCalledWith(expectedData, expect.anything());
    });
  });
});
