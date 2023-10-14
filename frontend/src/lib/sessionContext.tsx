import React, {
  useContext,
  useState,
  createContext,
  useEffect,
  ReactNode
} from 'react';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { AuthError } from '@supabase/supabase-js';
import { ProfileModel } from './databaseModels';
import { defaultTimezoneInfo, myLog, TimezoneInfo } from './utils.tsx';
import { GenerateLinkBody } from '@/lib/generateSupabaseLinks';
import type { NewUserInformation } from '@/Components/SigninRegistration/NewUserRegistration';
import {
  checkIfOrganizer,
  getProfileInfo,
  queryTimezonePreferences
} from '@/lib/databaseFunctions';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import type { Database } from './sb_databaseModels';

export type ApiError = {
  message: string;
  status: number;
};
export type UserCredentials = {
  email: string;
  password: string;
};

// Even for ValidSignIn, session and user are null using magic link via email.
type ValidSignIn = { session: Session | null; user: User | null; error: null };
type InvalidSignIn = { session: null; user: null; error: ApiError };
export type SignInReturn = ValidSignIn | InvalidSignIn;

// If "Email Confirmations" is turned on, user is valid and session is null
// If turned off, both are valid when error: null.
type ValidSignUp = { user: User; session: Session | null; error: null };
type InvalidSignUp = { user: null; session: null; error: ApiError };
export type SignUpReturn = ValidSignUp | InvalidSignUp;

export type SignInOptions = {
  redirectTo?: string;
  scopes?: string;
  captchaToken?: string;
};

export type SignUpOptions = {
  redirectTo?: string;
  data?: object;
  captchaToken?: string;
};

type SessionContext = {
  user: User | null;
  profile: ProfileModel['Row'] | null;
  timezoneInfo: TimezoneInfo;
  isOrganizer: boolean;
  isLoading: boolean;
  signIn: (
    email: string,
    options?: SignInOptions
  ) => Promise<ValidSignIn | InvalidSignIn>;
  signUp: (
    credentials: UserCredentials,
    options?: SignUpOptions
  ) => Promise<ValidSignUp | InvalidSignUp>;
  signOut: () => Promise<{ error: AuthError | null }>;
  triggerUpdate: (user: User | null) => void;
};

const AuthContext = createContext<SessionContext | undefined>(undefined);

export const AuthProvider: React.FC<{
  supabase: SupabaseClient<Database>;
  children?: ReactNode;
}> = ({ supabase, children }) => {
  const [isLoading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileModel['Insert'] | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [timezoneInfo, setTimezoneInfo] =
    useState<TimezoneInfo>(defaultTimezoneInfo);
  // const { session, isLoading: isLoadingSession, error, supabaseClient } = useSessionContext()

  const signIn = async (email: string, options?: SignInOptions) => {
    // Need the '/' to match allowed URLs in the Supabase configuration.
    const redirectTo = new URL(window.location.href).origin + '/';

    const bodyData: GenerateLinkBody = {
      email,
      type: 'magiclink',
      redirectTo
    };

    return fetch('/api/auth_links/magiclink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bodyData, redirectTo: options?.redirectTo })
    })
      .then((res) => {
        console.log(res);
        const j = res.json();
        console.log(j);
        if (res.status !== 201) {
          console.log({ statusCode: res.status, m: res.statusText });
          throw new Error(res.statusText);
        }
        return j;
      })
      .catch((err) => {
        return { user: null, session: null, error: new Error(err) };
      });
  };

  const runUpdates = async (user: User | null) => {
    setUser(user);
    if (user == null) {
      return;
    }
    getProfileInfo(user)
      .then(setProfile)
      .catch((error) => {
        myLog(error);
      });
    checkIfOrganizer(user)
      .then(setIsOrganizer)
      .catch((error) => {
        myLog(error);
      });
    queryTimezonePreferences(user)
      .then(setTimezoneInfo)
      .catch((error) => {
        myLog(error);
      });
  };

  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  useEffect(() => {
    const initialFunction = async () => {
      const session = await supabase.auth
        .getSession()
        .then(({ data: { session }, error }) => {
          if (error) {
            myLog(error);
          }
          return session;
        });
      setCurrentSession(session);
      runUpdates(session?.user ?? null);
      setLoading(false);
    };

    initialFunction();
  }, []);

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((ev, session) => {
      if (session?.user?.id === currentSession?.user?.id) {
        myLog('early exit from onAuthStateChange');
        return;
      }
      myLog(ev);
      myLog({ session, currentSession });
      setLoading(true);
      runUpdates(session?.user ?? null);
      setLoading(false);
      setCurrentSession(session);
    });
    return subscription.unsubscribe;
  }, [currentSession]);

  const value: SessionContext = {
    user,
    profile: profile as ProfileModel['Row'],
    isOrganizer,
    isLoading,
    signIn,
    signUp,
    signOut: async () => {
      const signOutReturn = await supabase.auth.signOut();
      runUpdates(null);
      return signOutReturn;
    },
    timezoneInfo,
    triggerUpdate: async (user: User | null) => runUpdates(user)
  };

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthContext.Provider value={value}>
        {!isLoading && children}
      </AuthContext.Provider>
    </SessionContextProvider>
  );
};

// export the useSession hook
export const useSession = () => {
  const context = useContext(AuthContext);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return context!;
};

const signUp = async (cred: UserCredentials, options?: SignUpOptions) => {
  const bodyData: GenerateLinkBody = {
    email: cred.email,
    type: 'signup',
    redirectTo: options?.redirectTo,
    signUpData: {
      password: cred.password,
      data: options?.data as NewUserInformation
    }
  };

  return fetch('/api/auth_links/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ bodyData })
  }).then((res) => res.json());
};
