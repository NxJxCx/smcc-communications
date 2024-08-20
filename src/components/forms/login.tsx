'use client';
import { login } from '@/actions/auth';
import { UserRoles } from '@/lib/models/interfaces';
import type { LoginFormState } from '@/lib/types';
import { Alert, Pane, StatusIndicator, TextInputField, toaster } from 'evergreen-ui';
import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { FormButton } from './button';

export function LoginForm({ role = UserRoles.User } : { role?: UserRoles }) {

  const loginAction = login.bind(null, role);
  const [state, action] = useFormState(loginAction, undefined)

  const { pending } = useFormStatus()

  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!state?.errors && state?.message === 'Logged In') {
      toaster.success(state.message)
      window.location.href = '/' + role
    }
  }, [state, role])

  return (
    <form action={action} ref={formRef}>
      {
        !!state?.errors && (
          <Alert
            intent="danger"
            marginBottom="10px"
            title={state.message}
          >
            {state.errors.email?.map((emsg) => <StatusIndicator key={emsg} color='danger' width="100%">{emsg}</StatusIndicator>)}
            {state.errors.password?.map((emsg) => <StatusIndicator key={emsg} color='danger'>{emsg}</StatusIndicator>)}
            {(state as LoginFormState)!.errors!.credentials?.map((emsg) => <StatusIndicator key={emsg} color='danger'>{emsg}</StatusIndicator>)}
          </Alert>
        )
      }
      <Pane>
        <TextInputField
          label="Email or Phone Number"
          id="email"
          name="email"
          placeholder="Email or Phone Number"
          isInvalid={!!state?.errors?.email}
        />
      </Pane>
      <Pane>
        <TextInputField
          type="password"
          label="Password"
          id="password"
          name="password"
          placeholder="Password"
          isInvalid={!!state?.errors?.password}
        />
      </Pane>
      <Pane display="flex" marginTop="10px">
        <FormButton label={"Login"} loading={'Logging in...'} isLoading={pending} marginX="auto" width="100%" appearance="primary" intent='success' />
      </Pane>
    </form>
  )
}