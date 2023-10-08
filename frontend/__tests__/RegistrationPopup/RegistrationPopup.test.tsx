import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegistrationPopup } from '@/Components/SigninRegistration/RegistrationPopup';
import {
  SignInOptions,
  SignInReturn,
  SignUpOptions,
  SignUpReturn,
  UserCredentials
} from '@/lib/sessionContext';

const dummyUser = {
  id: '',
  app_metadata: {},
  user_metadata: {},
  aud: '',
  created_at: ''
};

const dummySession = {
  access_token: '',
  refresh_token: '',
  expires_in: 0,
  token_type: '',
  user: dummyUser
};

/* eslint-disable @typescript-eslint/no-unused-vars */
const goodSignInValue = async (email: string, opts?: SignInOptions) => {
  const retVal = {
    user: dummyUser,
    session: dummySession,
    error: null
  };
  return retVal;
};

const goodSignUpValue = async (
  creds: UserCredentials,
  opts?: SignUpOptions
): Promise<SignUpReturn> => {
  return {
    user: dummyUser,
    session: dummySession,
    error: null
  };
};
/* eslint-enable */

describe('RegistrationPopup', () => {
  const signInFn = jest.fn<
    Promise<SignInReturn>,
    [string, SignInOptions | undefined]
  >();
  const signUpFn = jest.fn<
    Promise<SignUpReturn>,
    [UserCredentials, SignUpOptions | undefined]
  >();

  const form = (initialState: 'signup' | 'signin' = 'signup') => (
    <RegistrationPopup
      open
      setClosed={() => {}}
      signUp={signUpFn}
      signIn={signInFn}
      initialState={initialState}
    />
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('contains only email in signin state (original)', () => {
    render(form('signin'));
    const emailBox = screen.getByRole('textbox');
    expect(emailBox).toBeVisible();
    expect(emailBox).toHaveAccessibleName('Email');
  });

  it('contains only email in signin state (switched)', async () => {
    render(form('signup'));
    const switchButton = screen.getByRole('button', { name: 'Sign In' });
    expect(switchButton).toBeVisible();

    await userEvent.click(switchButton);
    const emailBox = screen.getByRole('textbox');

    expect(emailBox).toBeVisible();
    expect(emailBox).toHaveAccessibleName('Email');
  });

  it('contains firstname, lastname and email when in signup state (original)', () => {
    render(form('signup'));
    expect(screen.getAllByRole('textbox')).toHaveLength(3);
  });

  it('contains firstname, lastname and email when in signup state (switched)', async () => {
    render(form('signin'));
    const switchButton = screen.getByRole('button', { name: 'Join Now' });
    expect(switchButton).toBeVisible();

    await userEvent.click(switchButton);
    expect(screen.getAllByRole('textbox')).toHaveLength(3);
  });

  it('calls signIn when submitting from signin state', async () => {
    signInFn.mockImplementation(goodSignInValue);
    render(form('signin'));
    expect.hasAssertions();

    await userEvent.type(screen.getByRole('textbox'), 'test.user@test.com');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    return waitFor(() => expect(signInFn).toBeCalledWith('test.user@test.com'));
  });

  it('calls signUp when submitting from signup state', async () => {
    signUpFn.mockImplementation(goodSignUpValue);
    render(form('signup'));
    expect.hasAssertions();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'First Name' }),
      'Test'
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Last Name' }),
      'User'
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Email' }),
      'test.user@test.com'
    );
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    return waitFor(() => {
      expect(signUpFn).toBeCalledWith(
        {
          email: 'test.user@test.com',
          password: expect.any(String)
        },
        {
          data: {
            firstname: 'Test',
            lastname: 'User'
          },
          redirectTo: expect.any(String)
        }
      );
    });
  });

  it('includes a button to switch to signin', () => {
    render(form());
    const signinButton = screen.getByRole('button', { name: /Sign[- ]?in/i });
    expect(signinButton).toBeVisible();
  });
});
