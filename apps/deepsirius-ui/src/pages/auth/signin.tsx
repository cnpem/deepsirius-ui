import type { GetServerSidePropsContext } from 'next';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { LayoutNav } from '~/components/layout-nav';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { getServerAuthSession } from '~/server/auth';

type FormData = {
  email: string;
  password: string;
};
function Form() {
  const router = useRouter();
  const query = router.query;
  const callbackUrl = (query.callbackUrl as string) || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    toast.info('Signing in...');
    const res = await signIn('credentials', {
      email: data.email,
      password: data.password,
      callbackUrl: callbackUrl,
      redirect: false,
    });
    if (res?.ok) {
      toast.success('Sign in successfully!');
      await router.push(callbackUrl);
    }
    if (!res?.ok) {
      const error = res?.error;
      toast.error(error);
    }
  };

  return (
    <Card className='w-full max-w-md sm:w-[400px]'>
      <CardHeader>
        <CardTitle>
          <span className="text-fuchsia-600 dark:text-fuchsia-500">Deep</span>
          Sirius
        </CardTitle>
        <CardDescription>Sign in with your credentials</CardDescription>
      </CardHeader>
      <CardContent>
    <form
      className="space-y-12"
      // Note: This is a workaround for a bug in react-hook-form
      // See: https://github.com/orgs/react-hook-form/discussions/8020#discussioncomment-3362300
      onSubmit={(...args) => void handleSubmit(onSubmit)(...args)}
    >
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="email">Email</Label>
        {errors.email && (
          <p role="alert" className="text-red-600">
            {errors.email?.message}
          </p>
        )}
        <Input
          id="username"
          placeholder="user.name@example.com"
          {...register('email', { required: 'Email is required!' })}
        />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="password">Password</Label>
        {errors.password && (
          <p role="alert" className="text-red-600">
            {errors.password?.message}
          </p>
        )}
        <Input
          id="password"
          type="password"
          placeholder="********"
          {...register('password', {
            required: 'Password is required!',
          })}
        />
      </div>
      <Button className="w-full" type="submit">
        Sign in
      </Button>
    </form>
    </CardContent>
    </Card>

  );
}

export default function SignIn() {
  return (
    <LayoutNav>
      <div className="flex items-center justify-center">
        <Form />
      </div>
    </LayoutNav>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerAuthSession(context);

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    if (!session.user.name) {
      throw new Error('User name not found');
    }
    return { redirect: { destination: '/u/' + session.user.name } };
  }

  return {
    props: {
      session,
    },
  };
}
